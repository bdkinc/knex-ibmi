import knex, { Knex } from 'knex';
import odbc, { Connection } from 'odbc';

interface IBMiMigrationConfig {
    directory: string;
    tableName: string;
    schemaName?: string;
    extension?: string;
}
declare class IBMiMigrationRunner {
    private knex;
    private config;
    constructor(knex: Knex, config?: Partial<IBMiMigrationConfig>);
    private getFullTableName;
    latest(): Promise<void>;
    rollback(steps?: number): Promise<void>;
    currentVersion(): Promise<string | null>;
    listExecuted(): Promise<string[]>;
    listPending(): Promise<string[]>;
    private getMigrationFiles;
    private getMigrationPath;
}
declare function createIBMiMigrationRunner(knex: Knex, config?: Partial<IBMiMigrationConfig>): IBMiMigrationRunner;

interface QueryObject {
    response?: {
        rows: any[];
        rowCount: number;
    };
    sqlMethod: SqlMethod;
    output?: (runner: any, response: any) => any;
    pluck?: (row: any) => any;
    select?: boolean;
}
declare enum SqlMethod {
    SELECT = "select",
    PLUCK = "pluck",
    FIRST = "first",
    INSERT = "insert",
    DELETE = "del",
    DELETE_ALT = "delete",
    UPDATE = "update",
    COUNTER = "counter"
}
declare class DB2Client extends knex.Client {
    constructor(config: Knex.Config<DB2Config>);
    private safeStringify;
    _driver(): typeof odbc;
    wrapIdentifierImpl(value: string): string;
    printDebug(message: string): void;
    printError(message: string): void;
    printWarn(message: string): void;
    acquireRawConnection(): Promise<void | odbc.Connection>;
    destroyRawConnection(connection: any): Promise<any>;
    _getConnectionString(connectionConfig: DB2ConnectionConfig): string;
    _query(connection: Connection, obj: any): Promise<any>;
    private normalizeQueryObject;
    private determineQueryMethod;
    private isSelectMethod;
    private executeSelectQuery;
    private executeStatementQuery;
    private isNoDataError;
    /**
     * Format statement response from ODBC driver
     * Handles special case for IDENTITY_VAL_LOCAL() function
     */
    private formatStatementResponse;
    _stream(connection: Connection, obj: {
        sql: string;
        bindings: any[];
    }, stream: any, options: {
        fetchSize?: number;
    }): Promise<unknown>;
    private calculateOptimalFetchSize;
    private _createCursorStream;
    transaction(container: any, config: any, outerTx: any): Knex.Transaction;
    schemaCompiler(tableBuilder: any): any;
    tableCompiler(tableBuilder: any): any;
    columnCompiler(tableCompiler: any, columnCompiler: any): any;
    queryCompiler(builder: Knex.QueryBuilder, bindings?: any[]): any;
    createMigrationRunner(config?: Partial<IBMiMigrationConfig>): IBMiMigrationRunner;
    processResponse(obj: QueryObject | null, runner: any): any;
    private validateResponse;
    private wrapError;
    private shouldRetryQuery;
    private retryQuery;
    private isConnectionError;
    private isTimeoutError;
    private isSQLError;
    private processSqlMethod;
}
interface DB2PoolConfig {
    min?: number;
    max?: number;
    acquireConnectionTimeout?: number;
}
interface DB2ConnectionParams {
    CMT?: number;
    CONNTYPE?: number;
    DBQ?: string;
    MAXDECPREC?: 31 | 63;
    MAXDECSCALE?: number;
    MINDIVSCALE?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
    NAM?: 0 | 1;
    DFT?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
    DSP?: 0 | 1 | 2 | 3 | 4;
    DEC?: 0 | 1;
    DECFLOATERROROPTION?: 0 | 1;
    DECFLOATROUNDMODE?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    MAPDECIMALFLOATDESCRIBE?: 1 | 3;
    TFT?: 0 | 1 | 2 | 3 | 4;
    TSP?: 0 | 1 | 2 | 3;
    TSFT?: 0 | 1;
    XMLCURIMPPARSE?: 0 | 1;
    XMLDECLARATION?: 1 | 2 | 3 | 4;
    ALLOWPROCCALLS?: 0 | 1;
    XDYNAMIC?: 0 | 1;
    DFTPKGLIB?: string;
    PKG?: 0 | 1 | 2;
    BLOCKFETCH?: 0 | 1;
    COMPRESSION?: 0 | 1;
    CONCURRENCY?: 0 | 1;
    CURSORSENSITIVITY?: 0 | 1 | 2;
    EXTCOLINFO?: "SQL_DESC_AUTO_UNIQUE_VALUE" | "SQL_DESC_BASE_COLUMN_NAME" | "SQL_DESC_BASE_TABLE_NAME and SQL_DESC_TABLE_NAME" | "SQL_DESC_LABEL" | "SQL_DESC_SCHEMA_NAME" | "SQL_DESC_SEARCHABLE" | "SQL_DESC_UNNAMED" | "SQL_DESC_UPDATABLE";
    TRUEAUTOCOMMIT?: 0 | 1;
}
interface DB2ConnectionConfig {
    database: string;
    host: string;
    port: 8471 | 9471 | number;
    user: string;
    password: string;
    driver: "IBM i Access ODBC Driver" | string;
    connectionStringParams?: DB2ConnectionParams;
}
interface DB2Config extends Knex.Config {
    client: any;
    connection: DB2ConnectionConfig;
    pool?: DB2PoolConfig;
}
declare const DB2Dialect: typeof DB2Client;

export { type DB2Config, DB2Dialect, IBMiMigrationRunner, createIBMiMigrationRunner, DB2Client as default };
