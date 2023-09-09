"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
const compiler_1 = require("knex/lib/schema/compiler");
class IBMiSchemaCompiler extends compiler_1.default {
    hasTable(tableName) {
        // @ts-ignore
        const formattedTable = this.client.parameter(
        // @ts-ignore
        prefixedTableName(this.schema, tableName), 
        // @ts-ignore
        this.builder, 
        // @ts-ignore
        this.bindingsHolder);
        const bindings = [tableName];
        let sql = `SELECT TABLE_NAME FROM QSYS2.SYSTABLES ` +
            `where TYPE = 'T' and TABLE_NAME = ${formattedTable}`;
        // @ts-ignore
        if (this.schema) {
            sql += " and TABLE_SCHEMA = ?";
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
            this[query.method].apply(this, query.args);
        }
        // @ts-ignore
        return this.sequence;
    }
}
function prefixedTableName(prefix, table) {
    return prefix ? `${prefix}.${table}` : table;
}
exports.default = IBMiSchemaCompiler;
//# sourceMappingURL=ibmi-compiler.js.map