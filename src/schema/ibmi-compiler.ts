import SchemaCompiler from "knex/lib/schema/compiler";

class IBMiSchemaCompiler extends SchemaCompiler {
  hasTable(tableName: any) {
    // @ts-expect-error
    const formattedTable = this.client.parameter(
      prefixedTableName(this.schema, tableName),
      this.builder,
      this.bindingsHolder,
    );
    const bindings = [tableName];
    let sql =
      `select TABLE_NAME from QSYS2.SYSTABLES where TYPE = 'T' and TABLE_NAME = ${formattedTable}`;

    if (this.schema) {
      sql += " and TABLE_SCHEMA = ?";
      bindings.push(this.schema);
    }

    this.pushQuery({
      sql,
      bindings,
      output: (resp: { rowCount: number; }) => {
        return resp.rowCount > 0;
      },
    });
  }

  toSQL() {
    // @ts-expect-error
    const sequence = this.builder._sequence;

    for (let i = 0, l = sequence.length; i < l; i++) {
      const query = sequence[i];
      this[query.method].apply(this, query.args);
    }

    return this.sequence;
  }
}

function prefixedTableName(prefix: any, table: any) {
  return prefix ? `${prefix}.${table}` : table;
}

export default IBMiSchemaCompiler;
