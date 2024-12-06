import process from "node:process";
import { knex, Knex } from "knex";
import odbc from "odbc";
import SchemaCompiler from "./schema/ibmi-compiler";
import TableCompiler from "./schema/ibmi-tablecompiler";
import ColumnCompiler from "./schema/ibmi-columncompiler";
import Transaction from "./execution/ibmi-transaction";
import QueryCompiler from "./query/ibmi-querycompiler";

class DB2Client extends knex.Client {
  constructor(config: Knex.Config<DB2Config>) {
    super(config);
    this.driverName = "odbc";

    if (this.dialect && !this.config.client) {
      this.printWarn(
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
    // override default wrapper (")
    // we don't want to use it since
    // it makes identifier case-sensitive in DB2
    return value;
  }

  printDebug(message: string) {
    if (process.env.DEBUG === "true") {
      if (this.logger.debug) {
        this.logger.debug("knex-ibmi: " + message);
      }
    }
  }

  printError(message: string) {
    if (this.logger.error) {
      this.logger.error("knex-ibmi: " + message);
    }
    throw new Error(message);
  }

  printWarn(message: string) {
    if (process.env.DEBUG === "true") {
      if (this.logger.warn) {
        this.logger.warn("knex-ibmi: " + message);
      }
    }
  }

  // Get a raw connection, called by the pool manager whenever a new
  // connection needs to be added to the pool.
  async acquireRawConnection() {
    this.printDebug("acquiring raw connection");
    const connectionConfig = this.config.connection as DB2ConnectionConfig;

    if (!connectionConfig) {
      return this.printError("There is no connection config defined");
    }

    this.printDebug(
      "connection config: " + this._getConnectionString(connectionConfig),
    );

    if (this.config?.pool) {
      const poolConfig = {
        connectionString: this._getConnectionString(connectionConfig),
        connectionTimeout: this.config?.acquireConnectionTimeout || 60000,
        initialSize: this.config?.pool?.min || 2,
        maxSize: this.config?.pool?.max || 10,
        reuseConnection: true,
      };
      const pool = await this.driver.pool(poolConfig);
      return await pool.connect();
    }

    return await this.driver.connect(
      this._getConnectionString(connectionConfig),
    );
  }

  // Used to explicitly close a connection, called internally by the pool manager
  // when a connection times out or the pool is shutdown.
  async destroyRawConnection(connection: any) {
    this.printDebug("destroy connection");
    return await connection.close();
  }

  _getConnectionString(connectionConfig: DB2ConnectionConfig) {
    const connectionStringParams =
      connectionConfig.connectionStringParams || {};

    const connectionStringExtension = Object.keys(
      connectionStringParams,
    ).reduce((result, key) => {
      const value = connectionStringParams[key];
      return `${result}${key}=${value};`;
    }, "");

    return `${
      `DRIVER=${connectionConfig.driver};` +
      `SYSTEM=${connectionConfig.host};` +
      `HOSTNAME=${connectionConfig.host};` +
      `PORT=${connectionConfig.port};` +
      `DATABASE=${connectionConfig.database};` +
      `UID=${connectionConfig.user};` +
      `PWD=${connectionConfig.password};` +
      connectionStringExtension
    }`;
  }

  // Runs the query on the specified connection, providing the bindings
  async _query(connection: any, obj: any) {
    if (!obj || typeof obj == "string") {
      obj = { sql: obj };
    }

    const method = (
      obj.hasOwnProperty("method") && obj.method !== "raw"
        ? obj.method
        : obj.sql.split(" ")[0]
    ).toLowerCase();
    obj.sqlMethod = method;

    if (method === "select" || method === "first" || method === "pluck") {
      const rows: any = await connection.query(obj.sql, obj.bindings);
      if (rows) {
        obj.response = { rows, rowCount: rows.length };
      }
    } else {
      try {
        const statement = await connection.createStatement();
        await statement.prepare(obj.sql);

        if (obj.bindings) {
          await statement.bind(obj.bindings);
        }

        const result = await statement.execute();
        this.printDebug(result);
        // TODO: evaluate if this is necessary
        // this is hacky we check the SQL for the ID column
        // we check for the IDENTITY scalar function
        // if that function is present, then we just return the value of the
        // IDENTITY column
        if (result.statement.includes("IDENTITY_VAL_LOCAL()")) {
          obj.response = {
            rows: result.map((row: { [x: string]: any }) =>
              result.columns && result.columns?.length > 0
                ? row[result.columns[0].name]
                : row,
            ),
            rowCount: result.count,
          };
        } else {
          obj.response = { rows: result, rowCount: result.count };
        }
      } catch (err: any) {
        this.printError(JSON.stringify(err));
      }
    }

    this.printDebug(obj);

    return obj;
  }

  transaction(container: any, config: any, outerTx: any): Knex.Transaction {
    return new Transaction(this, container, config, outerTx);
  }

  schemaCompiler(tableBuilder: any) {
    return new SchemaCompiler(this, tableBuilder);
  }

  tableCompiler(tableBuilder: any) {
    return new TableCompiler(this, tableBuilder);
  }

  columnCompiler(tableCompiler: any, columnCompiler: any) {
    return new ColumnCompiler(this, tableCompiler, columnCompiler);
  }

  queryCompiler(builder: Knex.QueryBuilder, bindings?: any[]) {
    return new QueryCompiler(this, builder, bindings);
  }

  processResponse(obj: any, runner: any): any {
    if (obj === null) return null;

    const resp = obj.response;
    const method = obj.sqlMethod;
    if (!resp) {
      this.printDebug("response undefined" + obj);
    }
    const { rows, rowCount } = resp;

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
        if (obj.select) {
          return rows;
        }
        return rowCount;
      case "counter":
        return rowCount;
      default:
        return rows;
    }
  }
}

interface DB2PoolConfig {
  min?: number;
  max?: number;
  acquireConnectionTimeout?: number;
}

interface DB2ConnectionParams {
  CMT?: number;
  CONNTYPE?: number;
  DBQ?: string;
  MAXDECPREC?: 31 | 63;
  MAXDECSCALE?: number;
  MINDIVSCALE?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  NAM?: 0 | 1;
  DFT?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
  DSP?: 0 | 1 | 2 | 3 | 4;
  DEC?: 0 | 1;
  DECFLOATERROROPTION?: 0 | 1;
  DECFLOATROUNDMODE?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  MAPDECIMALFLOATDESCRIBE?: 1 | 3;
  ALLOWPROCCALLS?: 0 | 1;
}

interface DB2ConnectionConfig {
  database: string;
  host: string;
  port: 50000 | number;
  user: string;
  password: string;
  driver: "IBM i Access ODBC Driver" | string;
  connectionStringParams?: DB2ConnectionParams;
}

export interface DB2Config extends Knex.Config {
  client: any;
  connection: DB2ConnectionConfig;
  pool?: DB2PoolConfig;
}

export const DB2Dialect = DB2Client;
export default DB2Client;
