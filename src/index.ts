import process from "node:process";
import { Buffer } from "node:buffer";
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

// Simple LRU cache for prepared statements
class StatementCache {
  private cache = new Map<string, any>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(sql: string): any | undefined {
    const stmt = this.cache.get(sql);
    if (stmt) {
      // Move to end (most recently used)
      this.cache.delete(sql);
      this.cache.set(sql, stmt);
    }
    return stmt;
  }

  set(sql: string, stmt: any): void {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value as string | undefined;
      if (firstKey !== undefined) {
        const oldStmt = this.cache.get(firstKey);
        this.cache.delete(firstKey);
        // Close the evicted statement
        if (oldStmt && typeof oldStmt.close === "function") {
          oldStmt.close().catch(() => {});
        }
      }
    }
    this.cache.set(sql, stmt);
  }

  async clear(): Promise<void> {
    const statements = Array.from(this.cache.values());
    this.cache.clear();
    // Close all cached statements
    await Promise.all(
      statements.map((stmt) =>
        stmt && typeof stmt.close === "function"
          ? stmt.close().catch(() => {})
          : Promise.resolve(),
      ),
    );
  }

  size(): number {
    return this.cache.size;
  }
}

class DB2Client extends knex.Client {
  // Per-connection statement cache (WeakMap so it's GC'd with connections)
  private statementCaches = new WeakMap<Connection, StatementCache>();
  private normalizeBigintToString: boolean;

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

    const ibmiConfig = (config as any)?.ibmi;
    this.normalizeBigintToString =
      ibmiConfig?.normalizeBigintToString !== false;
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
      throw new Error("There is no connection config defined");
    }

    this.printDebug(
      "connection config: " + this._getConnectionString(connectionConfig),
    );

    // Use simple ODBC connection - Knex manages the pooling
    // This fixes the double-pooling bug where a new ODBC pool was created per connection
    const connection = await this.driver.connect(
      this._getConnectionString(connectionConfig),
    );

    return connection;
  }

  // Used to explicitly close a connection, called internally by the pool manager
  // when a connection times out or the pool is shutdown.
  async destroyRawConnection(connection: any) {
    this.printDebug("destroy connection");

    // Clean up statement cache if it exists
    const cache = this.statementCaches.get(connection);
    if (cache) {
      await cache.clear();
      this.statementCaches.delete(connection);
    }

    return await connection.close();
  }

  _getConnectionString(connectionConfig: DB2ConnectionConfig) {
    const userParams = connectionConfig.connectionStringParams || {};

    // Use user-provided parameters directly without applying defaults
    // Let the ODBC driver use its own defaults unless explicitly overridden
    //
    // Driver Defaults (for reference):
    // - CMT: 2 (Read uncommitted / *CHG)
    // - TRUEAUTOCOMMIT: 0 (*NONE isolation level)
    // - BLOCKFETCH: 0 (disabled)
    //
    // Reference: https://www.ibm.com/docs/en/i/7.4.0?topic=details-connection-string-keywords
    const connectionStringParams: Record<string, unknown> = { ...userParams };

    const connectionStringExtension = Object.keys(
      connectionStringParams,
    ).reduce((result, key) => {
      const value = connectionStringParams[key];
      return `${result}${key}=${value};`;
    }, "");

    return (
      `DRIVER=${connectionConfig.driver};` +
      `SYSTEM=${connectionConfig.host};` +
      `PORT=${connectionConfig.port || 8471};` +
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

    // Sequential multi-row insert execution path
    if (queryObject._ibmiSequentialInsert) {
      return await this.executeSequentialInsert(connection, queryObject);
    }

    // DELETE ... RETURNING emulation
    if (queryObject._ibmiDeleteReturning) {
      return await this.executeDeleteReturning(connection, queryObject);
    }

    // Debug migration queries (only if DEBUG environment variable is set)
    if (
      process.env.DEBUG === "true" &&
      queryObject.sql &&
      (queryObject.sql.toLowerCase().includes("create table") ||
        queryObject.sql.toLowerCase().includes("knex_migrations"))
    ) {
      this.printDebug(
        `Executing ${method} query: ${queryObject.sql.substring(0, 200)}...`,
      );
      if (queryObject.bindings?.length) {
        this.printDebug(
          `Bindings: ${this.safeStringify(queryObject.bindings)}`,
        );
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
          `Connection error during ${method} query: ${error.message}`,
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
   * Execute UPDATE with returning clause using UPDATE + SELECT approach.
   * Since IBM i DB2 doesn't support FINAL TABLE with UPDATE, we:
   * 1. Execute the UPDATE statement
   * 2. Execute a SELECT to get the updated values using the same WHERE clause
   *
   * @warning RACE CONDITION: In concurrent environments, rows may change between
   * the UPDATE and SELECT operations. If another transaction modifies, inserts,
   * or deletes rows matching the WHERE clause between these two statements,
   * the returned results may not accurately reflect what was updated.
   * For strict consistency requirements, consider:
   * - Using serializable transaction isolation level
   * - Implementing optimistic locking at the application level
   * - Avoiding `.returning()` on UPDATE and fetching data separately
   */
  private async executeUpdateReturning(
    connection: Connection,
    obj: any,
  ): Promise<any> {
    const { _ibmiUpdateReturning } = obj;
    const { updateSql, selectColumns, whereClause, tableName } =
      _ibmiUpdateReturning;

    this.printDebug(
      "Executing UPDATE with returning using transaction approach",
    );

    try {
      // Execute the UPDATE statement
      const updateObj = {
        sql: updateSql,
        bindings: obj.bindings,
        sqlMethod: "update",
      };

      await this.executeStatementQuery(connection, updateObj);

      // Build and execute SELECT to get the updated values
      const selectSql = whereClause
        ? `select ${selectColumns} from ${tableName} ${whereClause}`
        : `select ${selectColumns} from ${tableName}`;

      // Extract only WHERE clause bindings for SELECT
      // UPDATE bindings format: [set_values..., where_values...]
      // We need to figure out how many bindings are for SET vs WHERE
      const updateSqlParts = updateSql.split(" where ");
      const setClausePart = updateSqlParts[0];
      const setBindingCount = (setClausePart.match(/\?/g) || []).length;
      const whereBindings = obj.bindings
        ? obj.bindings.slice(setBindingCount)
        : [];

      const selectObj = {
        sql: selectSql,
        bindings: whereBindings,
        sqlMethod: "select",
        response: undefined,
      };

      await this.executeSelectQuery(connection, selectObj);

      // Return the SELECT results as the final response
      obj.response = selectObj.response;
      obj.sqlMethod = "update";
      obj.select = true; // Mark as SELECT behavior to return rows instead of rowCount
      return obj;
    } catch (error: any) {
      this.printError(`UPDATE with returning failed: ${error.message}`);
      throw this.wrapError(error, "update_returning", obj);
    }
  }

  private async executeSequentialInsert(
    connection: Connection,
    obj: any,
  ): Promise<any> {
    const meta = obj._ibmiSequentialInsert;
    const { rows, columns, tableName, returning } = meta;
    this.printDebug("Executing sequential multi-row insert");
    const insertedRows: any[] = [];

    const transactional =
      (this.config as any)?.ibmi?.sequentialInsertTransactional === true;
    let beganTx = false;
    if (transactional) {
      try {
        await connection.query("BEGIN");
        beganTx = true;
      } catch (_e) {
        this.printWarn(
          "Could not begin transaction for sequential insert; proceeding without",
        );
      }
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const colList = columns.join(", ");
      const placeholders = columns.map(() => "?").join(", ");
      const singleValues = columns.map((c: string) => row[c]);
      const baseInsert = `insert into ${tableName} (${colList}) values (${placeholders})`;
      const selectCols = returning
        ? this.queryCompiler({} as any).formatter.columnize(returning)
        : "IDENTITY_VAL_LOCAL()";
      const wrapped = `select ${selectCols} from FINAL TABLE(${baseInsert})`;
      const singleObj = {
        sql: wrapped,
        bindings: singleValues,
        sqlMethod: "insert",
        response: undefined,
      };
      await this.executeStatementQuery(connection, singleObj);
      const resp = (singleObj as any).response?.rows;
      if (resp) insertedRows.push(...resp);
    }

    if (transactional && beganTx) {
      try {
        await connection.query("COMMIT");
      } catch (commitErr) {
        this.printError(
          "Commit failed for sequential insert, attempting rollback: " +
            (commitErr as any)?.message,
        );
        try {
          await connection.query("ROLLBACK");
        } catch {
          /* ignore */
        }
        throw commitErr;
      }
    }

    obj.response = { rows: insertedRows, rowCount: insertedRows.length };
    obj.sqlMethod = "insert";
    obj.select = true;
    return obj;
  }

  private async executeDeleteReturning(
    connection: Connection,
    obj: any,
  ): Promise<any> {
    const meta = obj._ibmiDeleteReturning;
    const { deleteSql, selectColumns, whereClause, tableName } = meta;
    this.printDebug("Executing DELETE with returning emulation");
    try {
      // SELECT rows first
      const selectSql = whereClause
        ? `select ${selectColumns} from ${tableName} ${whereClause}`
        : `select ${selectColumns} from ${tableName}`;
      const selectObj = {
        sql: selectSql,
        bindings: obj.bindings,
        sqlMethod: "select",
        response: undefined,
      };
      await this.executeSelectQuery(connection, selectObj);
      const rowsToReturn = (selectObj as any).response?.rows || [];
      // Execute DELETE
      const deleteObj = {
        sql: deleteSql,
        bindings: obj.bindings,
        sqlMethod: "del",
        response: undefined,
      };
      await this.executeStatementQuery(connection, deleteObj);
      obj.response = { rows: rowsToReturn, rowCount: rowsToReturn.length };
      obj.sqlMethod = "del";
      obj.select = true;
      return obj;
    } catch (error: any) {
      this.printError(`DELETE with returning failed: ${error.message}`);
      throw this.wrapError(error, "delete_returning", obj);
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
    obj: { sql: string; bindings: any[]; response: unknown },
  ): Promise<void> {
    const rows: Record<any, any>[] = await connection.query(
      obj.sql,
      obj.bindings,
    );
    if (rows) {
      const normalizedRows = this.maybeNormalizeBigint(rows);
      obj.response = { rows: normalizedRows, rowCount: normalizedRows.length };
    }
  }

  private async executeStatementQuery(
    connection: Connection,
    obj: any,
  ): Promise<void> {
    let statement: any;
    let usedCache = false;
    const cacheEnabled =
      (this.config as any)?.ibmi?.preparedStatementCache === true;

    try {
      // Try to use cached statement if enabled
      if (cacheEnabled) {
        let cache = this.statementCaches.get(connection);
        if (!cache) {
          const cacheSize =
            (this.config as any)?.ibmi?.preparedStatementCacheSize || 100;
          cache = new StatementCache(cacheSize);
          this.statementCaches.set(connection, cache);
        }

        statement = cache.get(obj.sql);
        if (statement) {
          usedCache = true;
          this.printDebug(
            `Using cached statement for: ${obj.sql.substring(0, 50)}...`,
          );
        } else {
          // Create and cache new statement
          statement = await connection.createStatement();
          await statement.prepare(obj.sql);
          cache.set(obj.sql, statement);
          this.printDebug(`Cached new statement (cache size: ${cache.size()})`);
        }
      } else {
        // No caching - create statement normally
        statement = await connection.createStatement();
        await statement.prepare(obj.sql);
      }

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
              String(e?.state || e?.SQLSTATE || "").toUpperCase() === "02000",
          )
        : false;

      if (
        isDml &&
        (isEmptyOdbcError || hasNoDataState || this.isNoDataError(err))
      ) {
        this.printWarn(
          `ODBC signaled no-data for ${sql.includes("update") ? "UPDATE" : "DELETE"}; treating as 0 rows affected`,
        );
        obj.response = { rows: [], rowCount: 0 };
        return;
      }

      this.printError(this.safeStringify(err));
      throw err;
    } finally {
      // Only close statement if it's not cached
      if (!usedCache && statement && typeof statement.close === "function") {
        try {
          await statement.close();
        } catch (closeErr) {
          // Ignore close errors, log in debug mode only
          this.printDebug(
            `Error closing statement: ${this.safeStringify(closeErr, 2)}`,
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

  private shouldNormalizeBigintValues(): boolean {
    return this.normalizeBigintToString;
  }

  private maybeNormalizeBigint<T>(value: T): T {
    if (value === null || value === undefined) {
      return value;
    }

    if (!this.shouldNormalizeBigintValues()) {
      return value;
    }

    return this.normalizeBigintValue(value);
  }

  private normalizeBigintValue(
    value: any,
    seen: WeakSet<object> = new WeakSet(),
  ): any {
    if (typeof value === "bigint") {
      return value.toString();
    }

    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        value[i] = this.normalizeBigintValue(value[i], seen);
      }
      return value;
    }

    if (value && typeof value === "object") {
      if (
        value instanceof Date ||
        Buffer.isBuffer(value) ||
        ArrayBuffer.isView(value)
      ) {
        return value;
      }

      const obj = value as Record<string, any>;

      if (seen.has(obj)) {
        return value;
      }

      seen.add(obj);

      for (const key of Object.keys(obj)) {
        obj[key] = this.normalizeBigintValue(obj[key], seen);
      }

      return value;
    }

    return value;
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
      const identityRows = result.map(
        (row: { [x: string]: any }) => row[result.columns[0].name],
      );
      const normalizedIdentityRows = this.maybeNormalizeBigint(identityRows);
      return {
        rows: normalizedIdentityRows,
        rowCount: result.count,
      };
    }

    // Normalize result for DML (UPDATE/DELETE/INSERT) to surface rowCount consistently
    const rowCount = typeof result?.count === "number" ? result.count : 0;
    return {
      rows: this.maybeNormalizeBigint(result),
      rowCount,
    };
  }

  async _stream(
    connection: Connection,
    obj: { sql: string; bindings: any[] },
    stream: any,
    options: {
      fetchSize?: number;
    },
  ) {
    if (!obj.sql) throw new Error("A query is required to stream results");

    const optimizedFetchSize =
      options?.fetchSize || this.calculateOptimalFetchSize(obj.sql);

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
        },
      );
    });
  }

  private calculateOptimalFetchSize(sql: string): number {
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
            this.emit("error", error);
            return;
          }

          if (!cursor.noData) {
            this.push(parentThis.maybeNormalizeBigint(result));
          } else {
            isClosed = true;
            cursor.close((closeError: unknown) => {
              if (closeError) {
                parentThis.printError(parentThis.safeStringify(closeError, 2));
              }
              if (result) {
                this.push(parentThis.maybeNormalizeBigint(result));
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
              parentThis.printDebug(
                "Error closing cursor during destroy: " +
                  parentThis.safeStringify(closeError),
              );
            }
            callback(err);
          });
        } else {
          callback(err);
        }
      },
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
    >,
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
        const wrappedError = this.wrapError(error, "custom_output", obj);
        this.printError(
          `Custom output function failed: ${wrappedError.message}`,
        );
        if (this.isConnectionError(error)) {
          throw new Error(
            "Connection closed during query processing - consider using migrations.disableTransactions: true for DDL operations",
          );
        }
        throw wrappedError;
      }
    }

    if (response) {
      this.maybeNormalizeBigint(response.rows);
    }

    // Only validate for standard SQL methods that expect rows structure
    const validationResult = this.validateResponse(obj);
    if (validationResult !== null) return validationResult;

    return this.processSqlMethod(obj);
  }

  private validateResponse(obj: QueryObject): any {
    if (!obj.response) {
      this.printDebug("response undefined " + this.safeStringify(obj));
      return null;
    }

    // For non-select methods, it's fine if rows is empty/undefined as long as rowCount is set.
    // Do not short-circuit here; allow processSqlMethod to normalize the return value.

    if (!obj.response.rows) {
      this.printError("rows undefined " + this.safeStringify(obj));
      return null;
    }

    return null;
  }

  private wrapError(error: any, method: string, queryObject: any): Error {
    const context = {
      method,
      sql: queryObject.sql
        ? queryObject.sql.substring(0, 100) + "..."
        : "unknown",
      timestamp: new Date().toISOString(),
    };

    const contextStr = this.safeStringify(context);

    if (this.isConnectionError(error)) {
      return new Error(
        `IBM i DB2 connection error during ${method}: ${error.message} | Context: ${contextStr}`,
      );
    }

    if (this.isTimeoutError(error)) {
      return new Error(
        `IBM i DB2 timeout during ${method}: ${error.message} | Context: ${contextStr}`,
      );
    }

    if (this.isSQLError(error)) {
      return new Error(
        `IBM i DB2 SQL error during ${method}: ${error.message} | Context: ${contextStr}`,
      );
    }

    // Generic error with context
    return new Error(
      `IBM i DB2 error during ${method}: ${error.message} | Context: ${contextStr}`,
    );
  }

  private shouldRetryQuery(queryObject: any, _method: string): boolean {
    return (
      queryObject.sql?.toLowerCase().includes("systables") ||
      queryObject.sql?.toLowerCase().includes("knex_migrations")
    );
  }

  private async retryQuery(
    connection: Connection,
    queryObject: any,
    method: string,
  ): Promise<any> {
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

  /**
   * Extract SQLSTATE from ODBC error if available
   */
  private getSQLState(error: any): string | null {
    // Check for ODBC error format with state property
    if (error?.odbcErrors && Array.isArray(error.odbcErrors)) {
      for (const odbcErr of error.odbcErrors) {
        const state = odbcErr?.state || odbcErr?.SQLSTATE;
        if (state) return String(state).toUpperCase();
      }
    }
    return null;
  }

  private isConnectionError(error: any): boolean {
    const sqlState = this.getSQLState(error);

    // ODBC SQLSTATE codes for connection errors
    // 08xxx = Connection exception
    if (sqlState) {
      return (
        sqlState.startsWith("08") || // 08001, 08003, 08007, 08S01, etc.
        sqlState === "40003" // Transaction rollback due to connection
      );
    }

    // Fallback to message parsing
    const errorMessage = (error.message || String(error)).toLowerCase();
    return (
      errorMessage.includes("connection") &&
      (errorMessage.includes("closed") ||
        errorMessage.includes("invalid") ||
        errorMessage.includes("terminated") ||
        errorMessage.includes("not connected"))
    );
  }

  private isTimeoutError(error: any): boolean {
    const sqlState = this.getSQLState(error);

    // ODBC SQLSTATE codes for timeout errors
    if (sqlState) {
      return (
        sqlState === "HYT00" || // Timeout expired
        sqlState === "HYT01" // Connection timeout expired
      );
    }

    // Fallback to message parsing
    const errorMessage = (error.message || String(error)).toLowerCase();
    return (
      errorMessage.includes("timeout") || errorMessage.includes("timed out")
    );
  }

  private isSQLError(error: any): boolean {
    const sqlState = this.getSQLState(error);

    // ODBC SQLSTATE codes for SQL errors
    if (sqlState) {
      return (
        sqlState.startsWith("42") || // Syntax error or access violation
        sqlState.startsWith("22") || // Data exception
        sqlState.startsWith("23") || // Integrity constraint violation
        sqlState.startsWith("21") // Cardinality violation
      );
    }

    // Fallback to message parsing
    const errorMessage = (error.message || String(error)).toLowerCase();
    return (
      errorMessage.includes("sql") ||
      errorMessage.includes("syntax") ||
      errorMessage.includes("table") ||
      errorMessage.includes("column")
    );
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
  // General Properties
  DSN?: string;
  SIGNON?: 0 | 1 | 2 | 3 | 4;
  SSL?: 0 | 1;

  // Server Properties
  CMT?: 0 | 1 | 2 | 3 | 4;
  CONNTYPE?: 0 | 1 | 2;
  DATABASE?: string;
  DBQ?: string;
  MAXDECPREC?: 31 | 63;
  MAXDECSCALE?: number;
  MINDIVSCALE?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  NAM?: 0 | 1;

  // Data Types Properties
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
  XMLDECLARATION?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

  // Package Properties
  DFTPKGLIB?: string;
  PKG?: string;
  XDYNAMIC?: 0 | 1;

  // Performance Properties
  BLOCKFETCH?: 0 | 1;
  BLOCKSIZE?: number;
  COMPRESSION?: 0 | 1;
  CONCURRENCY?: 0 | 1;
  CURSORSENSITIVITY?: 0 | 1 | 2;
  EXTCOLINFO?: 0 | 1;
  LAZYCLOSE?: 0 | 1;
  MAXFIELDLEN?: number;
  PREFETCH?: 0 | 1;
  QRYSTGLMT?: number | "*NOMAX";
  QUERYOPTIMIZEGOAL?: 0 | 1 | 2;
  QUERYTIMEOUT?: 0 | 1;

  // Language Properties
  LANGUAGEID?:
    | "AFR"
    | "ARA"
    | "BEL"
    | "BGR"
    | "CAT"
    | "CHS"
    | "CHT"
    | "CSY"
    | "DAN"
    | "DES"
    | "DEU"
    | "ELL"
    | "ENA"
    | "ENB"
    | "ENG"
    | "ENP"
    | "ENU"
    | "ESP"
    | "EST"
    | "FAR"
    | "FIN"
    | "FRA"
    | "FRB"
    | "FRC"
    | "FRS"
    | "GAE"
    | "HEB"
    | "HRV"
    | "HUN"
    | "ISL"
    | "ITA"
    | "ITS"
    | "JPN"
    | "KOR"
    | "LAO"
    | "LVA"
    | "LTU"
    | "MKD"
    | "NLB"
    | "NLD"
    | "NON"
    | "NOR"
    | "PLK"
    | "PTB"
    | "PTG"
    | "RMS"
    | "ROM"
    | "RUS"
    | "SKY"
    | "SLO"
    | "SQI"
    | "SRB"
    | "SRL"
    | "SVE"
    | "THA"
    | "TRK"
    | "UKR"
    | "URD"
    | "VIE";
  SORTTABLE?: string;
  SORTTYPE?: 0 | 1 | 2 | 3;
  SORTWEIGHT?: 0 | 1;

  // Catalog Properties
  CATALOGOPTIONS?: number;
  LIBVIEW?: 0 | 1 | 2;
  REMARKS?: 0 | 1;
  SEARCHPATTERN?: 0 | 1;

  // Conversion Properties
  ALLOWUNSCHAR?: 0 | 1;
  CCSID?: number;
  GRAPHIC?: 0 | 1 | 2 | 3;
  HEXPARSEROPT?: 0 | 1;
  TRANSLATE?: 0 | 1;
  TRIMCHAR?: 0 | 1;
  UNICODESQL?: 0 | 1;
  XLATEDLL?: string;
  XLATEOPT?: number;

  // Diagnostic Properties
  QAQQINILIB?: string;
  SQDIAGCODE?: string;
  TRACE?: number;

  // Other Properties
  ALWAYSCALCLEN?: 0 | 1;
  ALLOWPROCCALLS?: 0 | 1;
  CONCURRENTACCESSRESOLUTION?: 0 | 1 | 2 | 3;
  DB2SQLSTATES?: 0 | 1;
  DATETIMETOCHAR?: number;
  DBCSNoTruncError?: 0 | 1;
  DEBUG?: number;
  KEEPALIVE?: 0 | 1 | 2;
  LOGINTIMEOUT?: number;
  TIMEOUT?: number;
  TRUEAUTOCOMMIT?: 0 | 1;
  NEWPWD?: string;
  XALCS?: 0 | 1;
  XALOCKTIMEOUT?: number;
  XATXNTIMEOUT?: number;
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
  ibmi?: {
    multiRowInsert?: "auto" | "sequential" | "disabled";
    sequentialInsertTransactional?: boolean;
    preparedStatementCache?: boolean; // Enable per-connection statement caching
    preparedStatementCacheSize?: number; // Max cached statements per connection (default: 100)
    readUncommitted?: boolean; // Append WITH UR to SELECT queries
    normalizeBigintToString?: boolean; // Default: true - converts bigint values to strings for JSON safety
  };
}

export const DB2Dialect = DB2Client;
export { IBMiMigrationRunner, createIBMiMigrationRunner };
export default DB2Client;
