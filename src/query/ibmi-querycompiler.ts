import QueryCompiler from "knex/lib/query/querycompiler";
import { rawOrFn as rawOrFn_ } from "knex/lib/formatter/wrappingFormatter";

class IBMiQueryCompiler extends QueryCompiler {
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

    // Build the complete INSERT statement wrapped in SELECT from FINAL TABLE
    const selectColumns = returning
      ? this.formatter.columnize(returning)
      : "IDENTITY_VAL_LOCAL()";

    const returningSql = returning
      ? this._returning("insert", returning, undefined) + " "
      : "";

    const insertSql = [
      this.with(),
      `insert into ${this.tableName}`,
      this._buildInsertData(insertValues, returningSql),
    ]
      .filter(Boolean)
      .join(" ");

    const sql = `select ${selectColumns} from FINAL TABLE(${insertSql})`;

    return { sql, returning };
  }

  private isEmptyInsertValues(insertValues: any): boolean {
    return (
      (Array.isArray(insertValues) && insertValues.length === 0) ||
      this.isEmptyObject(insertValues)
    );
  }

  private isEmptyObject(insertValues: any): boolean {
    return (
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
      const columnsSql = `(${this.formatter.columnize(insertData.columns)})`;
      const valuesSql = `(${this._buildInsertValues(insertData)})`;
      return `${columnsSql} ${returningSql}values ${valuesSql}`;
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

  _prepInsert(data: any): { columns: any; values: any } {
    // Handle timestamps in knex migrations
    if (typeof data === "object" && data?.migration_time) {
      const parsed = new Date(data.migration_time);
      if (!isNaN(parsed.getTime())) {
        data.migration_time = parsed
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");
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

    // Get all unique columns from all data objects
    const allColumns = new Set<string>();
    for (const item of dataArray) {
      if (item != null) {
        Object.keys(item).forEach((key) => allColumns.add(key));
      }
    }

    const columns = Array.from(allColumns).sort();
    const values: any[] = [];

    // Build values array
    for (const item of dataArray) {
      if (item == null) {
        break;
      }

      const row = columns.map((column) => item[column] ?? undefined);
      values.push(row);
    }

    return {
      columns,
      values,
    };
  }

  update(): { sql: string; returning: any } {
    const withSQL = this.with();
    const updates = this._prepUpdate(this.single.update);
    const where = this.where();
    const order = this.order();
    const limit = this.limit();
    const { returning } = this.single;

    // Build the base update statement
    const baseUpdateSql = [
      withSQL,
      `update ${this.single.only ? "only " : ""}${this.tableName}`,
      "set",
      updates.join(", "),
      where,
      order,
      limit,
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
    }
  }

  columnizeWithPrefix(prefix: string, target: any) {
    const columns = typeof target === "string" ? [target] : target;
    let str = "";
    let i = -1;

    while (++i < columns.length) {
      if (i > 0) str += ", ";
      str += prefix + this.wrap(columns[i]);
    }

    return str;
  }
}

export default IBMiQueryCompiler;
