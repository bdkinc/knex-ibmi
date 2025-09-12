import process from "node:process";
import { knex, Knex } from "knex";
import odbc, { Connection } from "odbc";
import SchemaCompiler from "./schema/ibmi-compiler";
import TableCompiler from "./schema/ibmi-tablecompiler";
import ColumnCompiler from "./schema/ibmi-columncompiler";
import Transaction from "./execution/ibmi-transaction";
import QueryCompiler from "./query/ibmi-querycompiler";
import { Readable } from "node:stream";

interface QueryObject {
  response?: {
    rows: any[];
    rowCount: number;
  };
  sqlMethod: SqlMethod;
  output?: (runner: any, response: any) => any;
  pluck?: (row: any) => any;
  select?: boolean;
}

enum SqlMethod {
  SELECT = "select",
  PLUCK = "pluck",
  FIRST = "first",
  INSERT = "insert",
  DELETE = "del",
  DELETE_ALT = "delete",
  UPDATE = "update",
  COUNTER = "counter",
}

class DB2Client extends knex.Client {
  constructor(config: Knex.Config<DB2Config>) {
    super(config);
    this.driverName = "odbc";

    if (this.dialect && !this.config.client) {
      this.printWarn(
        `Using 'this.dialect' to identify the client is deprecated and support for it will be removed in the future. Please use configuration option 'client' instead.`
      );
    }

    const dbClient = this.config.client || this.dialect;
    if (!dbClient) {
      throw new Error(
        `knex: Required configuration option 'client' is missing.`
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

  wrapIdentifierImpl(value: string) {
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
      "connection config: " + this._getConnectionString(connectionConfig)
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
      this._getConnectionString(connectionConfig)
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
      connectionStringParams
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
  async _query(connection: Connection, obj: any) {
    const queryObject = this.normalizeQueryObject(obj);
    const method = this.determineQueryMethod(queryObject);
    queryObject.sqlMethod = method;

    if (this.isSelectMethod(method)) {
      await this.executeSelectQuery(connection, queryObject);
    } else {
      await this.executeStatementQuery(connection, queryObject);
    }

    this.printDebug(queryObject);
    return queryObject;
  }

  private normalizeQueryObject(obj: any): any {
    if (!obj || typeof obj === "string") {
      return { sql: obj };
    }
    return obj;
  }

  private determineQueryMethod(obj: any): string {
    return (
      obj.hasOwnProperty("method") && obj.method !== "raw"
        ? obj.method
        : obj.sql.split(" ")[0]
    ).toLowerCase();
  }

  private isSelectMethod(method: string): boolean {
    return method === "select" || method === "first" || method === "pluck";
  }

  private async executeSelectQuery(
    connection: Connection,
    obj: { sql: string; bindings: any[]; response: unknown }
  ): Promise<void> {
    const rows: Record<any, any>[] = await connection.query(
      obj.sql,
      obj.bindings
    );
    if (rows) {
      obj.response = { rows, rowCount: rows.length };
    }
  }

  private async executeStatementQuery(
    connection: Connection,
    obj: any
  ): Promise<void> {
    try {
      const statement = await connection.createStatement();
      await statement.prepare(obj.sql);

      if (obj.bindings) {
        await statement.bind(obj.bindings);
      }

      const result = await statement.execute();
      this.printDebug(String(result));

      obj.response = this.formatStatementResponse(result);
    } catch (err: any) {
      this.printError(JSON.stringify(err));
      throw err;
    }
  }

  /**
   * Format statement response from ODBC driver
   * Handles special case for IDENTITY_VAL_LOCAL() function
   */
  private formatStatementResponse(result: any): {
    rows: any;
    rowCount: number;
  } {
    const isIdentityQuery = result.statement?.includes("IDENTITY_VAL_LOCAL()");

    if (isIdentityQuery && result.columns?.length > 0) {
      return {
        rows: result.map(
          (row: { [x: string]: any }) => row[result.columns[0].name]
        ),
        rowCount: result.count,
      };
    }

    return {
      rows: result,
      rowCount: result.count || 0,
    };
  }

  async _stream(
    connection: Connection,
    obj: { sql: string; bindings: any[] },
    stream: any,
    options: {
      fetchSize?: number;
    }
  ) {
    if (!obj.sql) throw new Error("A query is required to stream results");

    return new Promise((resolve, reject) => {
      stream.on("error", reject);
      stream.on("end", resolve);

      connection.query(
        obj.sql,
        obj.bindings,
        {
          cursor: true,
          fetchSize: options?.fetchSize || 1,
        },
        (error, cursor) => {
          if (error) {
            this.printError(JSON.stringify(error, null, 2));
            stream.emit("error", error);
            reject(error);
            return;
          }

          const readableStream = this._createCursorStream(cursor);
          readableStream.on("error", (err) => {
            reject(err);
            stream.emit("error", err);
          });
          readableStream.pipe(stream);
        }
      );
    });
  }

  private _createCursorStream(cursor: any): Readable {
    const parentThis = this;
    return new Readable({
      objectMode: true,
      read() {
        cursor.fetch((error: unknown, result: unknown) => {
          if (error) {
            parentThis.printError(JSON.stringify(error, null, 2));
          }

          if (!cursor.noData) {
            this.push(result);
          } else {
            cursor.close((closeError: unknown) => {
              if (closeError) {
                parentThis.printError(JSON.stringify(closeError, null, 2));
              }
              if (result) {
                this.push(result);
              }
              this.push(null); // End the stream
            });
          }
        });
      },
    });
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

  processResponse(obj: QueryObject | null, runner: any): any {
    if (obj === null) return null;

    const validationResult = this.validateResponse(obj);
    if (validationResult !== null) return validationResult;

    const { response } = obj;

    if (obj.output) {
      return obj.output(runner, response);
    }

    return this.processSqlMethod(obj);
  }

  private validateResponse(obj: QueryObject): any {
    if (!obj.response) {
      this.printDebug("response undefined" + obj);
      return undefined;
    }

    if (!obj.response.rows) {
      return this.printError("rows undefined" + obj);
    }

    return null;
  }

  private processSqlMethod(obj: QueryObject): any {
    const { rows, rowCount } = obj.response!;

    switch (obj.sqlMethod) {
      case SqlMethod.SELECT:
        return rows;
      case SqlMethod.PLUCK:
        return rows.map(obj.pluck!);
      case SqlMethod.FIRST:
        return rows[0];
      case SqlMethod.INSERT:
        return rows;
      case SqlMethod.DELETE:
      case SqlMethod.DELETE_ALT:
      case SqlMethod.UPDATE:
        return obj.select ? rows : rowCount;
      case SqlMethod.COUNTER:
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
  TFT?: 0 | 1 | 2 | 3 | 4;
  TSP?: 0 | 1 | 2 | 3;
  TSFT?: 0 | 1;
  XMLCURIMPPARSE?: 0 | 1;
  XMLDECLARATION?: 1 | 2 | 3 | 4;
  ALLOWPROCCALLS?: 0 | 1;
  XDYNAMIC?: 0 | 1;
  DFTPKGLIB?: string;
  PKG?: 0 | 1 | 2;
  BLOCKFETCH?: 0 | 1;
  COMPRESSION?: 0 | 1;
  CONCURRENCY?: 0 | 1;
  CURSORSENSITIVITY?: 0 | 1 | 2;
  EXTCOLINFO?:
    | "SQL_DESC_AUTO_UNIQUE_VALUE"
    | "SQL_DESC_BASE_COLUMN_NAME"
    | "SQL_DESC_BASE_TABLE_NAME and SQL_DESC_TABLE_NAME"
    | "SQL_DESC_LABEL"
    | "SQL_DESC_SCHEMA_NAME"
    | "SQL_DESC_SEARCHABLE"
    | "SQL_DESC_UNNAMED"
    | "SQL_DESC_UPDATABLE";
  TRUEAUTOCOMMIT?: 0 | 1;
}

interface DB2ConnectionConfig {
  database: string;
  host: string;
  port: 8471 | 9471 | number;
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
