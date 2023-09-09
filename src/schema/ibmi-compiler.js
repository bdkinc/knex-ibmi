"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
var compiler_1 = require("knex/lib/schema/compiler");
var IBMiSchemaCompiler = /** @class */ (function (_super) {
    __extends(IBMiSchemaCompiler, _super);
    function IBMiSchemaCompiler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    IBMiSchemaCompiler.prototype.hasTable = function (tableName) {
        // @ts-ignore
        var formattedTable = this.client.parameter(
        // @ts-ignore
        prefixedTableName(this.schema, tableName), 
        // @ts-ignore
        this.builder, 
        // @ts-ignore
        this.bindingsHolder);
        var bindings = [tableName];
        var sql = "SELECT TABLE_NAME FROM QSYS2.SYSTABLES " +
            "where TYPE = 'T' and TABLE_NAME = ".concat(formattedTable);
        // @ts-ignore
        if (this.schema) {
            sql += " and TABLE_SCHEMA = ?";
            // @ts-ignore
            bindings.push(this.schema);
        }
        // @ts-ignore
        this.pushQuery({
            sql: sql,
            bindings: bindings,
            output: function (resp) {
                return resp.rowCount > 0;
            },
        });
    };
    IBMiSchemaCompiler.prototype.toSQL = function () {
        // @ts-ignore
        var sequence = this.builder._sequence;
        for (var i = 0, l = sequence.length; i < l; i++) {
            var query = sequence[i];
            this[query.method].apply(this, query.args);
        }
        // @ts-ignore
        return this.sequence;
    };
    return IBMiSchemaCompiler;
}(compiler_1.default));
function prefixedTableName(prefix, table) {
    return prefix ? "".concat(prefix, ".").concat(table) : table;
}
exports.default = IBMiSchemaCompiler;
