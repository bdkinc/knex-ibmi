import QueryCompiler from "knex/lib/query/querycompiler";
import isObject from "lodash/isObject";
import { rawOrFn as rawOrFn_ } from "knex/lib/formatter/wrappingFormatter";
import { format } from "date-fns";

class IBMiQueryCompiler extends QueryCompiler {
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
}

export default IBMiQueryCompiler;
