"use strict";
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
var src_exports = {};
__export(src_exports, {
  DB2Dialect: () => DB2Dialect,
  default: () => src_default
});
module.exports = __toCommonJS(src_exports);
var process = __toESM(require("process"));
var import_knex = require("knex");
var odbc = __toESM(require("odbc"));
var console = __toESM(require("console"));

// src/schema/ibmi-compiler.ts
var import_compiler = __toESM(require("knex/lib/schema/compiler"));
var IBMiSchemaCompiler = class extends import_compiler.default {
  hasTable(tableName) {
    const formattedTable = this.client.parameter(
      // @ts-ignore
      prefixedTableName(this.schema, tableName),
      // @ts-ignore
      this.builder,
      // @ts-ignore
      this.bindingsHolder
    );
    const bindings = [tableName];
    let sql = `SELECT TABLE_NAME FROM QSYS2.SYSTABLES WHERE TYPE = 'T' AND TABLE_NAME = ${formattedTable}`;
    if (this.schema) {
      sql += " AND TABLE_SCHEMA = ?";
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
var import_isObject = __toESM(require("lodash/isObject"));
var IBMiTableCompiler = class extends import_tablecompiler.default {
  createQuery(columns, ifNot, like) {
    let createStatement = ifNot ? `if object_id('${this.tableName()}', 'U') is null ` : "";
    if (like) {
      createStatement += `SELECT * INTO ${this.tableName()} FROM ${this.tableNameLike()} WHERE 0=1`;
    } else {
      createStatement += "CREATE TABLE " + // @ts-ignore
      this.tableName() + // @ts-ignore
      (this._formatting ? " (\n    " : " (") + // @ts-ignore
      columns.sql.join(this._formatting ? ",\n    " : ", ") + // @ts-ignore
      this._addChecks() + ")";
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
    let deferrable;
    let predicate;
    if ((0, import_isObject.default)(indexName)) {
      ({ indexName, deferrable, predicate } = indexName);
    }
    if (deferrable && deferrable !== "not deferrable") {
      this.client.logger.warn(
        `IBMi: unique index \`${indexName}\` will not be deferrable ${deferrable}.`
      );
    }
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand("unique", this.tableNameRaw, columns);
    columns = this.formatter.columnize(columns);
    const predicateQuery = predicate ? " " + this.client.queryCompiler(predicate).where() : "";
    this.pushQuery(
      // @ts-ignore
      `CREATE UNIQUE INDEX ${indexName} ON ${this.tableName()} (${columns})${predicateQuery}`
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
        sql: (
          // @ts-ignore
          (this.lowerCase ? "alter table " : "ALTER TABLE ") + // @ts-ignore
          this.tableName() + " " + columnSql.join(" ")
        ),
        bindings: columns.bindings
      });
    }
  }
  async commit(conn, value) {
    return await conn.commit();
  }
};
var ibmi_tablecompiler_default = IBMiTableCompiler;

// src/schema/ibmi-columncompiler.ts
var import_columncompiler = __toESM(require("knex/lib/schema/columncompiler"));
var IBMiColumnCompiler = class extends import_columncompiler.default {
  increments(options = { primaryKey: true }) {
    return "int not null generated always as identity (start with 1, increment by 1)" + // @ts-ignore
    (this.tableCompiler._canBeAddPrimaryKey(options) ? " primary key" : "");
  }
};
var ibmi_columncompiler_default = IBMiColumnCompiler;

// src/execution/ibmi-transaction.ts
var import_transaction = __toESM(require("knex/lib/execution/transaction"));
var IBMiTransaction = class extends import_transaction.default {
  async begin(conn) {
    const connection = await conn.connect();
    await connection.beginTransaction();
    return connection;
  }
  async rollback(conn) {
    const connection = await conn.connect();
    await connection.rollback();
    return connection;
  }
  async commit(conn) {
    await conn.commit();
    return conn;
  }
};
var ibmi_transaction_default = IBMiTransaction;

// src/query/ibmi-querycompiler.ts
var import_querycompiler = __toESM(require("knex/lib/query/querycompiler"));
var import_isObject2 = __toESM(require("lodash/isObject"));
var import_wrappingFormatter = require("knex/lib/formatter/wrappingFormatter");
var import_date_fns = require("date-fns");
var import_isEmpty = __toESM(require("lodash/isEmpty"));
var IBMiQueryCompiler = class extends import_querycompiler.default {
  insert() {
    const insertValues = this.single.insert || [];
    let sql = `SELECT ${// @ts-ignore
    this.single.returning ? (
      // @ts-ignore
      this.formatter.columnize(this.single.returning)
    ) : "IDENTITY_VAL_LOCAL()"} FROM FINAL TABLE(`;
    sql += this.with() + `insert into ${this.tableName} `;
    const { returning } = this.single;
    const returningSql = returning ? (
      // @ts-ignore
      this._returning("insert", returning) + " "
    ) : "";
    if (Array.isArray(insertValues)) {
      if (insertValues.length === 0) {
        return "";
      }
    } else if (typeof insertValues === "object" && (0, import_isEmpty.default)(insertValues)) {
      return {
        // @ts-ignore
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
        sql += `) ${returningSql}values (` + // @ts-ignore
        this._buildInsertValues(insertData) + ")";
      } else if (insertValues.length === 1 && insertValues[0]) {
        sql += returningSql + this._emptyInsertValue;
      } else {
        return "";
      }
    }
    return sql;
  }
  _prepInsert(data) {
    if ((0, import_isObject2.default)(data)) {
      if (data.hasOwnProperty("migration_time")) {
        const parsed = new Date(data.migration_time);
        data.migration_time = (0, import_date_fns.format)(parsed, "yyyy-MM-dd HH:mm:ss");
      }
    }
    const isRaw = (0, import_wrappingFormatter.rawOrFn)(
      data,
      void 0,
      // @ts-ignore
      this.builder,
      // @ts-ignore
      this.client,
      // @ts-ignore
      this.bindingsHolder
    );
    if (isRaw)
      return isRaw;
    let columns = [];
    const values = [];
    if (!Array.isArray(data))
      data = data ? [data] : [];
    let i = -1;
    while (++i < data.length) {
      if (data[i] == null)
        break;
      if (i === 0)
        columns = Object.keys(data[i]).sort();
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
  _returning(method, value, withTrigger) {
    switch (method) {
      case "update":
      case "insert":
        return value ? (
          // @ts-ignore
          `${withTrigger ? " into #out" : ""}`
        ) : "";
      case "del":
        return value ? (
          // @ts-ignore
          `${withTrigger ? " into #out" : ""}`
        ) : "";
      case "rowcount":
        return value ? ";select @@rowcount" : "";
    }
  }
  columnizeWithPrefix(prefix, target) {
    const columns = typeof target === "string" ? [target] : target;
    let str = "", i = -1;
    while (++i < columns.length) {
      if (i > 0)
        str += ", ";
      str += prefix + this.wrap(columns[i]);
    }
    return str;
  }
};
var ibmi_querycompiler_default = IBMiQueryCompiler;

// src/index.ts
var DB2Client = class extends import_knex.knex.Client {
  constructor(config) {
    super(config);
    this.driverName = "odbc";
    if (this.dialect && !this.config.client) {
      this.logger.warn(
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
    return odbc;
  }
  printDebug(message) {
    if (process.env.DEBUG === "true") {
      this.logger.debug(message);
    }
  }
  // Get a raw connection, called by the pool manager whenever a new
  // connection needs to be added to the pool.
  async acquireRawConnection() {
    this.printDebug("acquiring raw connection");
    const connectionConfig = this.config.connection;
    console.log(this._getConnectionString(connectionConfig));
    console.log({ config: this.config, pool: this.pool });
    if (this.config?.connection?.pool) {
      const poolConfig = {
        connectionString: this._getConnectionString(connectionConfig),
        connectionTimeout: this.config?.connection?.acquireConnectionTimeout || 6e4,
        initialSize: this.config?.connection?.pool?.min || 2,
        maxSize: this.config?.connection?.pool?.max || 10,
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
    console.log("destroy connection");
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
    return `${`DRIVER=${connectionConfig.driver};SYSTEM=${connectionConfig.host};HOSTNAME=${connectionConfig.host};PORT=${connectionConfig.port};DATABASE=${connectionConfig.database};UID=${connectionConfig.user};PWD=${connectionConfig.password};`}${connectionStringExtension}`;
  }
  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  async _query(connection, obj) {
    if (!obj || typeof obj == "string")
      obj = { sql: obj };
    const method = (obj.hasOwnProperty("method") && obj.method !== "raw" ? obj.method : obj.sql.split(" ")[0]).toLowerCase();
    obj.sqlMethod = method;
    if (method === "select" || method === "first" || method === "pluck") {
      const rows = await connection.query(obj.sql, obj.bindings);
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
        if (result.statement.includes("IDENTITY_VAL_LOCAL()")) {
          obj.response = {
            rows: result.map(
              (row) => result.columns.length > 0 ? row[result.columns[0].name] : row
            ),
            rowCount: result.length
          };
        } else if (method === "update") {
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
            rows: selected.map(
              (row) => selected.columns.length > 0 ? row[selected.columns[0].name] : row
            ),
            rowCount: selected.length
          };
        } else {
          obj.response = { rows: result, rowCount: result.length };
        }
      } catch (err) {
        console.error(err);
        throw new Error(err);
      } finally {
        console.log("transaction committed");
        await connection.commit();
      }
    }
    return obj;
  }
  _selectAfterUpdate() {
    const returnSelect = `; SELECT ${// @ts-ignore
    this.single.returning ? (
      // @ts-ignore
      this.formatter.columnize(this.single.returning)
    ) : "*"} from ${this.tableName} `;
    let whereStatement = [this.where()];
    console.log({ whereStatement });
    for (const [key, value] of Object.entries(this.single.update)) {
      whereStatement.push(`WHERE ${key} = ${value}`);
    }
    return returnSelect + whereStatement.join(" and ");
  }
  transaction(container, config, outerTx) {
    return new ibmi_transaction_default(this, ...arguments);
  }
  schemaCompiler() {
    return new ibmi_compiler_default(this, ...arguments);
  }
  tableCompiler() {
    return new ibmi_tablecompiler_default(this, ...arguments);
  }
  columnCompiler() {
    return new ibmi_columncompiler_default(this, ...arguments);
  }
  queryCompiler() {
    return new ibmi_querycompiler_default(this, ...arguments);
  }
  processResponse(obj, runner) {
    if (obj === null)
      return null;
    const resp = obj.response;
    const method = obj.sqlMethod;
    const { rows } = resp;
    if (obj.output)
      return obj.output.call(runner, resp);
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
};
var DB2Dialect = DB2Client;
var src_default = DB2Client;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DB2Dialect
});
