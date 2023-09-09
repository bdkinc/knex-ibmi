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
var querycompiler_1 = require("knex/lib/query/querycompiler");
var isObject_1 = require("lodash/isObject");
var wrappingFormatter_1 = require("knex/lib/formatter/wrappingFormatter");
var date_fns_1 = require("date-fns");
var isEmpty_1 = require("lodash/isEmpty");
var console = require("console");
var IBMiQueryCompiler = /** @class */ (function (_super) {
    __extends(IBMiQueryCompiler, _super);
    function IBMiQueryCompiler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    IBMiQueryCompiler.prototype.insert = function () {
        // @ts-ignore
        var insertValues = this.single.insert || [];
        // we need to return a value
        // we need to wrap the insert statement in a select statement
        // we use the "IDENTITY_VAL_LOCAL()" function to return the IDENTITY
        // unless specified in a return
        // @ts-ignore
        var sql = "SELECT ".concat(
        // @ts-ignore
        this.single.returning
            ? // @ts-ignore
                this.formatter.columnize(this.single.returning)
            : "IDENTITY_VAL_LOCAL()", " FROM FINAL TABLE(");
        // @ts-ignore
        sql += this.with() + "insert into ".concat(this.tableName, " ");
        // @ts-ignore
        var returning = this.single.returning;
        var returningSql = returning
            ? // @ts-ignore
                this._returning("insert", returning) + " "
            : "";
        if (Array.isArray(insertValues)) {
            if (insertValues.length === 0) {
                return "";
            }
        }
        else if (typeof insertValues === "object" && (0, isEmpty_1.default)(insertValues)) {
            return {
                // @ts-ignore
                sql: sql + returningSql + this._emptyInsertValue,
                returning: returning,
            };
        }
        // @ts-ignore
        sql += this._buildInsertData(insertValues, returningSql);
        sql += ")";
        return {
            sql: sql,
            returning: returning,
        };
    };
    IBMiQueryCompiler.prototype._buildInsertData = function (insertValues, returningSql) {
        var sql = "";
        var insertData = this._prepInsert(insertValues);
        if (typeof insertData === "string") {
            sql += insertData;
        }
        else {
            if (insertData.columns.length) {
                // @ts-ignore
                sql += "(".concat(this.formatter.columnize(insertData.columns));
                sql +=
                    ") ".concat(returningSql, "values (") +
                        // @ts-ignore
                        this._buildInsertValues(insertData) +
                        ")";
            }
            else if (insertValues.length === 1 && insertValues[0]) {
                // @ts-ignore
                sql += returningSql + this._emptyInsertValue;
            }
            else {
                return "";
            }
        }
        return sql;
    };
    IBMiQueryCompiler.prototype._prepInsert = function (data) {
        if ((0, isObject_1.default)(data)) {
            if (data.hasOwnProperty("migration_time")) {
                var parsed = new Date(data.migration_time);
                data.migration_time = (0, date_fns_1.format)(parsed, "yyyy-MM-dd HH:mm:ss");
            }
        }
        var isRaw = (0, wrappingFormatter_1.rawOrFn)(data, undefined, 
        // @ts-ignore
        this.builder, 
        // @ts-ignore
        this.client, 
        // @ts-ignore
        this.bindingsHolder);
        if (isRaw)
            return isRaw;
        var columns = [];
        var values = [];
        if (!Array.isArray(data))
            data = data ? [data] : [];
        var i = -1;
        while (++i < data.length) {
            if (data[i] == null)
                break;
            if (i === 0)
                columns = Object.keys(data[i]).sort();
            var row = new Array(columns.length);
            var keys = Object.keys(data[i]);
            var j = -1;
            while (++j < keys.length) {
                var key = keys[j];
                var idx = columns.indexOf(key);
                if (idx === -1) {
                    columns = columns.concat(key).sort();
                    idx = columns.indexOf(key);
                    var k = -1;
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
            columns: columns,
            values: values,
        };
    };
    IBMiQueryCompiler.prototype.update = function () {
        var _this = this;
        // @ts-ignore
        var withSQL = this.with();
        // @ts-ignore
        var updates = this._prepUpdate(this.single.update);
        // @ts-ignore
        var where = this.where();
        // @ts-ignore
        var order = this.order();
        // @ts-ignore
        var limit = this.limit();
        // @ts-ignore
        var returning = this.single.returning;
        // @ts-ignore
        var values = Object.values(this.single.update)
            .map(function (a) { return "".concat(a); })
            .join(", ");
        // @ts-ignore
        console.log({
            returning: returning,
            // @ts-ignore
            where: where,
            // @ts-ignore
            updates: updates,
            // @ts-ignore
            single: this.single.update,
            // @ts-ignore
            grouped: this.grouped.where,
            values: values,
        });
        // @ts-ignore
        var moreWheres = 
        // @ts-ignore
        this.grouped.where && this.grouped.where.length > 0
            ? // @ts-ignore
                this.grouped.where.map(function (w) {
                    // @ts-ignore
                    if (_this.single.update.hasOwnProperty(w.column))
                        return;
                    if (!w.value)
                        return;
                    return "\"".concat(w.column, "\" ").concat(w.not ? "!" : "").concat(w.operator, " ").concat(w.value);
                })
            : [];
        var selectReturning = returning
            ? "select ".concat(returning.map(function (a) { return "\"".concat(a, "\""); }).join(", "), " from ").concat(
            // @ts-ignore
            this.tableName
            // @ts-ignore
            , " where ").concat(Object.entries(this.single.update)
                .map(function (_a) {
                var key = _a[0], value = _a[1];
                return "\"".concat(key, "\" = '").concat(value, "'");
            })
                .join(" and ")).concat(moreWheres.length > 0 && " and ").concat(moreWheres.join(" and "))
            : "";
        console.log({ selectReturning: selectReturning });
        var sql = withSQL +
            // @ts-ignore
            "update ".concat(this.single.only ? "only " : "").concat(this.tableName) +
            " set " +
            // @ts-ignore
            updates.join(", ") +
            (where ? " ".concat(where) : "") +
            (order ? " ".concat(order) : "") +
            (limit ? " ".concat(limit) : "");
        return { sql: sql, returning: returning, selectReturning: selectReturning };
    };
    IBMiQueryCompiler.prototype._returning = function (method, value, withTrigger) {
        // currently a placeholder in case I need to update return values
        console.log("_returning", value);
        switch (method) {
            case "update":
            case "insert":
                return value
                    ? // @ts-ignore
                        "".concat(withTrigger ? " into #out" : "")
                    : "";
            case "del":
                return value
                    ? // @ts-ignore
                        "".concat(withTrigger ? " into #out" : "")
                    : "";
            case "rowcount":
                return value ? "select @@rowcount" : "";
        }
    };
    IBMiQueryCompiler.prototype.columnizeWithPrefix = function (prefix, target) {
        var columns = typeof target === "string" ? [target] : target;
        var str = "", i = -1;
        while (++i < columns.length) {
            if (i > 0)
                str += ", ";
            // @ts-ignore
            str += prefix + this.wrap(columns[i]);
        }
        return str;
    };
    return IBMiQueryCompiler;
}(querycompiler_1.default));
exports.default = IBMiQueryCompiler;
