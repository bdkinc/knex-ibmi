"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
const transaction_1 = require("knex/lib/execution/transaction");
class IBMiTransaction extends transaction_1.default {
    async begin(connection) {
        await connection.beginTransaction();
        return connection;
    }
    async rollback(connection) {
        await connection.rollback();
        return connection;
    }
    async commit(connection) {
        await connection.commit();
        return connection;
    }
}
exports.default = IBMiTransaction;
//# sourceMappingURL=ibmi-transaction.js.map