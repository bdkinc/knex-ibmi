import QueryCompiler from "knex/lib/query/querycompiler";
import has from "lodash/has";
import isEmpty from "lodash/isEmpty";
import omitBy from "lodash/omitBy";
import isObject from "lodash/isObject";
import {
  wrap as wrap_,
  rawOrFn as rawOrFn_,
} from "knex/lib/formatter/wrappingFormatter";
import { format, parseISO } from "date-fns";
import * as console from "console";

class IBMiQueryCompiler extends QueryCompiler {
  _prepInsert(data) {
    if (isObject(data)) {
      console.log("data is object", data);
      if (data.hasOwnProperty("migration_time")) {
        console.log("data has migration_time", data.migration_time);
        const parsed = new Date(data.migration_time);
        console.log(parsed);
        data.migration_time = format(parsed, "yyyy-MM-dd HH:mm:ss");
        console.log(data.migration_time);
      }
      console.log("data date after change", data);
    }
    const isRaw = rawOrFn_(
      data,
      undefined,
      this.builder,
      this.client,
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

  _prepUpdate(data = {}): any[] {
    const { counter = {} } = this.single;

    for (const column of Object.keys(counter)) {
      //Skip?
      if (has(data, column)) {
        //Needed?
        this.client.logger.warn(
          `increment/decrement called for a column that has already been specified in main .update() call. Ignoring increment/decrement and using value from .update() call.`,
        );
        continue;
      }

      let value = counter[column];

      const symbol = value < 0 ? "-" : "+";

      if (symbol === "-") {
        value = -value;
      }

      data[column] = this.client.raw(`?? ${symbol} ?`, [column, value]);
    }

    data = omitBy(data, (value) => typeof value === "undefined");

    const vals = [];
    const columns = Object.keys(data);
    let i = -1;

    while (++i < columns.length) {
      vals.push(
        wrap_(
          columns[i],
          undefined,
          this.builder,
          this.client,
          this.bindingsHolder,
        ) +
          " = " +
          this.client.parameter(
            data[columns[i]],
            this.builder,
            this.bindingsHolder,
          ),
      );
    }

    if (isEmpty(vals)) {
      throw new Error(
        [
          "Empty .update() call detected!",
          "Update data does not contain any values to update.",
          "This will result in a faulty query.",
          this.single.table ? `Table: ${this.single.table}.` : "",
          this.single.update
            ? `Columns: ${Object.keys(this.single.update)}.`
            : "",
        ].join(" "),
      );
    }

    return vals;
  }
}

export default IBMiQueryCompiler;
