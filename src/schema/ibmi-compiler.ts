import SchemaCompiler from "knex/lib/schema/compiler";
import * as console from "console";

class IBMiSchemaCompiler extends SchemaCompiler {
  constructor(client, builder) {
    super(client, builder);
  }

  hasTable(tableName) {
    // @ts-ignore
    const formattedTable = this.client.parameter(
      // @ts-ignore
      prefixedTableName(this.schema, tableName),
      // @ts-ignore
      this.builder,
      // @ts-ignore
      this.bindingsHolder,
    );
    const bindings = [tableName];
    let sql =
      `SELECT TABLE_NAME FROM QSYS2.SYSTABLES ` +
      `WHERE TYPE = 'T' AND TABLE_NAME = ${formattedTable}`;
    // @ts-ignore
    if (this.schema) {
      sql += " AND TABLE_SCHEMA = ?";
      // @ts-ignore
      bindings.push(this.schema);
    }

    // @ts-ignore
    this.pushQuery({
      sql,
      bindings,
      output: (resp) => {
        return resp.rowCount > 0;
      },
    });
  }

  toSQL() {
    // @ts-ignore
    const sequence = this.builder._sequence;
    for (let i = 0, l = sequence.length; i < l; i++) {
      const query = sequence[i];
      console.log(query.method, query);
      this[query.method].apply(this, query.args);
    }
    // @ts-ignore
    return this.sequence;
  }
}

function prefixedTableName(prefix, table) {
  return prefix ? `${prefix}.${table}` : table;
}

export default IBMiSchemaCompiler;
