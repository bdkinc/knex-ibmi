import SchemaCompiler from "knex/lib/schema/compiler";

class IBMiSchemaCompiler extends SchemaCompiler {
  hasTable(tableName: any) {
    // DB2 on IBM i folds unquoted identifiers to uppercase. Use case-insensitive check.
    const formattedTable = "?";
    const bindings = [String(tableName).toUpperCase()];
    let sql = `select TABLE_NAME from QSYS2.SYSTABLES where TYPE = 'T' and UPPER(TABLE_NAME) = ${formattedTable}`;

    if (this.schema) {
      sql += " and UPPER(TABLE_SCHEMA) = ?";
      bindings.push(String(this.schema).toUpperCase());
    }

    this.pushQuery({
      sql,
      bindings,
      output: (resp: { rowCount: number }) => {
        return resp.rowCount > 0;
      },
    });
  }

  toSQL() {
    const sequence = (this.builder as any)._sequence as any[];

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
