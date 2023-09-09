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
var columncompiler_1 = require("knex/lib/schema/columncompiler");
var IBMiColumnCompiler = /** @class */ (function (_super) {
    __extends(IBMiColumnCompiler, _super);
    function IBMiColumnCompiler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    IBMiColumnCompiler.prototype.increments = function (options) {
        if (options === void 0) { options = { primaryKey: true }; }
        return ("int not null generated always as identity (start with 1, increment by 1)" +
            // @ts-ignore
            (this.tableCompiler._canBeAddPrimaryKey(options) ? " primary key" : ""));
    };
    return IBMiColumnCompiler;
}(columncompiler_1.default));
exports.default = IBMiColumnCompiler;
