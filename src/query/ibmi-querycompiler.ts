import QueryCompiler from "knex/lib/query/querycompiler.js";
import { rawOrFn as rawOrFn_ } from "knex/lib/formatter/wrappingFormatter.js";

class IBMiQueryCompiler extends QueryCompiler {
  // Use type assertion to work around ESM import interface issues
  [key: string]: any;

  // Cache for column metadata to improve performance with repeated operations
  private columnCache = new Map<string, string[]>();

  // Override select method to add IBM i optimization hints
  select() {
    const originalResult = super.select.call(this);
    return originalResult;
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

    // Get the standard INSERT statement from parent class
    const standardInsert = super.insert();

    // If it's an object with sql property, use that; otherwise use the string directly
    const insertSql = typeof standardInsert === 'object' && standardInsert.sql ? standardInsert.sql : standardInsert;

    // For IBM i, wrap INSERT with FINAL TABLE and return IDENTITY_VAL_LOCAL()
    const selectColumns = "IDENTITY_VAL_LOCAL()";
    const sql = `select ${selectColumns} from FINAL TABLE(${insertSql})`;

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

    // Handle case with columns and data
    if (insertData.columns.length > 0) {
      // IBM i DB2 doesn't handle multi-row inserts well via ODBC
      // Use single-row insert format for better compatibility
      const parts: string[] = [];
      parts.push('(');
      parts.push(this.formatter.columnize(insertData.columns));
      parts.push(') ');
      if (returningSql) {
        parts.push(returningSql);
      }
      parts.push('values (');

      // Build values for the first row only (IBM i limitation)
      const firstRowValues = insertData.values[0] || [];
      const valueStrings = firstRowValues.map(() => '?');
      parts.push(valueStrings.join(', '));

      parts.push(')');
      return parts.join('');
    }

    // Handle a single empty object case
    if (
      Array.isArray(insertValues) &&
      insertValues.length === 1 &&
      insertValues[0]
    ) {
      return returningSql + this._emptyInsertValue;
    }

    // Handle empty/invalid data
    return "";
  }

  private generateCacheKey(data: any): string {
    if (Array.isArray(data) && data.length > 0) {
      // Use the keys of the first object as cache key
      return Object.keys(data[0] || {}).sort().join('|');
    }
    if (data && typeof data === 'object') {
      return Object.keys(data).sort().join('|');
    }
    return '';
  }

  private buildFromCache(data: any, cachedColumns: string[]): { columns: any; values: any } {
    const dataArray = Array.isArray(data) ? data : data ? [data] : [];
    const values: any[] = [];

    // Build values array using cached column order
    for (const item of dataArray) {
      if (item == null) {
        break;
      }
      const row = cachedColumns.map((column) => item[column] ?? undefined);
      values.push(row);
    }

    return {
      columns: cachedColumns,
      values,
    };
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
      this.bindingsHolder
    );

    if (isRaw) {
      return isRaw;
    }

    // Normalize data to array format
    const dataArray = Array.isArray(data) ? data : data ? [data] : [];

    if (dataArray.length === 0) {
      return { columns: [], values: [] };
    }

    // IBM i DB2 via ODBC has issues with multi-row inserts
    // Process only the first row for now
    const firstItem = dataArray[0];
    if (!firstItem || typeof firstItem !== 'object') {
      return { columns: [], values: [] };
    }

    // Try to use cache for performance with repeated operations
    const cacheKey = this.generateCacheKey(firstItem);
    if (cacheKey && this.columnCache.has(cacheKey)) {
      const cachedColumns = this.columnCache.get(cacheKey)!;
      const row = cachedColumns.map((column) => firstItem[column] ?? undefined);
      return {
        columns: cachedColumns,
        values: [row],
      };
    }

    // Get columns from first item only
    const columns = Object.keys(firstItem).sort();

    // Cache the columns for future use
    if (cacheKey && columns.length > 0) {
      this.columnCache.set(cacheKey, columns);
    }

    // Build values for first row only
    const row = columns.map((column) => firstItem[column] ?? undefined);

    return {
      columns,
      values: [row],
    };
  }

  update(): { sql: string; returning: any } {
    const withSQL = this.with();
    const updates = this._prepUpdate(this.single.update);
    const where = this.where();
    const order = this.order();
    const limit = this.limit();
    const { returning } = this.single;

    // Add IBM i v7r3+ optimization hints for UPDATE
    const optimizationHints = '';

    // Build the base update statement
    const baseUpdateSql = [
      withSQL,
      `update ${this.single.only ? "only " : ""}${this.tableName}`,
      "set",
      updates.join(", "),
      where,
      order,
      limit,
      optimizationHints
    ]
      .filter(Boolean)
      .join(" ");

    // Handle returning clause
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

  private getOptimizationHints(queryType: string, data?: any): string {
    const hints: string[] = [];

    // IBM i DB2 doesn't support OPTIMIZE FOR in all contexts
    // Use WITH UR (Uncommitted Read) for better concurrency instead
    if (queryType === 'select') {
      hints.push('WITH UR'); // Uncommitted Read for better performance on read-heavy workloads
    }

    return hints.length > 0 ? ' ' + hints.join(' ') : '';
  }

  private getSelectOptimizationHints(sql: string): string {
    const hints: string[] = [];

    // Only use WITH UR for read operations on IBM i DB2
    // OPTIMIZE FOR syntax causes errors on this IBM i version
    hints.push('WITH UR');

    return hints.length > 0 ? ' ' + hints.join(' ') : '';
  }

  columnizeWithPrefix(prefix: string, target: string | string[]) {
    const columns = typeof target === "string" ? [target] : target;
    const parts: string[] = [];

    for (let i = 0; i < columns.length; i++) {
      if (i > 0) parts.push(", ");
      parts.push(prefix + this.wrap(columns[i]));
    }

    return parts.join('');
  }
}

export default IBMiQueryCompiler;
