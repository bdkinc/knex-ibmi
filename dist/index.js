import { createRequire } from 'module';
const require = createRequire(import.meta.url);
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
      output: (runner, resp) => {
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
          const keys = Object.keys(resp);
          for (const key of keys) {
            if (!isNaN(parseInt(key))) {
              const row = resp[key];
              if (row && typeof row === "object") {
                const count = row.table_count || row.TABLE_COUNT || row.count || row.COUNT || 0;
                return count > 0;
              }
            }
          }
          if (resp.rows && Array.isArray(resp.rows) && resp.rows.length > 0) {
            const firstRow = resp.rows[0];
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
var import_columncompiler = __toESM(require("knex/lib/schema/columncompiler.js"));
var IBMiColumnCompiler = class extends import_columncompiler.default {
  increments(options = { primaryKey: true }) {
    return "int not null generated always as identity (start with 1, increment by 1)" + (this.tableCompiler._canBeAddPrimaryKey(options) ? " primary key" : "");
  }
  // Add more IBM i DB2 specific column types for better support
  bigIncrements(options = { primaryKey: true }) {
    return "bigint not null generated always as identity (start with 1, increment by 1)" + (this.tableCompiler._canBeAddPrimaryKey(options) ? " primary key" : "");
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
  timestamp(options) {
    if (options?.useTz) {
      return "timestamp with time zone";
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
  json() {
    return "clob(16M) check (json_valid(json_column))";
  }
  jsonb() {
    return "clob(16M) check (json_valid(jsonb_column))";
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
    const originalResult = super.select.call(this);
    if (typeof originalResult === "string") {
      const optimizationHints = this.getSelectOptimizationHints(originalResult);
      return originalResult + optimizationHints;
    }
    return originalResult;
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
    if (returning) {
      this.client.logger.warn?.("IBM i DB2 RETURNING clause in INSERT may not work via ODBC");
    }
    return super.insert();
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
      parts.push("(");
      parts.push(this.formatter.columnize(insertData.columns));
      parts.push(") ");
      if (returningSql) {
        parts.push(returningSql);
      }
      parts.push("values (");
      const firstRowValues = insertData.values[0] || [];
      const valueStrings = firstRowValues.map(() => "?");
      parts.push(valueStrings.join(", "));
      parts.push(")");
      return parts.join("");
    }
    if (Array.isArray(insertValues) && insertValues.length === 1 && insertValues[0]) {
      return returningSql + this._emptyInsertValue;
    }
    return "";
  }
  generateCacheKey(data) {
    if (Array.isArray(data) && data.length > 0) {
      return Object.keys(data[0] || {}).sort().join("|");
    }
    if (data && typeof data === "object") {
      return Object.keys(data).sort().join("|");
    }
    return "";
  }
  buildFromCache(data, cachedColumns) {
    const dataArray = Array.isArray(data) ? data : data ? [data] : [];
    const values = [];
    for (const item of dataArray) {
      if (item == null) {
        break;
      }
      const row = cachedColumns.map((column) => item[column] ?? void 0);
      values.push(row);
    }
    return {
      columns: cachedColumns,
      values
    };
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
    if (cacheKey && this.columnCache.has(cacheKey)) {
      const cachedColumns = this.columnCache.get(cacheKey);
      const row2 = cachedColumns.map((column) => firstItem[column] ?? void 0);
      return {
        columns: cachedColumns,
        values: [row2]
      };
    }
    const columns = Object.keys(firstItem).sort();
    if (cacheKey && columns.length > 0) {
      this.columnCache.set(cacheKey, columns);
    }
    const row = columns.map((column) => firstItem[column] ?? void 0);
    return {
      columns,
      values: [row]
    };
  }
  update() {
    const withSQL = this.with();
    const updates = this._prepUpdate(this.single.update);
    const where = this.where();
    const order = this.order();
    const limit = this.limit();
    const { returning } = this.single;
    const optimizationHints = this.getOptimizationHints("update");
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
  getOptimizationHints(queryType, data) {
    const hints = [];
    if (queryType === "select") {
      hints.push("WITH UR");
    }
    return hints.length > 0 ? " " + hints.join(" ") : "";
  }
  getSelectOptimizationHints(sql) {
    const hints = [];
    hints.push("WITH UR");
    return hints.length > 0 ? " " + hints.join(" ") : "";
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
var IBMiMigrationRunner = class {
  constructor(knex2, config) {
    __publicField(this, "knex");
    __publicField(this, "config");
    this.knex = knex2;
    this.config = {
      directory: "./migrations",
      tableName: "KNEX_MIGRATIONS",
      schemaName: void 0,
      extension: "js",
      ...config
    };
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
          table.string("name");
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
          const migration = await import(migrationPath);
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
          const migration = await import(migrationPath);
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
    const { directory, extension } = this.config;
    if (!import_fs.default.existsSync(directory)) {
      throw new Error(`Migration directory does not exist: ${directory}`);
    }
    const validExtensions = ["js", "ts", "mjs", "cjs"];
    const extensionToCheck = extension || "js";
    return import_fs.default.readdirSync(directory).filter((file) => {
      if (extension && extension !== "js") {
        return file.endsWith(`.${extension}`);
      }
      return validExtensions.some((ext) => file.endsWith(`.${ext}`));
    }).sort();
  }
  getMigrationPath(filename) {
    return import_path.default.resolve(this.config.directory, filename);
  }
};
function createIBMiMigrationRunner(knex2, config) {
  return new IBMiMigrationRunner(knex2, config);
}

// src/index.ts
var DB2Client = class extends import_knex.default.Client {
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
      return this.printError("There is no connection config defined");
    }
    this.printDebug(
      "connection config: " + this._getConnectionString(connectionConfig)
    );
    let connection;
    if (this.config?.pool) {
      const poolConfig = {
        connectionString: this._getConnectionString(connectionConfig),
        connectionTimeout: this.config?.acquireConnectionTimeout || 6e4,
        initialSize: this.config?.pool?.min || 2,
        maxSize: this.config?.pool?.max || 10,
        reuseConnection: true
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
    return `DRIVER=${connectionConfig.driver};SYSTEM=${connectionConfig.host};HOSTNAME=${connectionConfig.host};PORT=${connectionConfig.port};DATABASE=${connectionConfig.database};UID=${connectionConfig.user};PWD=${connectionConfig.password};` + connectionStringExtension;
  }
  // Runs the query on the specified connection, providing the bindings
  async _query(connection, obj) {
    const queryObject = this.normalizeQueryObject(obj);
    const method = this.determineQueryMethod(queryObject);
    queryObject.sqlMethod = method;
    if (import_node_process.default.env.DEBUG === "true" && queryObject.sql && (queryObject.sql.toLowerCase().includes("create table") || queryObject.sql.toLowerCase().includes("knex_migrations"))) {
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
      if (import_node_process.default.env.DEBUG === "true" && queryObject.sql && (queryObject.sql.toLowerCase().includes("create table") || queryObject.sql.toLowerCase().includes("knex_migrations"))) {
        this.printDebug(`${method} completed in ${endTime - startTime}ms`);
      }
      this.printDebug(`Query completed: ${method} (${endTime - startTime}ms)`);
      return queryObject;
    } catch (error) {
      const wrappedError = this.wrapError(error, method, queryObject);
      if (this.isConnectionError(error)) {
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
    let statement;
    try {
      statement = await connection.createStatement();
      await statement.prepare(obj.sql);
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
      if (statement && typeof statement.close === "function") {
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
    const rowCount = typeof result?.count === "number" ? result.count : 0;
    return {
      rows: result,
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
  calculateOptimalFetchSize(sql) {
    const sqlLower = sql.toLowerCase();
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
            this.push(result);
          } else {
            isClosed = true;
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
      },
      destroy(err, callback) {
        if (!isClosed) {
          isClosed = true;
          cursor.close((closeError) => {
            if (closeError) {
              parentThis.printDebug("Error closing cursor during destroy: " + parentThis.safeStringify(closeError));
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
    const validationResult = this.validateResponse(obj);
    if (validationResult !== null) return validationResult;
    return this.processSqlMethod(obj);
  }
  validateResponse(obj) {
    if (!obj.response) {
      this.printDebug("response undefined" + JSON.stringify(obj));
      return null;
    }
    if (!obj.response.rows) {
      this.printError("rows undefined" + JSON.stringify(obj));
      return null;
    }
    return null;
  }
  wrapError(error, method, queryObject) {
    const context = {
      method,
      sql: queryObject.sql ? queryObject.sql.substring(0, 100) + "..." : "unknown",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
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
    return new Error(
      `IBM i DB2 error during ${method}: ${error.message} | Context: ${JSON.stringify(context)}`
    );
  }
  shouldRetryQuery(queryObject, method) {
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
      queryObject.response = { rows: [], rowCount: 0 };
      return queryObject;
    }
  }
  isConnectionError(error) {
    const errorMessage = (error.message || error.toString || error).toLowerCase();
    return errorMessage.includes("connection") && (errorMessage.includes("closed") || errorMessage.includes("invalid") || errorMessage.includes("terminated") || errorMessage.includes("not connected"));
  }
  isTimeoutError(error) {
    const errorMessage = (error.message || error.toString || error).toLowerCase();
    return errorMessage.includes("timeout") || errorMessage.includes("timed out");
  }
  isSQLError(error) {
    const errorMessage = (error.message || error.toString || error).toLowerCase();
    return errorMessage.includes("sql") || errorMessage.includes("syntax") || errorMessage.includes("table") || errorMessage.includes("column");
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