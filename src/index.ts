import * as process from "process";
import { Connection } from "odbc";
import { knex, Knex } from "knex";
import * as odbc from "odbc";
import * as console from "console";
import SchemaCompiler from "./schema/ibmi-compiler";
import TableCompiler from "./schema/ibmi-tablecompiler";
import ColumnCompiler from "./schema/ibmi-columncompiler";
import Transaction from "./execution/ibmi-transaction";
import QueryCompiler from "./query/ibmi-querycompiler";

class DB2Client extends knex.Client {
  constructor(config) {
    super(config);
    this.driverName = "odbc";

    if (this.dialect && !this.config.client) {
      // @ts-ignore
      this.logger.warn(
        `Using 'this.dialect' to identify the client is deprecated and support for it will be removed in the future. Please use configuration option 'client' instead.`,
      );
    }

    const dbClient = this.config.client || this.dialect;
    if (!dbClient) {
      throw new Error(
        `knex: Required configuration option 'client' is missing.`,
      );
    }

    if (config.version) {
      this.version = config.version;
    }

    if (this.driverName && config.connection) {
      this.initializeDriver();
      if (!config.pool || (config.pool && config.pool.max !== 0)) {
        this.initializePool(config);
      }
    }
    this.valueForUndefined = this.raw("DEFAULT");
    if (config.useNullAsDefault) {
      this.valueForUndefined = null;
    }
  }

  _driver() {
    return odbc;
  }

  printDebug(message: string) {
    if (process.env.DEBUG === "true") {
      // @ts-ignore
      this.logger.debug(message);
    }
  }

  // Get a raw connection, called by the pool manager whenever a new
  // connection needs to be added to the pool.
  async acquireRawConnection() {
    this.printDebug("acquiring raw connection");
    const connectionConfig = this.config.connection;
    console.log(this._getConnectionString(connectionConfig));

    if (this.pool) {
      const pool = await this.driver.pool({
        connectionString: this._getConnectionString(connectionConfig),
        connectionTimeout: this.pool?.acquireTimeoutMillis || 60000,
        initialSize: this.pool?.min || 2,
        maxSize: this.pool?.max || 10,
        reuseConnection: true,
      });
      return await pool.connect();
    }

    return await this.driver.connect(
      this._getConnectionString(connectionConfig),
    );
  }

  // Used to explicitly close a connection, called internally by the pool manager
  // when a connection times out or the pool is shutdown.
  async destroyRawConnection(connection: Connection) {
    console.log("destroy connection");
    return await connection.close();
  }

  _getConnectionString(connectionConfig) {
    const connectionStringParams =
      connectionConfig.connectionStringParams || {};
    const connectionStringExtension = Object.keys(
      connectionStringParams,
    ).reduce((result, key) => {
      const value = connectionStringParams[key];
      return `${result}${key}=${value};`;
    }, "");

    return `${
      `DRIVER=${connectionConfig.driver};SYSTEM=${connectionConfig.host};HOSTNAME=${connectionConfig.host};` +
      `PORT=${connectionConfig.port};DATABASE=${connectionConfig.database};` +
      `UID=${connectionConfig.user};PWD=${connectionConfig.password};`
    }${connectionStringExtension}`;
  }

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  async _query(connection: any, obj: any) {
    // @ts-ignore
    // TODO: verify correctness
    if (!obj || typeof obj == "string") obj = { sql: obj };
    const method = (
      obj.hasOwnProperty("method") && obj.method !== "raw"
        ? obj.method
        : obj.sql.split(" ")[0]
    ).toLowerCase();
    obj.sqlMethod = method;

    // Different functions are used since query() doesn't return # of rows affected,
    // which is needed for queries that modify the database

    if (method === "select" || method === "first" || method === "pluck") {
      const rows: any = await connection.query(obj.sql, obj.bindings);
      if (rows) {
        obj.response = { rows, rowCount: rows.length };
      }
    } else {
      await connection.beginTransaction();
      console.log("transaction begun");
      try {
        const statement = await connection.createStatement();
        await statement.prepare(obj.sql);
        console.log({ obj });
        if (obj.bindings) {
          await statement.bind(obj.bindings);
        }
        const result = await statement.execute();
        // this is hacky we check the SQL for the ID column
        // most dialects return the ID of the inserted
        // we check for the IDENTITY scalar function
        // if that function is present, then we just return the value of the
        // IDENTITY column
        if (result.statement.includes("IDENTITY_VAL_LOCAL()")) {
          obj.response = {
            rows: result.map((row) =>
              result.columns.length > 0 ? row[result.columns[0].name] : row,
            ),
            rowCount: result.length,
          };
        } else if (method === "update") {
          // if is in update we need to run a separate select query
          // this also feels hacky and should be cleaned up
          // it would be a lot easier if the table-reference function
          // worked the same for updates as it does inserts
          // on DB2 LUW it does work so if they ever add it we need to fix
          let returningSelect = obj.sql.replace("update", "select * from ");
          returningSelect = returningSelect.replace("where", "and");
          returningSelect = returningSelect.replace("set", "where");
          returningSelect = returningSelect.replace(this.tableName, "where");
          const selectStatement = await connection.createStatement();
          await selectStatement.prepare(returningSelect);
          if (obj.bindings) {
            await selectStatement.bind(obj.bindings);
          }
          const selected = await selectStatement.execute();
          obj.response = {
            rows: selected.map((row) =>
              selected.columns.length > 0 ? row[selected.columns[0].name] : row,
            ),
            rowCount: selected.length,
          };
        } else {
          obj.response = { rows: result, rowCount: result.length };
        }
      } catch (err: any) {
        console.error(err);
        // await connection.rollback()
        throw new Error(err);
      } finally {
        console.log("transaction committed");
        await connection.commit();
      }
    }

    return obj;
  }

  _selectAfterUpdate() {
    const returnSelect = `; SELECT ${
      this.single.returning
        ? // @ts-ignore
          this.formatter.columnize(this.single.returning)
        : "*"
    } from ${this.tableName} `;
    let whereStatement = [this.where()];
    console.log({ whereStatement });
    for (const [key, value] of Object.entries(this.single.update)) {
      whereStatement.push(`WHERE ${key} = ${value}`);
    }
    return returnSelect + whereStatement.join(" and ");
  }

  transaction(container: any, config: any, outerTx: any): Knex.Transaction {
    // @ts-ignore
    return new Transaction(this, ...arguments);
  }

  schemaCompiler() {
    // @ts-ignore
    return new SchemaCompiler(this, ...arguments);
  }

  tableCompiler() {
    // @ts-ignore
    return new TableCompiler(this, ...arguments);
  }

  columnCompiler() {
    // @ts-ignore
    return new ColumnCompiler(this, ...arguments);
  }

  queryCompiler() {
    // @ts-ignore
    return new QueryCompiler(this, ...arguments);
  }

  processResponse(obj: any, runner: any) {
    if (obj === null) return null;

    const resp = obj.response;
    const method = obj.sqlMethod;
    const { rows } = resp;

    if (obj.output) return obj.output.call(runner, resp);

    switch (method) {
      case "select":
        return rows;
      case "pluck":
        return rows.map(obj.pluck);
      case "first":
        return rows[0];
      case "insert":
        return rows;
      case "del":
      case "delete":
      case "update":
        return rows;
      case "counter":
        return resp.rowCount;
      default:
        return resp;
    }
  }
}

export const DB2Dialect = DB2Client;
export default DB2Client;
