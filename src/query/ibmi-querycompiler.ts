import QueryCompiler from "knex/lib/query/querycompiler";
import isObject from "lodash/isObject";
import { rawOrFn as rawOrFn_ } from "knex/lib/formatter/wrappingFormatter";
import { format } from "date-fns";
import * as console from "console";
import isEmpty from "lodash/isEmpty";

class IBMiQueryCompiler extends QueryCompiler {
  insert() {
    // @ts-ignore
    const insertValues = this.single.insert || [];
    // we need to return a value
    // we need to wrap the insert statement in a select statement
    // we use the "IDENTITY_VAL_LOCAL()" function to return the IDENTITY
    // unless specified in a return
    // @ts-ignore
    let sql = `SELECT ${
      // @ts-ignore
      this.single.returning
        ? // @ts-ignore
          this.formatter.columnize(this.single.returning)
        : "IDENTITY_VAL_LOCAL()"
    } FROM FINAL TABLE(`;
    // @ts-ignore
    sql += this.with() + `insert into ${this.tableName} `;
    // @ts-ignore
    const { returning } = this.single;
    const returningSql = returning
      ? // @ts-ignore
        this._returning("insert", returning) + " "
      : "";

    if (Array.isArray(insertValues)) {
      if (insertValues.length === 0) {
        return "";
      }
    } else if (typeof insertValues === "object" && isEmpty(insertValues)) {
      return {
        // @ts-ignore
        sql: sql + returningSql + this._emptyInsertValue,
        returning,
      };
    }

    // @ts-ignore
    sql += this._buildInsertData(insertValues, returningSql);
    sql += ")";

    return {
      sql,
      returning,
    };
  }

  _buildInsertData(insertValues, returningSql) {
    let sql = "";
    const insertData = this._prepInsert(insertValues);
    if (typeof insertData === "string") {
      sql += insertData;
    } else {
      if (insertData.columns.length) {
        // @ts-ignore
        sql += `(${this.formatter.columnize(insertData.columns)}`;
        sql +=
          `) ${returningSql}values (` +
          // @ts-ignore
          this._buildInsertValues(insertData) +
          ")";
      } else if (insertValues.length === 1 && insertValues[0]) {
        // @ts-ignore
        sql += returningSql + this._emptyInsertValue;
      } else {
        return "";
      }
    }
    return sql;
  }

  _prepInsert(data) {
    if (isObject(data)) {
      if (data.hasOwnProperty("migration_time")) {
        const parsed = new Date(data.migration_time);
        data.migration_time = format(parsed, "yyyy-MM-dd HH:mm:ss");
      }
    }

    const isRaw = rawOrFn_(
      data,
      undefined,
      // @ts-ignore
      this.builder,
      // @ts-ignore
      this.client,
      // @ts-ignore
      this.bindingsHolder,
    );
    if (isRaw) return isRaw;
    let columns: any[] = [];
    const values: any[] = [];
    if (!Array.isArray(data)) data = data ? [data] : [];
    let i = -1;
    while (++i < data.length) {
      if (data[i] == null) break;
      if (i === 0) columns = Object.keys(data[i]).sort();
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

  _returning(method, value, withTrigger) {
    // currently a placeholder in case I need to update return values
    switch (method) {
      case "update":
      case "insert":
        return value
          ? // @ts-ignore
            `${withTrigger ? " into #out" : ""}`
          : "";
      case "del":
        return value
          ? // @ts-ignore
            `${withTrigger ? " into #out" : ""}`
          : "";
      case "rowcount":
        return value ? ";select @@rowcount" : "";
    }
  }

  columnizeWithPrefix(prefix, target) {
    const columns = typeof target === "string" ? [target] : target;
    let str = "",
      i = -1;
    while (++i < columns.length) {
      if (i > 0) str += ", ";
      str += prefix + this.wrap(columns[i]);
    }
    return str;
  }
}

export default IBMiQueryCompiler;
