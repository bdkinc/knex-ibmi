var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
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

// node_modules/lodash/isObject.js
var require_isObject = __commonJS({
  "node_modules/lodash/isObject.js"(exports2, module2) {
    function isObject2(value) {
      var type = typeof value;
      return value != null && (type == "object" || type == "function");
    }
    module2.exports = isObject2;
  }
});

// src/index.ts
var src_exports = {};
__export(src_exports, {
  DB2Dialect: () => DB2Dialect,
  default: () => src_default
});
module.exports = __toCommonJS(src_exports);
var import_node_process = __toESM(require("process"));
var import_knex = require("knex");
var import_odbc = __toESM(require("odbc"));

// src/schema/ibmi-compiler.ts
var import_compiler = __toESM(require("knex/lib/schema/compiler"));
var IBMiSchemaCompiler = class extends import_compiler.default {
  hasTable(tableName) {
    const formattedTable = this.client.parameter(
      prefixedTableName(this.schema, tableName),
      this.builder,
      this.bindingsHolder
    );
    const bindings = [tableName];
    let sql = `select TABLE_NAME from QSYS2.SYSTABLES where TYPE = 'T' and TABLE_NAME = ${formattedTable}`;
    if (this.schema) {
      sql += " and TABLE_SCHEMA = ?";
      bindings.push(this.schema);
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
function prefixedTableName(prefix, table) {
  return prefix ? `${prefix}.${table}` : table;
}
var ibmi_compiler_default = IBMiSchemaCompiler;

// src/schema/ibmi-tablecompiler.ts
var import_tablecompiler = __toESM(require("knex/lib/schema/tablecompiler"));
var import_isObject = __toESM(require_isObject());
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
    if ((0, import_isObject.default)(indexName)) {
      deferrable = indexName.deferrable;
      predicate = indexName.predicate;
      indexName = indexName.indexName;
    }
    if (deferrable && deferrable !== "not deferrable") {
      this.client.logger.warn?.(
        `IBMi: unique index \`${indexName}\` will not be deferrable ${deferrable}.`
      );
    }
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand("unique", this.tableNameRaw, columns);
    columns = this.formatter.columnize(columns);
    const predicateQuery = predicate ? " " + this.client.queryCompiler(predicate).where() : "";
    this.pushQuery(
      `create unique index ${indexName} on ${this.tableName()} (${columns})${predicateQuery}`
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
var import_date_fns = require("date-fns");
var IBMiQueryCompiler = class extends import_querycompiler.default {
  insert() {
    const insertValues = this.single.insert || [];
    let sql = `select ${this.single.returning ? this.formatter.columnize(this.single.returning) : "IDENTITY_VAL_LOCAL()"} from FINAL TABLE(`;
    sql += this.with() + `insert into ${this.tableName} `;
    const { returning } = this.single;
    const returningSql = returning ? this._returning("insert", returning, void 0) + " " : "";
    if (Array.isArray(insertValues)) {
      if (insertValues.length === 0) {
        return "";
      }
    } else if (typeof insertValues === "object" && Object.keys(insertValues).length === 0) {
      return {
        sql: sql + returningSql + this._emptyInsertValue,
        returning
      };
    }
    sql += this._buildInsertData(insertValues, returningSql);
    sql += ")";
    return {
      sql,
      returning
    };
  }
  _buildInsertData(insertValues, returningSql) {
    let sql = "";
    const insertData = this._prepInsert(insertValues);
    if (typeof insertData === "string") {
      sql += insertData;
    } else {
      if (insertData.columns.length) {
        sql += `(${this.formatter.columnize(insertData.columns)}`;
        sql += `) ${returningSql}values (` + this._buildInsertValues(insertData) + ")";
      } else if (insertValues.length === 1 && insertValues[0]) {
        sql += returningSql + this._emptyInsertValue;
      } else {
        return "";
      }
    }
    return sql;
  }
  _prepInsert(data) {
    if (typeof data === "object" && data.migration_time) {
      const parsed = new Date(data.migration_time);
      data.migration_time = (0, import_date_fns.format)(parsed, "yyyy-MM-dd HH:mm:ss");
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
    let columns = [];
    const values = [];
    if (!Array.isArray(data)) {
      data = data ? [data] : [];
    }
    let i = -1;
    while (++i < data.length) {
      if (data[i] == null) {
        break;
      }
      if (i === 0) {
        columns = Object.keys(data[i]).sort();
      }
      const row = new Array(columns.length);
      const keys = Object.keys(data[i]);
      let j = -1;
      while (++j < keys.length) {
        const key = keys[j];
        let idx = columns.indexOf(key);
        if (idx === -1) {
          columns = columns.concat(key).sort();
          idx = columns.indexOf(key);
          let k = -1;
          while (++k < values.length) {
            values[k].splice(idx, 0, void 0);
          }
          row.splice(idx, 0, void 0);
        }
        row[idx] = data[i][key];
      }
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
    let sql = "";
    if (returning) {
      sql += `select ${this.formatter.columnize(this.single.returning)} from FINAL TABLE(`;
    }
    sql += withSQL + `update ${this.single.only ? "only " : ""}${this.tableName} set ` + updates.join(", ") + (where ? ` ${where}` : "") + (order ? ` ${order}` : "") + (limit ? ` ${limit}` : "");
    if (returning) {
      sql += `)`;
    }
    return { sql, returning };
  }
  _returning(method, value, withTrigger) {
    switch (method) {
      case "update":
      case "insert":
        return value ? `${withTrigger ? " into #out" : ""}` : "";
      case "del":
        return value ? `${withTrigger ? " into #out" : ""}` : "";
      case "rowcount":
        return value ? "select @@rowcount" : "";
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
    throw new Error(message);
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
    if (!obj || typeof obj == "string") {
      obj = { sql: obj };
    }
    const method = (obj.hasOwnProperty("method") && obj.method !== "raw" ? obj.method : obj.sql.split(" ")[0]).toLowerCase();
    obj.sqlMethod = method;
    if (method === "select" || method === "first" || method === "pluck") {
      const rows = await connection.query(obj.sql, obj.bindings);
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
        if (result.statement.includes("IDENTITY_VAL_LOCAL()")) {
          obj.response = {
            rows: result.map(
              (row) => result.columns && result.columns?.length > 0 ? row[result.columns[0].name] : row
            ),
            rowCount: result.count
          };
        } else {
          obj.response = { rows: result, rowCount: result.count };
        }
      } catch (err) {
        this.printError(JSON.stringify(err));
      }
    }
    this.printDebug(obj);
    return obj;
  }
  async _stream(connection, obj, stream, options) {
    if (!obj.sql) throw new Error("A query is required to stream results");
    return new Promise(async (resolve, reject) => {
      stream.on("error", reject);
      stream.on("end", resolve);
      const cursor = await connection.query(obj.sql, obj.bindings, {
        cursor: true,
        fetchSize: options?.fetchSize || 1
      });
      const readableStream = new import_node_stream.Readable({
        objectMode: true,
        read() {
          cursor.fetch((error, result) => {
            if (error) {
              console.log(error);
              return;
            }
            if (!cursor.noData) {
              this.push(result);
            } else {
              this.push(null);
              cursor.close((error2) => {
                if (error2) {
                  console.log(error2);
                  return;
                }
              });
            }
          });
        }
      });
      readableStream.on("error", (err) => {
        reject(err);
        stream.emit("error", err);
      });
      readableStream.pipe(stream);
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
};
var DB2Dialect = DB2Client;
var src_default = DB2Client;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DB2Dialect
});
