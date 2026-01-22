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
    private statementCaches;
    private normalizeBigintToString;
    constructor(config: Knex.Config<DB2Config>);
    private safeStringify;
    _driver(): typeof odbc;
    wrapIdentifierImpl(value: string): string;
    printDebug(message: string): void;
    printError(message: string): void;
    printWarn(message: string): void;
    acquireRawConnection(): Promise<any>;
    destroyRawConnection(connection: any): Promise<any>;
    validateConnection(connection: any): Promise<boolean>;
    _getConnectionString(connectionConfig: DB2ConnectionConfig): string;
    _query(connection: Connection, obj: any): Promise<any>;
    /**
     * Execute UPDATE with returning clause using UPDATE + SELECT approach.
     * Since IBM i DB2 doesn't support FINAL TABLE with UPDATE, we:
     * 1. Execute the UPDATE statement
     * 2. Execute a SELECT to get the updated values using the same WHERE clause
     *
     * @warning RACE CONDITION: In concurrent environments, rows may change between
     * the UPDATE and SELECT operations. If another transaction modifies, inserts,
     * or deletes rows matching the WHERE clause between these two statements,
     * the returned results may not accurately reflect what was updated.
     * For strict consistency requirements, consider:
     * - Using serializable transaction isolation level
     * - Implementing optimistic locking at the application level
     * - Avoiding `.returning()` on UPDATE and fetching data separately
     */
    private executeUpdateReturning;
    private executeSequentialInsert;
    private executeDeleteReturning;
    private normalizeQueryObject;
    private determineQueryMethod;
    private isSelectMethod;
    private executeSelectQuery;
    private executeStatementQuery;
    private isNoDataError;
    private shouldNormalizeBigintValues;
    private maybeNormalizeBigint;
    private normalizeBigintValue;
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
    /**
     * Extract SQLSTATE from ODBC error if available
     */
    private getSQLState;
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
    DSN?: string;
    SIGNON?: 0 | 1 | 2 | 3 | 4;
    SSL?: 0 | 1;
    CMT?: 0 | 1 | 2 | 3 | 4;
    CONNTYPE?: 0 | 1 | 2;
    DATABASE?: string;
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
    XMLDECLARATION?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
    DFTPKGLIB?: string;
    PKG?: string;
    XDYNAMIC?: 0 | 1;
    BLOCKFETCH?: 0 | 1;
    BLOCKSIZE?: number;
    COMPRESSION?: 0 | 1;
    CONCURRENCY?: 0 | 1;
    CURSORSENSITIVITY?: 0 | 1 | 2;
    EXTCOLINFO?: 0 | 1;
    LAZYCLOSE?: 0 | 1;
    MAXFIELDLEN?: number;
    PREFETCH?: 0 | 1;
    QRYSTGLMT?: number | "*NOMAX";
    QUERYOPTIMIZEGOAL?: 0 | 1 | 2;
    QUERYTIMEOUT?: 0 | 1;
    LANGUAGEID?: "AFR" | "ARA" | "BEL" | "BGR" | "CAT" | "CHS" | "CHT" | "CSY" | "DAN" | "DES" | "DEU" | "ELL" | "ENA" | "ENB" | "ENG" | "ENP" | "ENU" | "ESP" | "EST" | "FAR" | "FIN" | "FRA" | "FRB" | "FRC" | "FRS" | "GAE" | "HEB" | "HRV" | "HUN" | "ISL" | "ITA" | "ITS" | "JPN" | "KOR" | "LAO" | "LVA" | "LTU" | "MKD" | "NLB" | "NLD" | "NON" | "NOR" | "PLK" | "PTB" | "PTG" | "RMS" | "ROM" | "RUS" | "SKY" | "SLO" | "SQI" | "SRB" | "SRL" | "SVE" | "THA" | "TRK" | "UKR" | "URD" | "VIE";
    SORTTABLE?: string;
    SORTTYPE?: 0 | 1 | 2 | 3;
    SORTWEIGHT?: 0 | 1;
    CATALOGOPTIONS?: number;
    LIBVIEW?: 0 | 1 | 2;
    REMARKS?: 0 | 1;
    SEARCHPATTERN?: 0 | 1;
    ALLOWUNSCHAR?: 0 | 1;
    CCSID?: number;
    GRAPHIC?: 0 | 1 | 2 | 3;
    HEXPARSEROPT?: 0 | 1;
    TRANSLATE?: 0 | 1;
    TRIMCHAR?: 0 | 1;
    UNICODESQL?: 0 | 1;
    XLATEDLL?: string;
    XLATEOPT?: number;
    QAQQINILIB?: string;
    SQDIAGCODE?: string;
    TRACE?: number;
    ALWAYSCALCLEN?: 0 | 1;
    ALLOWPROCCALLS?: 0 | 1;
    CONCURRENTACCESSRESOLUTION?: 0 | 1 | 2 | 3;
    DB2SQLSTATES?: 0 | 1;
    DATETIMETOCHAR?: number;
    DBCSNoTruncError?: 0 | 1;
    DEBUG?: number;
    KEEPALIVE?: 0 | 1 | 2;
    LOGINTIMEOUT?: number;
    TIMEOUT?: number;
    TRUEAUTOCOMMIT?: 0 | 1;
    NEWPWD?: string;
    XALCS?: 0 | 1;
    XALOCKTIMEOUT?: number;
    XATXNTIMEOUT?: number;
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
    ibmi?: {
        multiRowInsert?: "auto" | "sequential" | "disabled";
        sequentialInsertTransactional?: boolean;
        preparedStatementCache?: boolean;
        preparedStatementCacheSize?: number;
        readUncommitted?: boolean;
        normalizeBigintToString?: boolean;
    };
}
declare const DB2Dialect: typeof DB2Client;

export { type DB2Config, DB2Dialect, IBMiMigrationRunner, createIBMiMigrationRunner, DB2Client as default };
