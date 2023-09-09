"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
const columncompiler_1 = require("knex/lib/schema/columncompiler");
class IBMiColumnCompiler extends columncompiler_1.default {
    increments(options = { primaryKey: true }) {
        return ("int not null generated always as identity (start with 1, increment by 1)" +
            // @ts-ignore
            (this.tableCompiler._canBeAddPrimaryKey(options) ? " primary key" : ""));
    }
}
exports.default = IBMiColumnCompiler;
//# sourceMappingURL=ibmi-columncompiler.js.map