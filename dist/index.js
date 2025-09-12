var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  DB2Dialect: () => DB2Dialect,
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);
var import_node_process = __toESM(require("process"));
var import_knex = require("knex");
var import_odbc = __toESM(require("odbc"));

// src/schema/ibmi-compiler.ts
var import_compiler = __toESM(require("knex/lib/schema/compiler"));
var IBMiSchemaCompiler = class extends import_compiler.default {
  hasTable(tableName) {
    const formattedTable = "?";
    const bindings = [String(tableName).toUpperCase()];
    let sql = `select TABLE_NAME from QSYS2.SYSTABLES where TYPE = 'T' and UPPER(TABLE_NAME) = ${formattedTable}`;
    if (this.schema) {
      sql += " and UPPER(TABLE_SCHEMA) = ?";
      bindings.push(String(this.schema).toUpperCase());
    }
    this.pushQuery({
      sql,
      bindings,
      output: (resp) => {
        return resp.rowCount > 0;
      }
    });
  }
  toSQL() {
    const sequence = this.builder._sequence;
    for (let i = 0, l = sequence.length; i < l; i++) {
      const query = sequence[i];
      this[query.method].apply(this, query.args);
    }
    return this.sequence;
  }
};
var ibmi_compiler_default = IBMiSchemaCompiler;

// src/schema/ibmi-tablecompiler.ts
var import_tablecompiler = __toESM(require("knex/lib/schema/tablecompiler"));
var IBMiTableCompiler = class extends import_tablecompiler.default {
  createQuery(columns, ifNot, like) {
    let createStatement = ifNot ? `if object_id('${this.tableName()}', 'U') is null ` : "";
    if (like) {
      createStatement += `select * into ${this.tableName()} from ${this.tableNameLike()} WHERE 0=1`;
    } else {
      createStatement += "create table " + this.tableName() + (this._formatting ? " (\n    " : " (") + columns.sql.join(this._formatting ? ",\n    " : ", ") + this._addChecks() + ")";
    }
    this.pushQuery(createStatement);
    if (this.single.comment) {
      this.comment(this.single.comment);
    }
    if (like) {
      this.addColumns(columns, this.addColumnsPrefix);
    }
  }
  dropUnique(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand("unique", this.tableNameRaw, columns);
    this.pushQuery(`drop index ${indexName}`);
  }
  unique(columns, indexName) {
    let deferrable = "";
    let predicate;
    let finalIndexName;
    if (typeof indexName === "object" && indexName !== null) {
      deferrable = indexName.deferrable || "";
      predicate = indexName.predicate;
      finalIndexName = indexName.indexName;
    } else {
      finalIndexName = indexName;
    }
    if (deferrable && deferrable !== "not deferrable") {
      this.client.logger.warn?.(
        `IBMi: unique index \`${finalIndexName}\` will not be deferrable ${deferrable}.`
      );
    }
    const wrappedIndexName = finalIndexName ? this.formatter.wrap(finalIndexName) : this._indexCommand("unique", this.tableNameRaw, columns);
    columns = this.formatter.columnize(columns);
    const predicateQuery = predicate ? " " + this.client.queryCompiler(predicate).where() : "";
    this.pushQuery(
      `create unique index ${wrappedIndexName} on ${this.tableName()} (${columns})${predicateQuery}`
    );
  }
  // All of the columns to "add" for the query
  addColumns(columns, prefix) {
    prefix = prefix || this.addColumnsPrefix;
    if (columns.sql.length > 0) {
      const columnSql = columns.sql.map((column) => {
        return prefix + column;
      });
      this.pushQuery({
        sql: (this.lowerCase ? "alter table " : "ALTER TABLE ") + this.tableName() + " " + columnSql.join(" "),
        bindings: columns.bindings
      });
    }
  }
  async commit(connection) {
    return await connection.commit();
  }
};
var ibmi_tablecompiler_default = IBMiTableCompiler;

// src/schema/ibmi-columncompiler.ts
var import_columncompiler = __toESM(require("knex/lib/schema/columncompiler"));
var IBMiColumnCompiler = class extends import_columncompiler.default {
  increments(options = { primaryKey: true }) {
    return "int not null generated always as identity (start with 1, increment by 1)" + (this.tableCompiler._canBeAddPrimaryKey(options) ? " primary key" : "");
  }
};
var ibmi_columncompiler_default = IBMiColumnCompiler;

// src/execution/ibmi-transaction.ts
var import_transaction = __toESM(require("knex/lib/execution/transaction"));
var IBMiTransaction = class extends import_transaction.default {
  begin(connection) {
    return connection.beginTransaction();
  }
  rollback(connection) {
    return connection.rollback();
  }
  commit(connection) {
    return connection.commit();
  }
};
var ibmi_transaction_default = IBMiTransaction;

// src/query/ibmi-querycompiler.ts
var import_querycompiler = __toESM(require("knex/lib/query/querycompiler"));
var import_wrappingFormatter = require("knex/lib/formatter/wrappingFormatter");
var IBMiQueryCompiler = class extends import_querycompiler.default {
  formatTimestampLocal(date) {
    const pad = (n) => String(n).padStart(2, "0");
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
  }
  insert() {
    const insertValues = this.single.insert || [];
    const { returning } = this.single;
    if (this.isEmptyInsertValues(insertValues)) {
      if (this.isEmptyObject(insertValues)) {
        return this.buildEmptyInsertResult(returning);
      }
      return "";
    }
    const selectColumns = returning ? this.formatter.columnize(returning) : "IDENTITY_VAL_LOCAL()";
    const returningSql = returning ? this._returning("insert", returning, void 0) + " " : "";
    const insertSql = [
      this.with(),
      `insert into ${this.tableName}`,
      this._buildInsertData(insertValues, returningSql)
    ].filter(Boolean).join(" ");
    const sql = `select ${selectColumns} from FINAL TABLE(${insertSql})`;
    return { sql, returning };
  }
  isEmptyInsertValues(insertValues) {
    return Array.isArray(insertValues) && insertValues.length === 0 || this.isEmptyObject(insertValues);
  }
  isEmptyObject(insertValues) {
    return insertValues !== null && typeof insertValues === "object" && !Array.isArray(insertValues) && Object.keys(insertValues).length === 0;
  }
  buildEmptyInsertResult(returning) {
    const selectColumns = returning ? this.formatter.columnize(returning) : "IDENTITY_VAL_LOCAL()";
    const returningSql = returning ? this._returning("insert", returning, void 0) + " " : "";
    const insertSql = [
      this.with(),
      `insert into ${this.tableName}`,
      returningSql + this._emptyInsertValue
    ].filter(Boolean).join(" ");
    const sql = `select ${selectColumns} from FINAL TABLE(${insertSql})`;
    return { sql, returning };
  }
  _buildInsertData(insertValues, returningSql) {
    const insertData = this._prepInsert(insertValues);
    if (insertData.columns.length > 0) {
      const columnsSql = `(${this.formatter.columnize(insertData.columns)})`;
      const valuesSql = `(${this._buildInsertValues(insertData)})`;
      return `${columnsSql} ${returningSql}values ${valuesSql}`;
    }
    if (Array.isArray(insertValues) && insertValues.length === 1 && insertValues[0]) {
      return returningSql + this._emptyInsertValue;
    }
    return "";
  }
  _prepInsert(data) {
    if (typeof data === "object" && data?.migration_time) {
      const parsed = new Date(data.migration_time);
      if (!isNaN(parsed.getTime())) {
        data.migration_time = this.formatTimestampLocal(parsed);
      }
    }
    const isRaw = (0, import_wrappingFormatter.rawOrFn)(
      data,
      void 0,
      this.builder,
      this.client,
      this.bindingsHolder
    );
    if (isRaw) {
      return isRaw;
    }
    const dataArray = Array.isArray(data) ? data : data ? [data] : [];
    if (dataArray.length === 0) {
      return { columns: [], values: [] };
    }
    const allColumns = /* @__PURE__ */ new Set();
    for (const item of dataArray) {
      if (item != null) {
        Object.keys(item).forEach((key) => allColumns.add(key));
      }
    }
    const columns = Array.from(allColumns).sort();
    const values = [];
    for (const item of dataArray) {
      if (item == null) {
        break;
      }
      const row = columns.map((column) => item[column] ?? void 0);
      values.push(row);
    }
    return {
      columns,
      values
    };
  }
  update() {
    const withSQL = this.with();
    const updates = this._prepUpdate(this.single.update);
    const where = this.where();
    const order = this.order();
    const limit = this.limit();
    const { returning } = this.single;
    const baseUpdateSql = [
      withSQL,
      `update ${this.single.only ? "only " : ""}${this.tableName}`,
      "set",
      updates.join(", "),
      where,
      order,
      limit
    ].filter(Boolean).join(" ");
    if (returning) {
      this.client.logger.warn?.(
        "IBMi DB2 does not support returning in update statements, only inserts"
      );
      const selectColumns = this.formatter.columnize(this.single.returning);
      const sql = `select ${selectColumns} from FINAL TABLE(${baseUpdateSql})`;
      return { sql, returning };
    }
    return { sql: baseUpdateSql, returning };
  }
  /**
   * Handle returning clause for IBMi DB2 queries
   * Note: IBMi DB2 has limited support for RETURNING clauses
   * @param method - The SQL method (insert, update, delete)
   * @param value - The returning value
   * @param withTrigger - Trigger support (currently unused)
   */
  _returning(method, value, withTrigger) {
    switch (method) {
      case "update":
      case "insert":
        return value ? `${withTrigger ? " into #out" : ""}` : "";
      case "del":
        return value ? `${withTrigger ? " into #out" : ""}` : "";
      case "rowcount":
        return value ? "select @@rowcount" : "";
      default:
        return "";
    }
  }
  columnizeWithPrefix(prefix, target) {
    const columns = typeof target === "string" ? [target] : target;
    let str = "";
    let i = -1;
    while (++i < columns.length) {
      if (i > 0) str += ", ";
      str += prefix + this.wrap(columns[i]);
    }
    return str;
  }
};
var ibmi_querycompiler_default = IBMiQueryCompiler;

// src/index.ts
var import_node_stream = require("stream");
var DB2Client = class extends import_knex.knex.Client {
  constructor(config) {
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
      if (!config.pool || config.pool && config.pool.max !== 0) {
        this.initializePool(config);
      }
    }
    this.valueForUndefined = this.raw("DEFAULT");
    if (config.useNullAsDefault) {
      this.valueForUndefined = null;
    }
  }
  _driver() {
    return import_odbc.default;
  }
  wrapIdentifierImpl(value) {
    return value;
  }
  printDebug(message) {
    if (import_node_process.default.env.DEBUG === "true") {
      if (this.logger.debug) {
        this.logger.debug("knex-ibmi: " + message);
      }
    }
  }
  printError(message) {
    if (this.logger.error) {
      this.logger.error("knex-ibmi: " + message);
    }
  }
  printWarn(message) {
    if (import_node_process.default.env.DEBUG === "true") {
      if (this.logger.warn) {
        this.logger.warn("knex-ibmi: " + message);
      }
    }
  }
  // Get a raw connection, called by the pool manager whenever a new
  // connection needs to be added to the pool.
  async acquireRawConnection() {
    this.printDebug("acquiring raw connection");
    const connectionConfig = this.config.connection;
    if (!connectionConfig) {
      return this.printError("There is no connection config defined");
    }
    this.printDebug(
      "connection config: " + this._getConnectionString(connectionConfig)
    );
    if (this.config?.pool) {
      const poolConfig = {
        connectionString: this._getConnectionString(connectionConfig),
        connectionTimeout: this.config?.acquireConnectionTimeout || 6e4,
        initialSize: this.config?.pool?.min || 2,
        maxSize: this.config?.pool?.max || 10,
        reuseConnection: true
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
  async destroyRawConnection(connection) {
    this.printDebug("destroy connection");
    return await connection.close();
  }
  _getConnectionString(connectionConfig) {
    const connectionStringParams = connectionConfig.connectionStringParams || {};
    const connectionStringExtension = Object.keys(
      connectionStringParams
    ).reduce((result, key) => {
      const value = connectionStringParams[key];
      return `${result}${key}=${value};`;
    }, "");
    return `${`DRIVER=${connectionConfig.driver};SYSTEM=${connectionConfig.host};HOSTNAME=${connectionConfig.host};PORT=${connectionConfig.port};DATABASE=${connectionConfig.database};UID=${connectionConfig.user};PWD=${connectionConfig.password};` + connectionStringExtension}`;
  }
  // Runs the query on the specified connection, providing the bindings
  async _query(connection, obj) {
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
  normalizeQueryObject(obj) {
    if (!obj || typeof obj === "string") {
      return { sql: obj };
    }
    return obj;
  }
  determineQueryMethod(obj) {
    return (obj.hasOwnProperty("method") && obj.method !== "raw" ? obj.method : obj.sql.split(" ")[0]).toLowerCase();
  }
  isSelectMethod(method) {
    return method === "select" || method === "first" || method === "pluck";
  }
  async executeSelectQuery(connection, obj) {
    const rows = await connection.query(
      obj.sql,
      obj.bindings
    );
    if (rows) {
      obj.response = { rows, rowCount: rows.length };
    }
  }
  async executeStatementQuery(connection, obj) {
    try {
      const statement = await connection.createStatement();
      await statement.prepare(obj.sql);
      if (obj.bindings) {
        await statement.bind(obj.bindings);
      }
      const result = await statement.execute();
      this.printDebug(String(result));
      obj.response = this.formatStatementResponse(result);
    } catch (err) {
      this.printError(JSON.stringify(err));
      throw err;
    }
  }
  /**
   * Format statement response from ODBC driver
   * Handles special case for IDENTITY_VAL_LOCAL() function
   */
  formatStatementResponse(result) {
    const isIdentityQuery = result.statement?.includes("IDENTITY_VAL_LOCAL()");
    if (isIdentityQuery && result.columns?.length > 0) {
      return {
        rows: result.map(
          (row) => row[result.columns[0].name]
        ),
        rowCount: result.count
      };
    }
    return {
      rows: result,
      rowCount: result.count || 0
    };
  }
  async _stream(connection, obj, stream, options) {
    if (!obj.sql) throw new Error("A query is required to stream results");
    return new Promise((resolve, reject) => {
      stream.on("error", reject);
      stream.on("end", resolve);
      connection.query(
        obj.sql,
        obj.bindings,
        {
          cursor: true,
          fetchSize: options?.fetchSize || 1
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
  _createCursorStream(cursor) {
    const parentThis = this;
    return new import_node_stream.Readable({
      objectMode: true,
      read() {
        cursor.fetch((error, result) => {
          if (error) {
            parentThis.printError(JSON.stringify(error, null, 2));
          }
          if (!cursor.noData) {
            this.push(result);
          } else {
            cursor.close((closeError) => {
              if (closeError) {
                parentThis.printError(JSON.stringify(closeError, null, 2));
              }
              if (result) {
                this.push(result);
              }
              this.push(null);
            });
          }
        });
      }
    });
  }
  transaction(container, config, outerTx) {
    return new ibmi_transaction_default(this, container, config, outerTx);
  }
  schemaCompiler(tableBuilder) {
    return new ibmi_compiler_default(this, tableBuilder);
  }
  tableCompiler(tableBuilder) {
    return new ibmi_tablecompiler_default(this, tableBuilder);
  }
  columnCompiler(tableCompiler, columnCompiler) {
    return new ibmi_columncompiler_default(this, tableCompiler, columnCompiler);
  }
  queryCompiler(builder, bindings) {
    return new ibmi_querycompiler_default(this, builder, bindings);
  }
  processResponse(obj, runner) {
    if (obj === null) return null;
    const validationResult = this.validateResponse(obj);
    if (validationResult !== null) return validationResult;
    const { response } = obj;
    if (obj.output) {
      return obj.output(runner, response);
    }
    return this.processSqlMethod(obj);
  }
  validateResponse(obj) {
    if (!obj.response) {
      this.printDebug("response undefined" + obj);
      return void 0;
    }
    if (!obj.response.rows) {
      return this.printError("rows undefined" + obj);
    }
    return null;
  }
  processSqlMethod(obj) {
    const { rows, rowCount } = obj.response;
    switch (obj.sqlMethod) {
      case "select" /* SELECT */:
        return rows;
      case "pluck" /* PLUCK */:
        return rows.map(obj.pluck);
      case "first" /* FIRST */:
        return rows[0];
      case "insert" /* INSERT */:
        return rows;
      case "del" /* DELETE */:
      case "delete" /* DELETE_ALT */:
      case "update" /* UPDATE */:
        return obj.select ? rows : rowCount;
      case "counter" /* COUNTER */:
        return rowCount;
      default:
        return rows;
    }
  }
};
var DB2Dialect = DB2Client;
var index_default = DB2Client;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DB2Dialect
});
