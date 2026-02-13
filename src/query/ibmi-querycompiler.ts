import QueryCompiler from "knex/lib/query/querycompiler.js";
import { rawOrFn as rawOrFn_ } from "knex/lib/formatter/wrappingFormatter.js";

class IBMiQueryCompiler extends QueryCompiler {
  // Use type assertion to work around ESM import interface issues
  [key: string]: any;

  // Cache for column metadata to improve performance with repeated operations
  private columnCache = new Map<string, string[]>();

  // Override select method to add IBM i optimization hints
  select() {
    let sql = super.select.call(this);

    // Add WITH UR (uncommitted read) if configured
    const readUncommitted = this.client?.config?.ibmi?.readUncommitted === true;
    if (readUncommitted && typeof sql === "string") {
      sql = sql + " WITH UR";
    }

    return sql;
  }

  private formatTimestampLocal(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0");
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

    // Handle empty insert values
    if (this.isEmptyInsertValues(insertValues)) {
      if (this.isEmptyObject(insertValues)) {
        return this.buildEmptyInsertResult(returning);
      }
      return "";
    }

    // Decide multi-row insert strategy (default: allow multi-row single statement)
    const ibmiConfig = this.client?.config?.ibmi || {};
    const multiRowStrategy = ibmiConfig.multiRowInsert || "auto"; // 'auto' | 'sequential' | 'disabled'

    // When disabled, or sequential strategy with >1 rows, fall back to first-row SQL generation here.
    // For sequential strategy, execution of all rows is handled at runtime in the client.
    const isArrayInsert =
      Array.isArray(insertValues) && insertValues.length > 1;
    // Keep original values for sequential strategy metadata
    const originalValues = isArrayInsert ? insertValues.slice() : insertValues;
    const forceSingleRow =
      multiRowStrategy === "disabled" ||
      (multiRowStrategy === "sequential" && isArrayInsert);

    // If forcing single row, keep legacy single-row path by trimming to first element
    let workingValues: any = insertValues;
    if (forceSingleRow && isArrayInsert) {
      workingValues = [insertValues[0]];
      this.single.insert = workingValues; // mutate for downstream calls
    }

    // Get the standard INSERT statement from parent class (will include multi-row SQL if available)
    const standardInsert = super.insert();

    // If it's an object with sql property, use that; otherwise use the string directly
    const insertSql =
      typeof standardInsert === "object" && standardInsert.sql
        ? standardInsert.sql
        : standardInsert;

    // For IBM i, wrap INSERT with FINAL TABLE only when RETURNING is requested
    // Multi-row inserts without RETURNING should use plain INSERT for performance
    const multiRow = isArrayInsert && !forceSingleRow;

    // If multi-row insert without returning, use plain INSERT (return rowCount only)
    if (multiRow && !returning) {
      return { sql: insertSql, returning: undefined };
    }

    // Warn about potentially large result sets
    if (multiRow && returning === "*") {
      if (this.client?.printWarn) {
        this.client.printWarn("multi-row insert with returning * may be large");
      }
    }

    // Use FINAL TABLE for single-row or when returning is specified
    const selectColumns = returning
      ? this.formatter.columnize(returning)
      : "IDENTITY_VAL_LOCAL()";
    const sql = `select ${selectColumns} from FINAL TABLE(${insertSql})`;

    // Add metadata for sequential strategy so runtime can execute remaining rows
    if (multiRowStrategy === "sequential" && isArrayInsert) {
      // Build column list using first row keys (sorted to match _prepInsert logic)
      const first = originalValues[0];
      const columns = Object.keys(first).sort();
      return {
        sql,
        returning: undefined,
        _ibmiSequentialInsert: {
          columns,
          rows: originalValues,
          tableName: this.tableName,
          returning: returning || null,
          identityOnly: !returning,
        },
      };
    }

    return { sql, returning: undefined };
  }

  private isEmptyInsertValues(insertValues: any): boolean {
    return (
      (Array.isArray(insertValues) && insertValues.length === 0) ||
      this.isEmptyObject(insertValues)
    );
  }

  private isEmptyObject(insertValues: any): boolean {
    return (
      insertValues !== null &&
      typeof insertValues === "object" &&
      !Array.isArray(insertValues) &&
      Object.keys(insertValues).length === 0
    );
  }

  private buildEmptyInsertResult(returning: any): {
    sql: string;
    returning: any;
  } {
    const selectColumns = returning
      ? this.formatter.columnize(returning)
      : "IDENTITY_VAL_LOCAL()";

    const returningSql = returning
      ? this._returning("insert", returning, undefined) + " "
      : "";

    const insertSql = [
      this.with(),
      `insert into ${this.tableName}`,
      returningSql + this._emptyInsertValue,
    ]
      .filter(Boolean)
      .join(" ");

    const sql = `select ${selectColumns} from FINAL TABLE(${insertSql})`;

    return { sql, returning };
  }

  _buildInsertData(insertValues: string | any[], returningSql: string): string {
    const insertData = this._prepInsert(insertValues);

    if (insertData.columns.length > 0) {
      const parts: string[] = [];
      parts.push("(" + this.formatter.columnize(insertData.columns) + ") ");
      if (returningSql) parts.push(returningSql);
      parts.push("values ");

      const rowsSql: string[] = [];
      for (const row of insertData.values) {
        const placeholders = row.map(() => "?").join(", ");
        rowsSql.push("(" + placeholders + ")");
      }
      parts.push(rowsSql.join(", "));
      return parts.join("");
    }

    if (
      Array.isArray(insertValues) &&
      insertValues.length === 1 &&
      insertValues[0]
    ) {
      return (returningSql || "") + this._emptyInsertValue;
    }
    return "";
  }

  private generateCacheKey(data: any): string {
    // Include table name to prevent cache collisions between tables with same columns
    const tablePrefix = this.tableName ? `${this.tableName}:` : "";
    if (Array.isArray(data) && data.length > 0) {
      // Use the keys of the first object as cache key
      return (
        tablePrefix +
        Object.keys(data[0] || {})
          .sort()
          .join("|")
      );
    }
    if (data && typeof data === "object") {
      return tablePrefix + Object.keys(data).sort().join("|");
    }
    return "";
  }

  _prepInsert(data: any): { columns: any; values: any } {
    // Handle timestamps in knex migrations
    if (typeof data === "object" && data?.migration_time) {
      const parsed = new Date(data.migration_time);
      if (!isNaN(parsed.getTime())) {
        data.migration_time = this.formatTimestampLocal(parsed);
      }
    }

    const isRaw = rawOrFn_(
      data,
      undefined,
      this.builder,
      this.client,
      this.bindingsHolder,
    );

    if (isRaw) {
      return isRaw;
    }

    // Normalize data to array format
    const dataArray = Array.isArray(data) ? data : data ? [data] : [];

    if (dataArray.length === 0) {
      return { columns: [], values: [] };
    }

    // Multi-row support: build unified column list from first row, then map all rows
    const firstItem = dataArray[0];
    if (!firstItem || typeof firstItem !== "object") {
      return { columns: [], values: [] };
    }

    const cacheKey = this.generateCacheKey(firstItem);
    let columns: string[];
    if (cacheKey && this.columnCache.has(cacheKey)) {
      columns = this.columnCache.get(cacheKey)!;
    } else {
      columns = Object.keys(firstItem).sort();
      if (cacheKey && columns.length > 0)
        this.columnCache.set(cacheKey, columns);
    }

    const values: any[] = [];
    for (const item of dataArray) {
      if (!item || typeof item !== "object") continue;
      values.push(columns.map((c) => item[c] ?? undefined));
    }

    return { columns, values };
  }

  update(): { sql: string; returning: any; _ibmiUpdateReturning?: any } {
    const withSQL = this.with();
    const updates = this._prepUpdate(this.single.update);
    const where = this.where();
    const order = this.order();
    const limit = this.limit();
    const { returning } = this.single;

    // Add IBM i v7r3+ optimization hints for UPDATE
    const optimizationHints = "";

    // Build the base update statement
    const baseUpdateSql = [
      withSQL,
      `update ${this.single.only ? "only " : ""}${this.tableName}`,
      "set",
      updates.join(", "),
      where,
      order,
      limit,
      optimizationHints,
    ]
      .filter(Boolean)
      .join(" ");

    // Handle returning clause
    if (returning) {
      // Return the base UPDATE SQL (not FINAL TABLE wrapper)
      // The metadata tells the client to execute UPDATE + SELECT separately
      // This ensures that .toString() and .toQuery() don't generate invalid FINAL TABLE syntax
      const selectColumns = this.formatter.columnize(this.single.returning);

      return {
        sql: baseUpdateSql,
        returning,
        _ibmiUpdateReturning: {
          updateSql: baseUpdateSql,
          selectColumns,
          whereClause: where,
          tableName: this.tableName,
          setBindingCount: updates
            .map((fragment: string) => (fragment.match(/\?/g) || []).length)
            .reduce((sum: number, count: number) => sum + count, 0),
        },
      };
    }

    return { sql: baseUpdateSql, returning };
  }

  // Emulate DELETE ... RETURNING by attaching metadata for SELECT + DELETE execution
  del(): { sql: string; returning: any; _ibmiDeleteReturning?: any } {
    const baseDelete = super.del();
    const { returning } = this.single;
    if (!returning) {
      return { sql: baseDelete as string, returning: undefined };
    }
    const deleteSql =
      typeof baseDelete === "object" && (baseDelete as any).sql
        ? (baseDelete as any).sql
        : baseDelete;
    const selectColumns = this.formatter.columnize(returning);
    // Return the base DELETE SQL (not FINAL TABLE wrapper)
    // The metadata tells the client to execute SELECT + DELETE separately
    // This ensures that .toString() and .toQuery() don't generate invalid FINAL TABLE syntax
    return {
      sql: deleteSql,
      returning,
      _ibmiDeleteReturning: {
        deleteSql,
        selectColumns,
        whereClause: this.where(),
        tableName: this.tableName,
      },
    };
  }

  /**
   * Handle returning clause for IBMi DB2 queries
   * Note: IBMi DB2 has limited support for RETURNING clauses
   * @param method - The SQL method (insert, update, delete)
   * @param value - The returning value
   * @param withTrigger - Trigger support (currently unused)
   */
  _returning(method: string, value: any, withTrigger: undefined) {
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

  columnizeWithPrefix(prefix: string, target: string | string[]) {
    const columns = typeof target === "string" ? [target] : target;
    const parts: string[] = [];

    for (let i = 0; i < columns.length; i++) {
      if (i > 0) parts.push(", ");
      parts.push(prefix + this.wrap(columns[i]));
    }

    return parts.join("");
  }
}

export default IBMiQueryCompiler;
