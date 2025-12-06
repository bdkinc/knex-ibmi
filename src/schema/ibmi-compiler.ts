import SchemaCompiler from "knex/lib/schema/compiler.js";

class IBMiSchemaCompiler extends SchemaCompiler {
  // Use type assertion to work around ESM import interface issues
  [key: string]: any;

  hasTable(tableName: string) {
    const upperName = String(tableName).toUpperCase();

    // Extract schema and table name if qualified
    let schemaName: string | null = null;
    let actualTableName = upperName;

    if (upperName.includes(".")) {
      const parts = upperName.split(".");
      schemaName = parts[0];
      actualTableName = parts[1];
    }

    // Use schema from the builder if available
    const builderSchema = (this.builder as any)._schema;
    if (builderSchema) {
      schemaName = builderSchema.toUpperCase();
    }

    let sql: string;
    let bindings: any[];

    if (schemaName) {
      sql = `select count(*) as table_count from QSYS2.SYSTABLES where UPPER(TABLE_NAME) = ? AND UPPER(TABLE_SCHEMA) = ?`;
      bindings = [actualTableName, schemaName];
    } else {
      sql = `select count(*) as table_count from QSYS2.SYSTABLES where UPPER(TABLE_NAME) = ?`;
      bindings = [actualTableName];
    }

    this.pushQuery({
      sql,
      bindings,
      output: (runner: any, resp: any) => {
        // Handle the response from the ODBC query
        // The first parameter is the runner, the second is the actual response
        if (!resp) {
          return false;
        }

        // Check if response is an array with results
        if (Array.isArray(resp) && resp.length > 0) {
          const firstRow = resp[0];
          if (firstRow && typeof firstRow === "object") {
            // Look for table_count or any count field
            const count =
              firstRow.table_count ||
              firstRow.TABLE_COUNT ||
              firstRow.count ||
              firstRow.COUNT ||
              0;
            return count > 0;
          }
        }

        // Handle ODBC response format with numeric keys
        if (typeof resp === "object" && resp !== null) {
          // Check for ODBC array-like response with numeric indices
          const keys = Object.keys(resp);
          for (const key of keys) {
            if (!isNaN(parseInt(key))) {
              const row = resp[key];
              if (row && typeof row === "object") {
                const count =
                  row.table_count ||
                  row.TABLE_COUNT ||
                  row.count ||
                  row.COUNT ||
                  0;
                return count > 0;
              }
            }
          }

          // Handle response with rows property
          if (resp.rows && Array.isArray(resp.rows) && resp.rows.length > 0) {
            const firstRow = resp.rows[0];
            if (firstRow && typeof firstRow === "object") {
              const count =
                firstRow.table_count ||
                firstRow.TABLE_COUNT ||
                firstRow.count ||
                firstRow.COUNT ||
                0;
              return count > 0;
            }
          }
        }

        return false;
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

export default IBMiSchemaCompiler;
