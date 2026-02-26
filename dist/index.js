import { createRequire } from 'module';
const require = createRequire(import.meta.url);
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
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
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  DB2Dialect: () => DB2Dialect,
  IBMiMigrationRunner: () => IBMiMigrationRunner,
  createIBMiMigrationRunner: () => createIBMiMigrationRunner,
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);
var import_node_process = __toESM(require("process"));
var import_node_buffer = require("buffer");
var import_knex = __toESM(require("knex"));
var import_odbc = __toESM(require("odbc"));

// src/schema/ibmi-compiler.ts
var import_compiler = __toESM(require("knex/lib/schema/compiler.js"));
var IBMiSchemaCompiler = class extends import_compiler.default {
  hasTable(tableName) {
    const upperName = String(tableName).toUpperCase();
    let schemaName = null;
    let actualTableName = upperName;
    if (upperName.includes(".")) {
      const parts = upperName.split(".");
      schemaName = parts[0];
      actualTableName = parts[1];
    }
    const builderSchema = this.builder._schema;
    if (builderSchema) {
      schemaName = builderSchema.toUpperCase();
    }
    let sql;
    let bindings;
    if (schemaName) {
      sql = `select count(*) as table_count from QSYS2.SYSTABLES where UPPER(TABLE_NAME) = ? AND UPPER(TABLE_SCHEMA) = ?`;
      bindings = [actualTableName, schemaName];
    } else {
      sql = `select count(*) as table_count from QSYS2.SYSTABLES where UPPER(TABLE_NAME) = ?`;
      bindings = [actualTableName];
    }
    this.pushQuery({
      sql,
      bindings,
      output: (_runner, resp) => {
        if (!resp) {
          return false;
        }
        if (Array.isArray(resp) && resp.length > 0) {
          const firstRow = resp[0];
          if (firstRow && typeof firstRow === "object") {
            const count = firstRow.table_count || firstRow.TABLE_COUNT || firstRow.count || firstRow.COUNT || 0;
            return count > 0;
          }
        }
        if (typeof resp === "object" && resp !== null) {
          const respObj = resp;
          const keys = Object.keys(respObj);
          for (const key of keys) {
            if (!isNaN(parseInt(key))) {
              const row = respObj[key];
              if (row && typeof row === "object") {
                const count = row.table_count || row.TABLE_COUNT || row.count || row.COUNT || 0;
                return count > 0;
              }
            }
          }
          const rowsObj = respObj;
          if (rowsObj.rows && Array.isArray(rowsObj.rows) && rowsObj.rows.length > 0) {
            const firstRow = rowsObj.rows[0];
            if (firstRow && typeof firstRow === "object") {
              const count = firstRow.table_count || firstRow.TABLE_COUNT || firstRow.count || firstRow.COUNT || 0;
              return count > 0;
            }
          }
        }
        return false;
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
var import_tablecompiler = __toESM(require("knex/lib/schema/tablecompiler.js"));
var IBMiTableCompiler = class extends import_tablecompiler.default {
  createQuery(columns, ifNot, like) {
    if (ifNot && this.client?.logger?.warn) {
      this.client.logger.warn(
        "IBM i DB2: IF NOT EXISTS is not natively supported. Use hasTable() check instead."
      );
    }
    let createStatement = "";
    if (like) {
      createStatement = `create table ${this.tableName()} as (select * from ${this.tableNameLike()}) with no data`;
    } else {
      createStatement = "create table " + this.tableName() + (this._formatting ? " (\n    " : " (") + columns.sql.join(this._formatting ? ",\n    " : ", ") + this._addChecks() + ")";
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
};
var ibmi_tablecompiler_default = IBMiTableCompiler;

// src/schema/ibmi-columncompiler.ts
var import_columncompiler = __toESM(require("knex/lib/schema/columncompiler.js"));
var IBMiColumnCompiler = class extends import_columncompiler.default {
  increments(options = { primaryKey: true }) {
    return "int not null generated always as identity (start with 1, increment by 1)" + (this.tableCompiler._canBeAddPrimaryKey(options) ? " primary key" : "");
  }
  // Add more IBM i DB2 specific column types for better support
  bigIncrements(options = { primaryKey: true }) {
    return "bigint not null generated always as identity (start with 1, increment by 1)" + (this.tableCompiler._canBeAddPrimaryKey(options) ? " primary key" : "");
  }
  smallIncrements(options = { primaryKey: true }) {
    return "smallint not null generated always as identity (start with 1, increment by 1)" + (this.tableCompiler._canBeAddPrimaryKey(options) ? " primary key" : "");
  }
  varchar(length) {
    return length ? `varchar(${length})` : "varchar(255)";
  }
  char(length) {
    return length ? `char(${length})` : "char(1)";
  }
  text() {
    return "clob(1M)";
  }
  mediumtext() {
    return "clob(16M)";
  }
  longtext() {
    return "clob(2G)";
  }
  binary(length) {
    return length ? `binary(${length})` : "binary(1)";
  }
  varbinary(length) {
    return length ? `varbinary(${length})` : "varbinary(255)";
  }
  // IBM i DB2 decimal with precision/scale
  decimal(precision, scale) {
    if (precision && scale) {
      return `decimal(${precision}, ${scale})`;
    } else if (precision) {
      return `decimal(${precision})`;
    }
    return "decimal(10, 2)";
  }
  // IBM i DB2 timestamp
  // Note: IBM i DB2 does not support TIMESTAMP WITH TIME ZONE
  timestamp(options) {
    if (options?.useTz && this.client?.logger?.warn) {
      this.client.logger.warn(
        "IBM i DB2 does not support TIMESTAMP WITH TIME ZONE. Using plain TIMESTAMP instead."
      );
    }
    return "timestamp";
  }
  datetime(options) {
    return this.timestamp(options);
  }
  // IBM i DB2 date and time types
  date() {
    return "date";
  }
  time() {
    return "time";
  }
  // JSON support (IBM i 7.3+)
  // Note: CHECK constraints with column references are not supported in this context
  // Users should add validation constraints separately if needed
  json() {
    return "clob(16M)";
  }
  jsonb() {
    return "clob(16M)";
  }
  // UUID support using CHAR(36)
  uuid() {
    return "char(36)";
  }
};
var ibmi_columncompiler_default = IBMiColumnCompiler;

// src/execution/ibmi-transaction.ts
var import_transaction = __toESM(require("knex/lib/execution/transaction.js"));
var IBMiTransaction = class extends import_transaction.default {
  begin(connection) {
    try {
      return connection.beginTransaction();
    } catch (error) {
      if (this.isConnectionClosed(error)) {
        console.warn(
          "IBM i DB2: Connection closed during transaction begin, DDL operations may have caused implicit commit"
        );
        throw new Error(
          "Connection closed during transaction begin - consider using migrations.disableTransactions: true"
        );
      }
      throw error;
    }
  }
  rollback(connection) {
    try {
      return connection.rollback();
    } catch (error) {
      console.warn(
        "IBM i DB2: Rollback encountered an error (likely closed connection):",
        error?.message || error
      );
      return Promise.resolve();
    }
  }
  commit(connection) {
    try {
      return connection.commit();
    } catch (error) {
      if (this.isConnectionClosed(error)) {
        console.warn(
          "IBM i DB2: Connection closed during commit - DDL operations cause implicit commits"
        );
        throw new Error(
          "Connection closed during commit - this is expected with DDL operations on IBM i DB2"
        );
      }
      throw error;
    }
  }
  isConnectionClosed(error) {
    const message = String(error?.message || error || "").toLowerCase();
    return message.includes("connection") && (message.includes("closed") || message.includes("invalid") || message.includes("terminated") || message.includes("not connected"));
  }
};
var ibmi_transaction_default = IBMiTransaction;

// src/query/ibmi-querycompiler.ts
var import_querycompiler = __toESM(require("knex/lib/query/querycompiler.js"));
var import_wrappingFormatter = require("knex/lib/formatter/wrappingFormatter.js");
var IBMiQueryCompiler = class extends import_querycompiler.default {
  constructor() {
    super(...arguments);
    // Cache for column metadata to improve performance with repeated operations
    __publicField(this, "columnCache", /* @__PURE__ */ new Map());
  }
  // Override select method to add IBM i optimization hints
  select() {
    let sql = super.select.call(this);
    const readUncommitted = this.client?.config?.ibmi?.readUncommitted === true;
    if (readUncommitted && typeof sql === "string") {
      sql = sql + " WITH UR";
    }
    return sql;
  }
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
    const ibmiConfig = this.client?.config?.ibmi || {};
    const multiRowStrategy = ibmiConfig.multiRowInsert || "auto";
    const isArrayInsert = Array.isArray(insertValues) && insertValues.length > 1;
    const originalValues = isArrayInsert ? insertValues.slice() : insertValues;
    const forceSingleRow = multiRowStrategy === "disabled" || multiRowStrategy === "sequential" && isArrayInsert;
    let workingValues = insertValues;
    if (forceSingleRow && isArrayInsert) {
      workingValues = [insertValues[0]];
      this.single.insert = workingValues;
    }
    const standardInsert = super.insert();
    const insertSql = typeof standardInsert === "object" && standardInsert.sql ? standardInsert.sql : standardInsert;
    const multiRow = isArrayInsert && !forceSingleRow;
    if (multiRow && !returning) {
      return { sql: insertSql, returning: void 0 };
    }
    if (multiRow && returning === "*") {
      if (this.client?.printWarn) {
        this.client.printWarn("multi-row insert with returning * may be large");
      }
    }
    const selectColumns = returning ? this.formatter.columnize(returning) : "IDENTITY_VAL_LOCAL()";
    const sql = `select ${selectColumns} from FINAL TABLE(${insertSql})`;
    if (multiRowStrategy === "sequential" && isArrayInsert) {
      const first = originalValues[0];
      const columns = Object.keys(first).sort();
      return {
        sql,
        returning: void 0,
        _ibmiSequentialInsert: {
          columns,
          rows: originalValues,
          tableName: this.tableName,
          returning: returning || null,
          identityOnly: !returning
        }
      };
    }
    return { sql, returning: void 0 };
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
      const parts = [];
      parts.push("(" + this.formatter.columnize(insertData.columns) + ") ");
      if (returningSql) parts.push(returningSql);
      parts.push("values ");
      const rowsSql = [];
      for (const row of insertData.values) {
        const placeholders = row.map(() => "?").join(", ");
        rowsSql.push("(" + placeholders + ")");
      }
      parts.push(rowsSql.join(", "));
      return parts.join("");
    }
    if (Array.isArray(insertValues) && insertValues.length === 1 && insertValues[0]) {
      return (returningSql || "") + this._emptyInsertValue;
    }
    return "";
  }
  generateCacheKey(data) {
    const tablePrefix = this.tableName ? `${this.tableName}:` : "";
    if (Array.isArray(data) && data.length > 0) {
      return tablePrefix + Object.keys(data[0] || {}).sort().join("|");
    }
    if (data && typeof data === "object") {
      return tablePrefix + Object.keys(data).sort().join("|");
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
    const firstItem = dataArray[0];
    if (!firstItem || typeof firstItem !== "object") {
      return { columns: [], values: [] };
    }
    const cacheKey = this.generateCacheKey(firstItem);
    let columns;
    if (cacheKey && this.columnCache.has(cacheKey)) {
      columns = this.columnCache.get(cacheKey);
    } else {
      columns = Object.keys(firstItem).sort();
      if (cacheKey && columns.length > 0)
        this.columnCache.set(cacheKey, columns);
    }
    const values = [];
    for (const item of dataArray) {
      if (!item || typeof item !== "object") continue;
      values.push(columns.map((c) => item[c] ?? void 0));
    }
    return { columns, values };
  }
  update() {
    const withSQL = this.with();
    const updates = this._prepUpdate(this.single.update);
    const where = this.where();
    const order = this.order();
    const limit = this.limit();
    const { returning } = this.single;
    const optimizationHints = "";
    const baseUpdateSql = [
      withSQL,
      `update ${this.single.only ? "only " : ""}${this.tableName}`,
      "set",
      updates.join(", "),
      where,
      order,
      limit,
      optimizationHints
    ].filter(Boolean).join(" ");
    if (returning) {
      const selectColumns = this.formatter.columnize(this.single.returning);
      return {
        sql: baseUpdateSql,
        returning,
        _ibmiUpdateReturning: {
          updateSql: baseUpdateSql,
          selectColumns,
          whereClause: where,
          tableName: this.tableName,
          setBindingCount: updates.map((fragment) => (fragment.match(/\?/g) || []).length).reduce((sum, count) => sum + count, 0)
        }
      };
    }
    return { sql: baseUpdateSql, returning };
  }
  // Emulate DELETE ... RETURNING by attaching metadata for SELECT + DELETE execution
  del() {
    const baseDelete = super.del();
    const { returning } = this.single;
    if (!returning) {
      return { sql: baseDelete, returning: void 0 };
    }
    const deleteSql = typeof baseDelete === "object" && baseDelete.sql ? baseDelete.sql : baseDelete;
    const selectColumns = this.formatter.columnize(returning);
    return {
      sql: deleteSql,
      returning,
      _ibmiDeleteReturning: {
        deleteSql,
        selectColumns,
        whereClause: this.where(),
        tableName: this.tableName
      }
    };
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
    const parts = [];
    for (let i = 0; i < columns.length; i++) {
      if (i > 0) parts.push(", ");
      parts.push(prefix + this.wrap(columns[i]));
    }
    return parts.join("");
  }
};
var ibmi_querycompiler_default = IBMiQueryCompiler;

// src/index.ts
var import_node_stream = require("stream");

// src/migrations/ibmi-migration-runner.ts
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_url = require("url");
function buildTsRuntimeHelpMessage(fileName) {
  return `TypeScript migration '${fileName}' requires a TypeScript runtime loader. Run with a TS-capable runtime (for example: \`node --import tsx\`) or precompile migrations to JavaScript.`;
}
var IBMiMigrationRunner = class {
  constructor(knex2, config) {
    __publicField(this, "knex");
    __publicField(this, "config");
    this.knex = knex2;
    this.config = {
      directory: "./migrations",
      tableName: "KNEX_MIGRATIONS",
      schemaName: void 0,
      ...config
    };
    if (typeof config?.extension === "string") {
      console.warn(
        "\u26A0\uFE0F IBMiMigrationRunner config 'extension' is ignored for discovery. The runner always discovers .js/.ts/.mjs/.cjs migration files."
      );
    }
  }
  getFullTableName() {
    return this.config.schemaName ? `${this.config.schemaName}.${this.config.tableName}` : this.config.tableName;
  }
  async latest() {
    try {
      console.log(
        "\u{1F680} IBM i DB2 Migration Runner - bypassing Knex locking system"
      );
      const tableName = this.getFullTableName();
      const migrationTableExists = await this.knex.schema.hasTable(
        tableName
      );
      if (!migrationTableExists) {
        console.log(`\u{1F4DD} Creating migration table: ${tableName}`);
        await this.knex.schema.createTable(tableName, (table) => {
          table.increments("id").primary();
          table.string("name").unique();
          table.integer("batch");
          table.timestamp("migration_time");
        });
        console.log("\u2705 Migration table created");
      }
      const completed = await this.knex(tableName).select("NAME").orderBy("ID");
      const completedNames = completed.map((c) => c.NAME);
      console.log(`\u{1F4CB} Found ${completedNames.length} completed migrations`);
      const migrationFiles = this.getMigrationFiles();
      console.log(`\u{1F4C1} Found ${migrationFiles.length} migration files`);
      const newMigrations = migrationFiles.filter(
        (file) => !completedNames.includes(file)
      );
      if (newMigrations.length === 0) {
        console.log("\u2705 No new migrations to run");
        return;
      }
      console.log(`\u{1F3AF} Running ${newMigrations.length} new migrations:`);
      newMigrations.forEach((file) => console.log(`  - ${file}`));
      const batchResult = await this.knex(tableName).max("BATCH as max_batch");
      const nextBatch = (batchResult[0]?.max_batch || 0) + 1;
      console.log(`\u{1F4CA} Using batch number: ${nextBatch}`);
      for (const migrationFile of newMigrations) {
        console.log(`
\u{1F504} Running migration: ${migrationFile}`);
        try {
          const migrationPath = this.getMigrationPath(migrationFile);
          const fileUrl = (0, import_url.pathToFileURL)(migrationPath).href;
          let migration;
          try {
            const moduleNs = await import(`${fileUrl}?t=${Date.now()}`);
            migration = moduleNs.default ?? moduleNs;
          } catch (importError) {
            const isTsMigration = migrationFile.toLowerCase().endsWith(".ts");
            const message = String(importError?.message || importError || "");
            if (isTsMigration && (message.includes("Unknown file extension") || message.includes("Cannot use import statement") || message.includes("Unexpected token"))) {
              throw new Error(buildTsRuntimeHelpMessage(migrationFile));
            }
            throw importError;
          }
          if (!migration.up || typeof migration.up !== "function") {
            throw new Error(`Migration ${migrationFile} has no 'up' function`);
          }
          console.log(`  \u26A1 Executing migration...`);
          await migration.up(this.knex);
          await this.knex(tableName).insert({
            name: migrationFile,
            batch: nextBatch,
            migration_time: /* @__PURE__ */ new Date()
          });
          console.log(`  \u2705 Migration ${migrationFile} completed successfully`);
        } catch (error) {
          console.error(
            `  \u274C Migration ${migrationFile} failed:`,
            error.message
          );
          throw error;
        }
      }
      console.log(`
\u{1F389} All migrations completed successfully!`);
    } catch (error) {
      console.error("\u274C Migration runner failed:", error.message);
      throw error;
    }
  }
  async rollback(steps = 1) {
    try {
      console.log(`\u{1F504} Rolling back ${steps} migration batch(es)...`);
      const tableName = this.getFullTableName();
      const batchesToRollback = await this.knex(tableName).distinct("BATCH").orderBy("BATCH", "desc").limit(steps);
      if (batchesToRollback.length === 0) {
        console.log("\u2705 No migrations to rollback");
        return;
      }
      const batchNumbers = batchesToRollback.map((b) => b.BATCH);
      console.log(`\u{1F4CA} Rolling back batches: ${batchNumbers.join(", ")}`);
      const migrationsToRollback = await this.knex(tableName).select("NAME").whereIn("BATCH", batchNumbers).orderBy("ID", "desc");
      console.log(`\u{1F3AF} Rolling back ${migrationsToRollback.length} migrations:`);
      migrationsToRollback.forEach((m) => console.log(`  - ${m.NAME}`));
      for (const migrationRecord of migrationsToRollback) {
        const migrationFile = migrationRecord.NAME;
        console.log(`
\u{1F504} Rolling back migration: ${migrationFile}`);
        try {
          const migrationPath = this.getMigrationPath(migrationFile);
          const fileUrl = (0, import_url.pathToFileURL)(migrationPath).href;
          let migration;
          try {
            const moduleNs = await import(`${fileUrl}?t=${Date.now()}`);
            migration = moduleNs.default ?? moduleNs;
          } catch (importError) {
            const isTsMigration = migrationFile.toLowerCase().endsWith(".ts");
            const message = String(importError?.message || importError || "");
            if (isTsMigration && (message.includes("Unknown file extension") || message.includes("Cannot use import statement") || message.includes("Unexpected token"))) {
              throw new Error(buildTsRuntimeHelpMessage(migrationFile));
            }
            throw importError;
          }
          if (migration.down && typeof migration.down === "function") {
            console.log(`  \u26A1 Executing rollback...`);
            await migration.down(this.knex);
          } else {
            console.log(
              `  \u26A0\uFE0F Migration ${migrationFile} has no 'down' function, skipping rollback`
            );
          }
          await this.knex(tableName).where("NAME", migrationFile).del();
          console.log(
            `  \u2705 Migration ${migrationFile} rolled back successfully`
          );
        } catch (error) {
          console.error(
            `  \u274C Migration ${migrationFile} rollback failed:`,
            error.message
          );
          throw error;
        }
      }
      console.log(`
\u{1F389} Rollback completed successfully!`);
    } catch (error) {
      console.error("\u274C Rollback failed:", error.message);
      throw error;
    }
  }
  async currentVersion() {
    try {
      const tableName = this.getFullTableName();
      const migrationTableExists = await this.knex.schema.hasTable(
        tableName
      );
      if (!migrationTableExists) {
        return null;
      }
      const result = await this.knex(tableName).select("NAME").orderBy("ID", "desc").first();
      return result?.NAME || null;
    } catch (error) {
      console.error("\u274C Error getting current version:", error.message);
      return null;
    }
  }
  async listExecuted() {
    try {
      const tableName = this.getFullTableName();
      const migrationTableExists = await this.knex.schema.hasTable(
        tableName
      );
      if (!migrationTableExists) {
        return [];
      }
      const completed = await this.knex(tableName).select("NAME").orderBy("ID");
      return completed.map((c) => c.NAME);
    } catch (error) {
      console.error("\u274C Error listing executed migrations:", error.message);
      return [];
    }
  }
  async listPending() {
    try {
      const allFiles = this.getMigrationFiles();
      const executed = await this.listExecuted();
      return allFiles.filter((file) => !executed.includes(file));
    } catch (error) {
      console.error("\u274C Error listing pending migrations:", error.message);
      return [];
    }
  }
  getMigrationFiles() {
    const { directory } = this.config;
    if (!import_fs.default.existsSync(directory)) {
      throw new Error(`Migration directory does not exist: ${directory}`);
    }
    const validExtensions = ["js", "ts", "mjs", "cjs"];
    return import_fs.default.readdirSync(directory).filter((file) => validExtensions.some((ext) => file.endsWith(`.${ext}`))).sort();
  }
  getMigrationPath(filename) {
    return import_path.default.resolve(this.config.directory, filename);
  }
};
function createIBMiMigrationRunner(knex2, config) {
  return new IBMiMigrationRunner(knex2, config);
}

// src/index.ts
var StatementCache = class {
  constructor(maxSize = 100) {
    __publicField(this, "cache", /* @__PURE__ */ new Map());
    __publicField(this, "maxSize");
    this.maxSize = maxSize;
  }
  get(sql) {
    const stmt = this.cache.get(sql);
    if (stmt) {
      this.cache.delete(sql);
      this.cache.set(sql, stmt);
    }
    return stmt;
  }
  set(sql, stmt) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== void 0) {
        const oldStmt = this.cache.get(firstKey);
        this.cache.delete(firstKey);
        if (oldStmt && typeof oldStmt.close === "function") {
          oldStmt.close().catch(() => {
          });
        }
      }
    }
    this.cache.set(sql, stmt);
  }
  async clear() {
    const statements = Array.from(this.cache.values());
    this.cache.clear();
    await Promise.all(
      statements.map(
        (stmt) => stmt && typeof stmt.close === "function" ? stmt.close().catch(() => {
        }) : Promise.resolve()
      )
    );
  }
  size() {
    return this.cache.size;
  }
};
var DB2Client = class extends import_knex.default.Client {
  constructor(config) {
    super(config);
    // Per-connection statement cache (WeakMap so it's GC'd with connections)
    __publicField(this, "statementCaches", /* @__PURE__ */ new WeakMap());
    __publicField(this, "normalizeBigintToString");
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
    const ibmiConfig = config?.ibmi;
    this.normalizeBigintToString = ibmiConfig?.normalizeBigintToString !== false;
  }
  // Helper method to safely stringify objects that might have circular references
  safeStringify(obj, indent = 0) {
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
    return import_odbc.default;
  }
  wrapIdentifierImpl(value) {
    if (!value) return value;
    if (value.includes("KNEX_MIGRATIONS") || value.includes("knex_migrations")) {
      return value.toUpperCase();
    }
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
      throw new Error("There is no connection config defined");
    }
    this.printDebug(
      "connection config: " + this._getConnectionString(connectionConfig)
    );
    const connection = await this.driver.connect(
      this._getConnectionString(connectionConfig)
    );
    return connection;
  }
  // Used to explicitly close a connection, called internally by the pool manager
  // when a connection times out or the pool is shutdown.
  async destroyRawConnection(connection) {
    this.printDebug("destroy connection");
    const cache = this.statementCaches.get(connection);
    if (cache) {
      await cache.clear();
      this.statementCaches.delete(connection);
    }
    return await connection.close();
  }
  // Knex pool validation hook.
  // If this returns false, Knex/tarn will destroy the resource and create a new one.
  // This is critical for recovering after IBM i restarts / network drops.
  async validateConnection(connection) {
    try {
      return Boolean(connection && connection.connected);
    } catch {
      return false;
    }
  }
  _getConnectionString(connectionConfig) {
    const userParams = connectionConfig.connectionStringParams || {};
    const connectionStringParams = { ...userParams };
    const connectionStringExtension = Object.keys(
      connectionStringParams
    ).reduce((result, key) => {
      const value = connectionStringParams[key];
      return `${result}${key}=${value};`;
    }, "");
    return `DRIVER=${connectionConfig.driver};SYSTEM=${connectionConfig.host};PORT=${connectionConfig.port || 8471};DATABASE=${connectionConfig.database};UID=${connectionConfig.user};PWD=${connectionConfig.password};` + connectionStringExtension;
  }
  // Runs the query on the specified connection, providing the bindings
  async _query(connection, obj) {
    const queryObject = this.normalizeQueryObject(obj);
    const method = this.determineQueryMethod(queryObject);
    queryObject.sqlMethod = method;
    if (queryObject._ibmiUpdateReturning) {
      return await this.executeUpdateReturning(connection, queryObject);
    }
    if (queryObject._ibmiSequentialInsert) {
      return await this.executeSequentialInsert(connection, queryObject);
    }
    if (queryObject._ibmiDeleteReturning) {
      return await this.executeDeleteReturning(connection, queryObject);
    }
    if (import_node_process.default.env.DEBUG === "true" && queryObject.sql && (queryObject.sql.toLowerCase().includes("create table") || queryObject.sql.toLowerCase().includes("knex_migrations"))) {
      this.printDebug(
        `Executing ${method} query: ${queryObject.sql.substring(0, 200)}...`
      );
      if (queryObject.bindings?.length) {
        this.printDebug(
          `Bindings: ${this.safeStringify(queryObject.bindings)}`
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
      if (import_node_process.default.env.DEBUG === "true" && queryObject.sql && (queryObject.sql.toLowerCase().includes("create table") || queryObject.sql.toLowerCase().includes("knex_migrations"))) {
        this.printDebug(`${method} completed in ${endTime - startTime}ms`);
      }
      this.printDebug(`Query completed: ${method} (${endTime - startTime}ms)`);
      return queryObject;
    } catch (error) {
      const wrappedError = this.wrapError(error, method, queryObject);
      if (this.isConnectionError(error)) {
        connection.__knex__disposed = error;
        this.printError(
          `Connection error during ${method} query: ${error.message}`
        );
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
  async executeUpdateReturning(connection, obj) {
    const { _ibmiUpdateReturning } = obj;
    const {
      updateSql,
      selectColumns,
      whereClause,
      tableName,
      setBindingCount
    } = _ibmiUpdateReturning;
    this.printDebug(
      "Executing UPDATE with returning using transaction approach"
    );
    try {
      const updateObj = {
        sql: updateSql,
        bindings: obj.bindings,
        sqlMethod: "update"
      };
      await this.executeStatementQuery(connection, updateObj);
      const selectSql = whereClause ? `select ${selectColumns} from ${tableName} ${whereClause}` : `select ${selectColumns} from ${tableName}`;
      const inferredSetBindingCount = typeof setBindingCount === "number" ? setBindingCount : (updateSql.split(" where ")[0].match(/\?/g) || []).length;
      const whereBindings = obj.bindings ? obj.bindings.slice(inferredSetBindingCount) : [];
      const selectObj = {
        sql: selectSql,
        bindings: whereBindings,
        sqlMethod: "select",
        response: void 0
      };
      await this.executeSelectQuery(connection, selectObj);
      obj.response = selectObj.response;
      obj.sqlMethod = "update";
      obj.select = true;
      return obj;
    } catch (error) {
      this.printError(`UPDATE with returning failed: ${error.message}`);
      throw this.wrapError(error, "update_returning", obj);
    }
  }
  async executeSequentialInsert(connection, obj) {
    const meta = obj._ibmiSequentialInsert;
    const { rows, columns, tableName, returning } = meta;
    this.printDebug("Executing sequential multi-row insert");
    const insertedRows = [];
    const transactional = this.config?.ibmi?.sequentialInsertTransactional === true;
    let beganTx = false;
    if (transactional) {
      try {
        await connection.query("BEGIN");
        beganTx = true;
      } catch (_e) {
        this.printWarn(
          "Could not begin transaction for sequential insert; proceeding without"
        );
      }
    }
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const colList = columns.join(", ");
      const placeholders = columns.map(() => "?").join(", ");
      const singleValues = columns.map((c) => row[c]);
      const baseInsert = `insert into ${tableName} (${colList}) values (${placeholders})`;
      const selectCols = returning ? this.queryCompiler({}).formatter.columnize(returning) : "IDENTITY_VAL_LOCAL()";
      const wrapped = `select ${selectCols} from FINAL TABLE(${baseInsert})`;
      const singleObj = {
        sql: wrapped,
        bindings: singleValues,
        sqlMethod: "insert",
        response: void 0
      };
      await this.executeStatementQuery(connection, singleObj);
      const resp = singleObj.response?.rows;
      if (resp) insertedRows.push(...resp);
    }
    if (transactional && beganTx) {
      try {
        await connection.query("COMMIT");
      } catch (commitErr) {
        this.printError(
          "Commit failed for sequential insert, attempting rollback: " + commitErr?.message
        );
        try {
          await connection.query("ROLLBACK");
        } catch {
        }
        throw commitErr;
      }
    }
    obj.response = { rows: insertedRows, rowCount: insertedRows.length };
    obj.sqlMethod = "insert";
    obj.select = true;
    return obj;
  }
  async executeDeleteReturning(connection, obj) {
    const meta = obj._ibmiDeleteReturning;
    const { deleteSql, selectColumns, whereClause, tableName } = meta;
    this.printDebug("Executing DELETE with returning emulation");
    try {
      const selectSql = whereClause ? `select ${selectColumns} from ${tableName} ${whereClause}` : `select ${selectColumns} from ${tableName}`;
      const selectObj = {
        sql: selectSql,
        bindings: obj.bindings,
        sqlMethod: "select",
        response: void 0
      };
      await this.executeSelectQuery(connection, selectObj);
      const rowsToReturn = selectObj.response?.rows || [];
      const deleteObj = {
        sql: deleteSql,
        bindings: obj.bindings,
        sqlMethod: "del",
        response: void 0
      };
      await this.executeStatementQuery(connection, deleteObj);
      obj.response = { rows: rowsToReturn, rowCount: rowsToReturn.length };
      obj.sqlMethod = "del";
      obj.select = true;
      return obj;
    } catch (error) {
      this.printError(`DELETE with returning failed: ${error.message}`);
      throw this.wrapError(error, "delete_returning", obj);
    }
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
      const normalizedRows = this.maybeNormalizeBigint(rows);
      obj.response = { rows: normalizedRows, rowCount: normalizedRows.length };
    }
  }
  async executeStatementQuery(connection, obj) {
    let statement;
    let usedCache = false;
    const cacheEnabled = this.config?.ibmi?.preparedStatementCache === true;
    try {
      if (cacheEnabled) {
        let cache = this.statementCaches.get(connection);
        if (!cache) {
          const cacheSize = this.config?.ibmi?.preparedStatementCacheSize || 100;
          cache = new StatementCache(cacheSize);
          this.statementCaches.set(connection, cache);
        }
        statement = cache.get(obj.sql);
        if (statement) {
          usedCache = true;
          this.printDebug(
            `Using cached statement for: ${obj.sql.substring(0, 50)}...`
          );
        } else {
          statement = await connection.createStatement();
          await statement.prepare(obj.sql);
          cache.set(obj.sql, statement);
          this.printDebug(`Cached new statement (cache size: ${cache.size()})`);
        }
      } else {
        statement = await connection.createStatement();
        await statement.prepare(obj.sql);
      }
      if (obj.bindings) {
        await statement.bind(obj.bindings);
      }
      const result = await statement.execute();
      this.printDebug(String(result));
      obj.response = this.formatStatementResponse(result);
    } catch (err) {
      const sql = (obj.sql || "").toLowerCase();
      const isDml = obj.sqlMethod === "update" /* UPDATE */ || sql.includes(" update ") || sql.startsWith("update") || obj.sqlMethod === "del" /* DELETE */ || sql.includes(" delete ") || sql.startsWith("delete");
      const odbcErrors = err?.odbcErrors;
      const isEmptyOdbcError = Array.isArray(odbcErrors) && odbcErrors.length === 0;
      const hasNoDataState = Array.isArray(odbcErrors) ? odbcErrors.some(
        (e) => String(e?.state || e?.SQLSTATE || "").toUpperCase() === "02000"
      ) : false;
      if (isDml && (isEmptyOdbcError || hasNoDataState || this.isNoDataError(err))) {
        this.printWarn(
          `ODBC signaled no-data for ${sql.includes("update") ? "UPDATE" : "DELETE"}; treating as 0 rows affected`
        );
        obj.response = { rows: [], rowCount: 0 };
        return;
      }
      this.printError(this.safeStringify(err));
      throw err;
    } finally {
      if (!usedCache && statement && typeof statement.close === "function") {
        try {
          await statement.close();
        } catch (closeErr) {
          this.printDebug(
            `Error closing statement: ${this.safeStringify(closeErr, 2)}`
          );
        }
      }
    }
  }
  isNoDataError(error) {
    if (!error) return false;
    const msg = String(error?.message || error || "").toLowerCase();
    return msg.includes("02000") || msg.includes("no data") || msg.includes("no rows") || msg.includes("0 rows");
  }
  shouldNormalizeBigintValues() {
    return this.normalizeBigintToString;
  }
  maybeNormalizeBigint(value) {
    if (value === null || value === void 0) {
      return value;
    }
    if (!this.shouldNormalizeBigintValues()) {
      return value;
    }
    return this.normalizeBigintValue(value);
  }
  normalizeBigintValue(value, seen = /* @__PURE__ */ new WeakSet()) {
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
      if (value instanceof Date || import_node_buffer.Buffer.isBuffer(value) || ArrayBuffer.isView(value)) {
        return value;
      }
      const obj = value;
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
  formatStatementResponse(result) {
    const isIdentityQuery = result.statement?.includes("IDENTITY_VAL_LOCAL()");
    if (isIdentityQuery && result.columns?.length > 0) {
      const identityRows = result.map(
        (row) => row[result.columns[0].name]
      );
      const normalizedIdentityRows = this.maybeNormalizeBigint(identityRows);
      return {
        rows: normalizedIdentityRows,
        rowCount: result.count
      };
    }
    const rowCount = typeof result?.count === "number" ? result.count : 0;
    return {
      rows: this.maybeNormalizeBigint(result),
      rowCount
    };
  }
  async _stream(connection, obj, stream, options) {
    if (!obj.sql) throw new Error("A query is required to stream results");
    const optimizedFetchSize = options?.fetchSize || this.calculateOptimalFetchSize(obj.sql);
    return new Promise((resolve, reject) => {
      let isResolved = false;
      const cleanup = () => {
        if (!isResolved) {
          isResolved = true;
        }
      };
      stream.on("error", (err) => {
        cleanup();
        reject(err);
      });
      stream.on("end", () => {
        cleanup();
        resolve(void 0);
      });
      connection.query(
        obj.sql,
        obj.bindings,
        {
          cursor: true,
          fetchSize: optimizedFetchSize
        },
        (error, cursor) => {
          if (error) {
            if (this.isConnectionError(error)) {
              connection.__knex__disposed = error;
            }
            this.printError(this.safeStringify(error, 2));
            cleanup();
            reject(error);
            return;
          }
          const readableStream = this._createCursorStream(cursor);
          readableStream.on("error", (err) => {
            if (this.isConnectionError(err)) {
              connection.__knex__disposed = err;
            }
            cleanup();
            reject(err);
          });
          readableStream.pipe(stream);
        }
      );
    });
  }
  calculateOptimalFetchSize(sql) {
    const hasJoins = /\s+join\s+/i.test(sql);
    const hasAggregates = /\s+(count|sum|avg|max|min)\s*\(/i.test(sql);
    const hasOrderBy = /\s+order\s+by\s+/i.test(sql);
    const hasGroupBy = /\s+group\s+by\s+/i.test(sql);
    if (hasJoins || hasAggregates || hasOrderBy || hasGroupBy) {
      return 500;
    }
    return 100;
  }
  _createCursorStream(cursor) {
    const parentThis = this;
    let isClosed = false;
    return new import_node_stream.Readable({
      objectMode: true,
      read() {
        if (isClosed) return;
        cursor.fetch((error, result) => {
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
            cursor.close((closeError) => {
              if (closeError) {
                parentThis.printError(parentThis.safeStringify(closeError, 2));
              }
              if (result) {
                this.push(parentThis.maybeNormalizeBigint(result));
              }
              this.push(null);
            });
          }
        });
      },
      destroy(err, callback) {
        if (!isClosed) {
          isClosed = true;
          cursor.close((closeError) => {
            if (closeError) {
              parentThis.printDebug(
                "Error closing cursor during destroy: " + parentThis.safeStringify(closeError)
              );
            }
            callback(err);
          });
        } else {
          callback(err);
        }
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
  // Create IBM i-specific migration runner that bypasses Knex's problematic locking system
  createMigrationRunner(config) {
    const knexInstance = this.context || this;
    return createIBMiMigrationRunner(knexInstance, config);
  }
  processResponse(obj, runner) {
    if (obj === null) return null;
    const { response } = obj;
    if (obj.output) {
      try {
        const result = obj.output(runner, response);
        return result;
      } catch (error) {
        const wrappedError = this.wrapError(error, "custom_output", obj);
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
    if (response) {
      this.maybeNormalizeBigint(response.rows);
    }
    const validationResult = this.validateResponse(obj);
    if (validationResult !== null) return validationResult;
    return this.processSqlMethod(obj);
  }
  validateResponse(obj) {
    if (!obj.response) {
      this.printDebug("response undefined " + this.safeStringify(obj));
      return this.processSqlMethod({
        ...obj,
        response: { rows: [], rowCount: 0 }
      });
    }
    if (!obj.response.rows) {
      const usesRowCountOnly = !obj.select && (obj.sqlMethod === "del" /* DELETE */ || obj.sqlMethod === "delete" /* DELETE_ALT */ || obj.sqlMethod === "update" /* UPDATE */ || obj.sqlMethod === "counter" /* COUNTER */);
      if (usesRowCountOnly) {
        return null;
      }
      this.printWarn("rows undefined " + this.safeStringify(obj));
      return this.processSqlMethod({
        ...obj,
        response: {
          ...obj.response,
          rows: [],
          rowCount: obj.response.rowCount ?? 0
        }
      });
    }
    return null;
  }
  wrapError(error, method, queryObject) {
    const context = {
      method,
      sql: queryObject.sql ? queryObject.sql.substring(0, 100) + "..." : "unknown",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    const contextStr = this.safeStringify(context);
    if (this.isConnectionError(error)) {
      return new Error(
        `IBM i DB2 connection error during ${method}: ${error.message} | Context: ${contextStr}`
      );
    }
    if (this.isTimeoutError(error)) {
      return new Error(
        `IBM i DB2 timeout during ${method}: ${error.message} | Context: ${contextStr}`
      );
    }
    if (this.isSQLError(error)) {
      return new Error(
        `IBM i DB2 SQL error during ${method}: ${error.message} | Context: ${contextStr}`
      );
    }
    return new Error(
      `IBM i DB2 error during ${method}: ${error.message} | Context: ${contextStr}`
    );
  }
  shouldRetryQuery(queryObject, _method) {
    return queryObject.sql?.toLowerCase().includes("systables") || queryObject.sql?.toLowerCase().includes("knex_migrations");
  }
  async retryQuery(connection, queryObject, method) {
    this.printDebug(`Retrying ${method} query due to connection error...`);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1e3));
      if (this.isSelectMethod(method)) {
        await this.executeSelectQuery(connection, queryObject);
      } else {
        await this.executeStatementQuery(connection, queryObject);
      }
      return queryObject;
    } catch (retryError) {
      this.printError(`Retry failed: ${retryError.message}`);
      throw this.wrapError(retryError, `${method}_retry`, queryObject);
    }
  }
  /**
   * Extract SQLSTATE from ODBC error if available
   */
  getSQLState(error) {
    if (error?.odbcErrors && Array.isArray(error.odbcErrors)) {
      for (const odbcErr of error.odbcErrors) {
        const state = odbcErr?.state || odbcErr?.SQLSTATE;
        if (state) return String(state).toUpperCase();
      }
    }
    return null;
  }
  isConnectionError(error) {
    const sqlState = this.getSQLState(error);
    if (sqlState) {
      return sqlState.startsWith("08") || // 08001, 08003, 08007, 08S01, etc.
      sqlState === "40003";
    }
    const errorMessage = (error.message || String(error)).toLowerCase();
    return errorMessage.includes("connection") && (errorMessage.includes("closed") || errorMessage.includes("invalid") || errorMessage.includes("terminated") || errorMessage.includes("not connected"));
  }
  isTimeoutError(error) {
    const sqlState = this.getSQLState(error);
    if (sqlState) {
      return sqlState === "HYT00" || // Timeout expired
      sqlState === "HYT01";
    }
    const errorMessage = (error.message || String(error)).toLowerCase();
    return errorMessage.includes("timeout") || errorMessage.includes("timed out");
  }
  isSQLError(error) {
    const sqlState = this.getSQLState(error);
    if (sqlState) {
      return sqlState.startsWith("42") || // Syntax error or access violation
      sqlState.startsWith("22") || // Data exception
      sqlState.startsWith("23") || // Integrity constraint violation
      sqlState.startsWith("21");
    }
    const errorMessage = (error.message || String(error)).toLowerCase();
    return errorMessage.includes("sql") || errorMessage.includes("syntax") || errorMessage.includes("table") || errorMessage.includes("column");
  }
  processSqlMethod(obj) {
    const rows = obj.response?.rows ?? [];
    const rowCount = obj.response?.rowCount;
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
        return obj.select ? rows : rowCount ?? 0;
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
  DB2Dialect,
  IBMiMigrationRunner,
  createIBMiMigrationRunner
});
//# sourceMappingURL=index.js.map