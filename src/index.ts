import * as process from "process";
import { Connection } from "odbc";
import knex from "knex";
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

  wrapIdentifierImpl(value: any) {
    // override default wrapper ("). we don't want to use it since
    // it makes identifiers case-sensitive in DB2
    if (value.includes("knex_migrations")) {
      return value.toUpperCase();
    }
    return value;
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
    return await this.driver.pool(this._getConnectionString(connectionConfig));
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
  async _query(pool: any, obj: any) {
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
      const rows: any = await pool.query(obj.sql, obj.bindings);
      if (rows) {
        obj.response = { rows, rowCount: rows.length };
      }
    } else {
      try {
        const connection = await pool.connect();
        const statement = await connection.createStatement();
        await statement.prepare(obj.sql);
        if (obj.bindings) {
          await statement.bind(obj.bindings);
        }
        const result = await statement.execute();
        obj.response = { rows: [result.count], rowCount: result.count };
      } catch (err: any) {
        console.error(err);
        throw new Error(err);
      }
    }
    console.log({ obj });

    return obj;
  }

  transaction() {
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
    // TODO: verify correctness
    if (obj === null) return null;

    const resp = obj.response;
    const method = obj.sqlMethod;
    const { rows } = resp;

    if (obj.output) return obj.output.call(runner, resp);

    switch (method) {
      case "select":
      case "pluck":
      case "first": {
        if (method === "pluck") return rows.map(obj.pluck);
        return method === "first" ? rows[0] : rows;
      }
      case "insert":
      case "del":
      case "delete":
      case "update":
      case "counter":
        return resp.rowCount;
      default:
        return resp;
    }
  }
}

export const DB2Dialect = DB2Client;
export default DB2Client;
