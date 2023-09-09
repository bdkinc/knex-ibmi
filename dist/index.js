"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DB2Dialect = void 0;
const process = require("process");
const knex_1 = require("knex");
const odbc = require("odbc");
const console = require("console");
const ibmi_compiler_1 = require("./schema/ibmi-compiler");
const ibmi_tablecompiler_1 = require("./schema/ibmi-tablecompiler");
const ibmi_columncompiler_1 = require("./schema/ibmi-columncompiler");
const ibmi_transaction_1 = require("./execution/ibmi-transaction");
const ibmi_querycompiler_1 = require("./query/ibmi-querycompiler");
class DB2Client extends knex_1.knex.Client {
    constructor(config) {
        super(config);
        this.driverName = "odbc";
        if (this.dialect && !this.config.client) {
            // @ts-ignore
            this.logger.warn(`Using 'this.dialect' to identify the client is deprecated and support for it will be removed in the future. Please use configuration option 'client' instead.`);
        }
        const dbClient = this.config.client || this.dialect;
        if (!dbClient) {
            throw new Error(`knex: Required configuration option 'client' is missing.`);
        }
        if (config.version) {
            this.version = config.version;
        }
        if (this.driverName && config.connection) {
            this.initializeDriver();
            if (!config.pool || (config.pool && config.pool.max !== 0)) {
                this.initializePool(config);
            }
        }
        this.valueForUndefined = this.raw("DEFAULT");
        if (config.useNullAsDefault) {
            this.valueForUndefined = null;
        }
    }
    _driver() {
        return odbc;
    }
    printDebug(message) {
        if (process.env.DEBUG === "true") {
            // @ts-ignore
            this.logger.debug(message);
        }
    }
    // Get a raw connection, called by the pool manager whenever a new
    // connection needs to be added to the pool.
    async acquireRawConnection() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        this.printDebug("acquiring raw connection");
        const connectionConfig = this.config.connection;
        console.log(this._getConnectionString(connectionConfig));
        // @ts-ignore
        if ((_b = (_a = this.config) === null || _a === void 0 ? void 0 : _a.connection) === null || _b === void 0 ? void 0 : _b.pool) {
            const poolConfig = {
                connectionString: this._getConnectionString(connectionConfig),
                connectionTimeout: 
                // @ts-ignore
                ((_d = (_c = this.config) === null || _c === void 0 ? void 0 : _c.connection) === null || _d === void 0 ? void 0 : _d.acquireConnectionTimeout) || 60000,
                // @ts-ignore
                initialSize: ((_g = (_f = (_e = this.config) === null || _e === void 0 ? void 0 : _e.connection) === null || _f === void 0 ? void 0 : _f.pool) === null || _g === void 0 ? void 0 : _g.min) || 2,
                // @ts-ignore
                maxSize: ((_k = (_j = (_h = this.config) === null || _h === void 0 ? void 0 : _h.connection) === null || _j === void 0 ? void 0 : _j.pool) === null || _k === void 0 ? void 0 : _k.max) || 10,
                reuseConnection: true,
            };
            const pool = await this.driver.pool(poolConfig);
            return await pool.connect();
        }
        return await this.driver.connect(this._getConnectionString(connectionConfig));
    }
    // Used to explicitly close a connection, called internally by the pool manager
    // when a connection times out or the pool is shutdown.
    async destroyRawConnection(connection) {
        console.log("destroy connection");
        return await connection.close();
    }
    _getConnectionString(connectionConfig) {
        const connectionStringParams = connectionConfig.connectionStringParams || {};
        const connectionStringExtension = Object.keys(connectionStringParams).reduce((result, key) => {
            const value = connectionStringParams[key];
            return `${result}${key}=${value};`;
        }, "");
        return `${`DRIVER=${connectionConfig.driver};SYSTEM=${connectionConfig.host};HOSTNAME=${connectionConfig.host};` +
            `PORT=${connectionConfig.port};DATABASE=${connectionConfig.database};` +
            `UID=${connectionConfig.user};PWD=${connectionConfig.password};`}${connectionStringExtension}`;
    }
    // Runs the query on the specified connection, providing the bindings
    // and any other necessary prep work.
    async _query(connection, obj) {
        if (!obj || typeof obj == "string")
            obj = { sql: obj };
        const method = (obj.hasOwnProperty("method") && obj.method !== "raw"
            ? obj.method
            : obj.sql.split(" ")[0]).toLowerCase();
        obj.sqlMethod = method;
        // Different functions are used since query() doesn't return # of rows affected,
        // which is needed for queries that modify the database
        if (method === "select" || method === "first" || method === "pluck") {
            const rows = await connection.query(obj.sql, obj.bindings);
            if (rows) {
                obj.response = { rows, rowCount: rows.length };
            }
        }
        else {
            await connection.beginTransaction();
            console.log("transaction begun");
            try {
                const statement = await connection.createStatement();
                await statement.prepare(obj.sql);
                if (obj.bindings) {
                    await statement.bind(obj.bindings);
                }
                const result = await statement.execute();
                // this is hacky we check the SQL for the ID column
                // most dialects return the ID of the inserted
                // we check for the IDENTITY scalar function
                // if that function is present, then we just return the value of the
                // IDENTITY column
                if (result.statement.includes("IDENTITY_VAL_LOCAL()")) {
                    obj.response = {
                        rows: result.map((row) => {
                            var _a;
                            return result.columns && ((_a = result.columns) === null || _a === void 0 ? void 0 : _a.length) > 0
                                ? row[result.columns[0].name]
                                : row;
                        }),
                        rowCount: result.count,
                    };
                }
                else if (method === "update") {
                    if (obj.selectReturning) {
                        const returningSelect = await connection.query(obj.selectReturning);
                        obj.response = {
                            rows: returningSelect,
                            rowCount: result.count,
                        };
                    }
                    else {
                        obj.response = {
                            rows: result,
                            rowCount: result.count,
                        };
                    }
                }
                else {
                    obj.response = { rows: result, rowCount: result.count };
                }
            }
            catch (err) {
                console.error(err);
                await connection.rollback();
                throw new Error(err);
            }
            finally {
                console.log("transaction committed");
                await connection.commit();
            }
        }
        console.log({ obj });
        return obj;
    }
    transaction(container, config, outerTx) {
        // @ts-ignore
        return new ibmi_transaction_1.default(this, ...arguments);
    }
    schemaCompiler() {
        // @ts-ignore
        return new ibmi_compiler_1.default(this, ...arguments);
    }
    tableCompiler() {
        // @ts-ignore
        return new ibmi_tablecompiler_1.default(this, ...arguments);
    }
    columnCompiler() {
        // @ts-ignore
        return new ibmi_columncompiler_1.default(this, ...arguments);
    }
    queryCompiler() {
        // @ts-ignore
        return new ibmi_querycompiler_1.default(this, ...arguments);
    }
    processResponse(obj, runner) {
        if (obj === null)
            return null;
        const resp = obj.response;
        const method = obj.sqlMethod;
        const { rows, rowCount } = resp;
        if (obj.output)
            return obj.output.call(runner, resp);
        switch (method) {
            case "select":
                return rows;
            case "pluck":
                return rows.map(obj.pluck);
            case "first":
                return rows[0];
            case "insert":
                return rows;
            case "del":
            case "delete":
            case "update":
                if (obj.selectReturning) {
                    return rows;
                }
                return rowCount;
            case "counter":
                return rowCount;
            default:
                return rows;
        }
    }
}
exports.DB2Dialect = DB2Client;
exports.default = DB2Client;
//# sourceMappingURL=index.js.map