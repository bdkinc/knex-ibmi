import QueryCompiler from "knex/lib/query/querycompiler";
import { rawOrFn as rawOrFn_ } from "knex/lib/formatter/wrappingFormatter";
import { format } from "date-fns";

class IBMiQueryCompiler extends QueryCompiler {
  insert() {
    const insertValues = this.single.insert || [];

    // TODO: re-evaluate
    // we need to return a value,
    // we need to wrap the insert statement in a select statement
    // we use the "IDENTITY_VAL_LOCAL()" function to return the IDENTITY
    // unless specified in a return
    let sql = `select ${
      this.single.returning
        ? this.formatter.columnize(this.single.returning)
        : "IDENTITY_VAL_LOCAL()"
    } from FINAL TABLE(`;

    sql += this.with() + `insert into ${this.tableName} `;

    const { returning } = this.single;
    const returningSql = returning
      ? this._returning("insert", returning, undefined) + " "
      : "";

    if (Array.isArray(insertValues)) {
      if (insertValues.length === 0) {
        return "";
      }
    } else if (
      typeof insertValues === "object" &&
      Object.keys(insertValues).length === 0
    ) {
      return {
        sql: sql + returningSql + this._emptyInsertValue,
        returning,
      };
    }

    sql += this._buildInsertData(insertValues, returningSql);
    sql += ")";

    return {
      sql,
      returning,
    };
  }

  _buildInsertData(insertValues: string | any[], returningSql: string) {
    let sql = "";
    const insertData = this._prepInsert(insertValues);

    if (insertData.columns.length) {
      sql += `(${this.formatter.columnize(insertData.columns)}`;
      sql +=
        `) ${returningSql}values (` +
        this._buildInsertValues(insertData) +
        ")";
    } else if (insertValues.length === 1 && insertValues[0]) {
      sql += returningSql + this._emptyInsertValue;
    } else {
      return "";
    }

    return sql;
  }

  _prepInsert(data: any): { columns: any; values: any } {
    // this is for timestamps in knex migrations
    if (typeof data === "object" && data.migration_time) {
      const parsed = new Date(data.migration_time);
      data.migration_time = format(parsed, "yyyy-MM-dd HH:mm:ss");
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

    let columns: any[] = [];
    const values: any[] = [];

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
            values[k].splice(idx, 0, undefined);
          }
          row.splice(idx, 0, undefined);
        }
        row[idx] = data[i][key];
      }

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

    let sql = "";

    if (returning) {
      console.error("IBMi DB2 does not support returning in update statements, only inserts");
      sql += `select ${this.formatter.columnize(this.single.returning)} from FINAL TABLE(`;
    }

    sql +=
      withSQL +
      `update ${this.single.only ? "only " : ""}${this.tableName}` +
      " set " +
      updates.join(", ") +
      (where ? ` ${where}` : "") +
      (order ? ` ${order}` : "") +
      (limit ? ` ${limit}` : "");

    if (returning) {
      sql += `)`;
    }

    return { sql, returning };
  }

  _returning(method: string, value: any, withTrigger: undefined) {
    // currently a placeholder in case I need to update return values
    // or if we need to do anything with triggers
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
