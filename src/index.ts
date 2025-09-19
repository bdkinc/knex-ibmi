import process from "node:process";
import knex, { Knex } from "knex";
import odbc, { Connection } from "odbc";
import SchemaCompiler from "./schema/ibmi-compiler";
import TableCompiler from "./schema/ibmi-tablecompiler";
import ColumnCompiler from "./schema/ibmi-columncompiler";
import Transaction from "./execution/ibmi-transaction";
import QueryCompiler from "./query/ibmi-querycompiler";
import { Readable } from "node:stream";
import {
  IBMiMigrationRunner,
  createIBMiMigrationRunner,
} from "./migrations/ibmi-migration-runner";

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

  // Helper method to safely stringify objects that might have circular references
  private safeStringify(obj: any, indent: number = 0): string {
    try {
      return JSON.stringify(obj, null, indent);
    } catch (error) {
      if (error instanceof Error && error.message.includes("circular")) {
        return `[Circular structure - ${typeof obj}]`;
      }
      return `[Stringify error - ${typeof obj}]`;
    }
  }

  _driver() {
    return odbc;
  }

  wrapIdentifierImpl(value: string) {
    // override default wrapper (")
    // we don't want to use it since
    // it makes identifier case-sensitive in DB2

    if (!value) return value;

    // Handle migration tables specifically - keep simple for now
    if (
      value.includes("KNEX_MIGRATIONS") ||
      value.includes("knex_migrations")
    ) {
      return value.toUpperCase();
    }

    // For now, just return the value as-is to avoid binding issues
    // IBM i DB2 is case-insensitive by default anyway
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

    let connection: Connection;

    if (this.config?.pool) {
      const poolConfig = {
        connectionString: this._getConnectionString(connectionConfig),
        connectionTimeout: this.config?.acquireConnectionTimeout || 60000,
        initialSize: this.config?.pool?.min || 2,
        maxSize: this.config?.pool?.max || 10,
        reuseConnection: true,
      };
      const pool = await this.driver.pool(poolConfig);
      connection = await pool.connect();
    } else {
      connection = await this.driver.connect(
        this._getConnectionString(connectionConfig)
      );
    }

    return connection;
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

    return (
      `DRIVER=${connectionConfig.driver};` +
      `SYSTEM=${connectionConfig.host};` +
      `HOSTNAME=${connectionConfig.host};` +
      `PORT=${connectionConfig.port};` +
      `DATABASE=${connectionConfig.database};` +
      `UID=${connectionConfig.user};` +
      `PWD=${connectionConfig.password};` +
      connectionStringExtension
    );
  }

  // Runs the query on the specified connection, providing the bindings
  async _query(connection: Connection, obj: any) {
    const queryObject = this.normalizeQueryObject(obj);
    const method = this.determineQueryMethod(queryObject);
    queryObject.sqlMethod = method;

    // Special handling for UPDATE with returning clause
    if (queryObject._ibmiUpdateReturning) {
      return await this.executeUpdateReturning(connection, queryObject);
    }

    // Debug migration queries (only if DEBUG environment variable is set)
    if (
      process.env.DEBUG === "true" &&
      queryObject.sql &&
      (queryObject.sql.toLowerCase().includes("create table") ||
        queryObject.sql.toLowerCase().includes("knex_migrations"))
    ) {
      this.printDebug(
        `Executing ${method} query: ${queryObject.sql.substring(0, 200)}...`
      );
      if (queryObject.bindings?.length) {
        this.printDebug(`Bindings: ${JSON.stringify(queryObject.bindings)}`);
      }
    }

    try {
      const startTime = Date.now();
      if (this.isSelectMethod(method)) {
        await this.executeSelectQuery(connection, queryObject);
      } else {
        await this.executeStatementQuery(connection, queryObject);
      }
      const endTime = Date.now();

      if (
        process.env.DEBUG === "true" &&
        queryObject.sql &&
        (queryObject.sql.toLowerCase().includes("create table") ||
          queryObject.sql.toLowerCase().includes("knex_migrations"))
      ) {
        this.printDebug(`${method} completed in ${endTime - startTime}ms`);
      }

      this.printDebug(`Query completed: ${method} (${endTime - startTime}ms)`);
      return queryObject;
    } catch (error: any) {
      // Enhanced error handling for connection issues
      const wrappedError = this.wrapError(error, method, queryObject);

      if (this.isConnectionError(error)) {
        this.printError(
          `Connection error during ${method} query: ${error.message}`
        );

        // For critical migration operations, retry once before failing
        if (this.shouldRetryQuery(queryObject, method)) {
          return await this.retryQuery(connection, queryObject, method);
        }

        throw wrappedError;
      }
      throw wrappedError;
    }
  }

  /**
   * Execute UPDATE with returning clause using transaction + SELECT approach
   * Since IBM i DB2 doesn't support FINAL TABLE with UPDATE, we:
   * 1. Execute the UPDATE statement
   * 2. Execute a SELECT to get the updated values using the same WHERE clause
   */
  private async executeUpdateReturning(connection: Connection, obj: any): Promise<any> {
    const { _ibmiUpdateReturning } = obj;
    const { updateSql, selectColumns, whereClause, tableName } = _ibmiUpdateReturning;

    this.printDebug("Executing UPDATE with returning using transaction approach");

    try {
      // Execute the UPDATE statement
      const updateObj = {
        sql: updateSql,
        bindings: obj.bindings,
        sqlMethod: 'update'
      };

      await this.executeStatementQuery(connection, updateObj);

      // Build and execute SELECT to get the updated values
      const selectSql = whereClause
        ? `select ${selectColumns} from ${tableName} ${whereClause}`
        : `select ${selectColumns} from ${tableName}`;

      const selectObj = {
        sql: selectSql,
        bindings: obj.bindings,
        sqlMethod: 'select',
        response: undefined
      };

      await this.executeSelectQuery(connection, selectObj);

      // Return the SELECT results as the final response
      obj.response = selectObj.response;
      obj.sqlMethod = 'update';
      return obj;

    } catch (error: any) {
      this.printError(`UPDATE with returning failed: ${error.message}`);
      throw this.wrapError(error, 'update_returning', obj);
    }
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
    let statement: any;
    try {
      statement = await connection.createStatement();
      await statement.prepare(obj.sql);

      if (obj.bindings) {
        await statement.bind(obj.bindings);
      }

      const result = await statement.execute();
      this.printDebug(String(result));

      obj.response = this.formatStatementResponse(result);
    } catch (err: any) {
      // Special handling for UPDATE/DELETE queries that affect 0 rows
      // Some ODBC drivers signal 0-row DML via empty error/"no data" (SQLSTATE 02000)
      const sql = (obj.sql || "").toLowerCase();
      const isDml =
        obj.sqlMethod === SqlMethod.UPDATE ||
        sql.includes(" update ") ||
        sql.startsWith("update") ||
        obj.sqlMethod === SqlMethod.DELETE ||
        sql.includes(" delete ") ||
        sql.startsWith("delete");

      const odbcErrors = err?.odbcErrors;
      const isEmptyOdbcError =
        Array.isArray(odbcErrors) && odbcErrors.length === 0;
      const hasNoDataState = Array.isArray(odbcErrors)
        ? odbcErrors.some(
            (e: any) =>
              String(e?.state || e?.SQLSTATE || "").toUpperCase() === "02000"
          )
        : false;

      if (
        isDml &&
        (isEmptyOdbcError || hasNoDataState || this.isNoDataError(err))
      ) {
        this.printWarn(
          `ODBC signaled no-data for ${sql.includes("update") ? "UPDATE" : "DELETE"}; treating as 0 rows affected`
        );
        obj.response = { rows: [], rowCount: 0 };
        return;
      }

      this.printError(this.safeStringify(err));
      throw err;
    } finally {
      // Ensure statement is closed to avoid resource leaks/hangs
      if (statement && typeof statement.close === "function") {
        try {
          await statement.close();
        } catch (closeErr) {
          // Ignore close errors, log in debug mode only
          this.printDebug(
            `Error closing statement: ${this.safeStringify(closeErr, 2)}`
          );
        }
      }
    }
  }

  private isNoDataError(error: any): boolean {
    if (!error) return false;
    const msg = String(error?.message || error || "").toLowerCase();
    // Match common indicators of 0-row DML reported as error
    return (
      msg.includes("02000") ||
      msg.includes("no data") ||
      msg.includes("no rows") ||
      msg.includes("0 rows")
    );
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

    // Normalize result for DML (UPDATE/DELETE/INSERT) to surface rowCount consistently
    const rowCount = typeof result?.count === "number" ? result.count : 0;
    return {
      rows: result,
      rowCount,
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

    const optimizedFetchSize = options?.fetchSize || this.calculateOptimalFetchSize(obj.sql);

    return new Promise((resolve, reject) => {
      let isResolved = false;

      const cleanup = () => {
        if (!isResolved) {
          isResolved = true;
        }
      };

      stream.on("error", (err: any) => {
        cleanup();
        reject(err);
      });

      stream.on("end", () => {
        cleanup();
        resolve(undefined);
      });

      connection.query(
        obj.sql,
        obj.bindings,
        {
          cursor: true,
          fetchSize: optimizedFetchSize,
        },
        (error, cursor) => {
          if (error) {
            this.printError(this.safeStringify(error, 2));
            cleanup();
            reject(error);
            return;
          }

          const readableStream = this._createCursorStream(cursor);
          readableStream.on("error", (err) => {
            cleanup();
            reject(err);
          });
          readableStream.pipe(stream);
        }
      );
    });
  }

  private calculateOptimalFetchSize(sql: string): number {
    const sqlLower = sql.toLowerCase();
    const hasJoins = /\s+join\s+/i.test(sql);
    const hasAggregates = /\s+(count|sum|avg|max|min)\s*\(/i.test(sql);
    const hasOrderBy = /\s+order\s+by\s+/i.test(sql);
    const hasGroupBy = /\s+group\s+by\s+/i.test(sql);

    // For complex analytical queries, use larger fetch sizes
    if (hasJoins || hasAggregates || hasOrderBy || hasGroupBy) {
      return 500;
    }

    // For simple queries, use moderate fetch size
    return 100;
  }

  private _createCursorStream(cursor: any): Readable {
    const parentThis = this;
    let isClosed = false;

    return new Readable({
      objectMode: true,
      read() {
        if (isClosed) return;

        cursor.fetch((error: unknown, result: unknown) => {
          if (error) {
            parentThis.printError(parentThis.safeStringify(error, 2));
            isClosed = true;
            this.emit('error', error);
            return;
          }

          if (!cursor.noData) {
            this.push(result);
          } else {
            isClosed = true;
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
      destroy(err, callback) {
        if (!isClosed) {
          isClosed = true;
          cursor.close((closeError: unknown) => {
            if (closeError) {
              parentThis.printDebug('Error closing cursor during destroy: ' + parentThis.safeStringify(closeError));
            }
            callback(err);
          });
        } else {
          callback(err);
        }
      }
    });
  }

  transaction(container: any, config: any, outerTx: any): Knex.Transaction {
    return new (Transaction as any)(this, container, config, outerTx);
  }

  schemaCompiler(tableBuilder: any) {
    return new (SchemaCompiler as any)(this, tableBuilder);
  }

  tableCompiler(tableBuilder: any) {
    return new (TableCompiler as any)(this, tableBuilder);
  }

  columnCompiler(tableCompiler: any, columnCompiler: any) {
    return new (ColumnCompiler as any)(this, tableCompiler, columnCompiler);
  }

  queryCompiler(builder: Knex.QueryBuilder, bindings?: any[]) {
    return new (QueryCompiler as any)(this, builder, bindings);
  }

  // Create IBM i-specific migration runner that bypasses Knex's problematic locking system
  createMigrationRunner(
    config?: Partial<
      import("./migrations/ibmi-migration-runner").IBMiMigrationConfig
    >
  ) {
    // Pass the knex instance from the client context
    const knexInstance = (this as any).context || (this as any);
    return createIBMiMigrationRunner(knexInstance, config);
  }

  processResponse(obj: QueryObject | null, runner: any): any {
    if (obj === null) return null;

    const { response } = obj;

    // If there's a custom output function, use it directly without validation
    // This allows custom queries like hasTable to handle their own response format
    if (obj.output) {
      try {
        const result = obj.output(runner, response);
        return result;
      } catch (error: any) {
        // Enhanced error handling for custom output functions
        const wrappedError = this.wrapError(error, 'custom_output', obj);
        this.printError(
          `Custom output function failed: ${wrappedError.message}`
        );
        if (this.isConnectionError(error)) {
          throw new Error(
            "Connection closed during query processing - consider using migrations.disableTransactions: true for DDL operations"
          );
        }
        throw wrappedError;
      }
    }

    // Only validate for standard SQL methods that expect rows structure
    const validationResult = this.validateResponse(obj);
    if (validationResult !== null) return validationResult;

    return this.processSqlMethod(obj);
  }

  private validateResponse(obj: QueryObject): any {
    if (!obj.response) {
      this.printDebug("response undefined" + JSON.stringify(obj));
      return null;
    }

    // For non-select methods, it's fine if rows is empty/undefined as long as rowCount is set.
    // Do not short-circuit here; allow processSqlMethod to normalize the return value.

    if (!obj.response.rows) {
      this.printError("rows undefined" + JSON.stringify(obj));
      return null;
    }

    return null;
  }

  private wrapError(error: any, method: string, queryObject: any): Error {
    const context = {
      method,
      sql: queryObject.sql ? queryObject.sql.substring(0, 100) + '...' : 'unknown',
      timestamp: new Date().toISOString()
    };

    if (this.isConnectionError(error)) {
      return new Error(
        `IBM i DB2 connection error during ${method}: ${error.message} | Context: ${JSON.stringify(context)}`
      );
    }

    if (this.isTimeoutError(error)) {
      return new Error(
        `IBM i DB2 timeout during ${method}: ${error.message} | Context: ${JSON.stringify(context)}`
      );
    }

    if (this.isSQLError(error)) {
      return new Error(
        `IBM i DB2 SQL error during ${method}: ${error.message} | Context: ${JSON.stringify(context)}`
      );
    }

    // Generic error with context
    return new Error(
      `IBM i DB2 error during ${method}: ${error.message} | Context: ${JSON.stringify(context)}`
    );
  }

  private shouldRetryQuery(queryObject: any, method: string): boolean {
    return queryObject.sql?.toLowerCase().includes("systables") ||
           queryObject.sql?.toLowerCase().includes("knex_migrations");
  }

  private async retryQuery(connection: Connection, queryObject: any, method: string): Promise<any> {
    this.printDebug(`Retrying ${method} query due to connection error...`);
    try {
      // Wait a moment and retry the query
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (this.isSelectMethod(method)) {
        await this.executeSelectQuery(connection, queryObject);
      } else {
        await this.executeStatementQuery(connection, queryObject);
      }
      return queryObject;
    } catch (retryError: any) {
      this.printError(`Retry failed: ${retryError.message}`);
      // If retry fails, return empty result to prevent migration corruption
      queryObject.response = { rows: [], rowCount: 0 };
      return queryObject;
    }
  }

  private isConnectionError(error: any): boolean {
    const errorMessage = (
      error.message ||
      error.toString ||
      error
    ).toLowerCase();
    return (
      errorMessage.includes("connection") &&
      (errorMessage.includes("closed") ||
        errorMessage.includes("invalid") ||
        errorMessage.includes("terminated") ||
        errorMessage.includes("not connected"))
    );
  }

  private isTimeoutError(error: any): boolean {
    const errorMessage = (
      error.message ||
      error.toString ||
      error
    ).toLowerCase();
    return errorMessage.includes("timeout") || errorMessage.includes("timed out");
  }

  private isSQLError(error: any): boolean {
    const errorMessage = (
      error.message ||
      error.toString ||
      error
    ).toLowerCase();
    return errorMessage.includes("sql") ||
           errorMessage.includes("syntax") ||
           errorMessage.includes("table") ||
           errorMessage.includes("column");
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
        // Align with MySQL: return affected rows as a number for DML
        return obj.select ? rows : (rowCount ?? 0);
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
export { IBMiMigrationRunner, createIBMiMigrationRunner };
export default DB2Client;
