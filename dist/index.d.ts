import { knex, Knex } from 'knex';
import odbc, { Connection } from 'odbc';
import SchemaCompiler from 'knex/lib/schema/compiler';
import TableCompiler from 'knex/lib/schema/tablecompiler';
import ColumnCompiler from 'knex/lib/schema/columncompiler';
import QueryCompiler from 'knex/lib/query/querycompiler';

declare class IBMiSchemaCompiler extends SchemaCompiler {
    hasTable(tableName: any): void;
    toSQL(): any[];
}

declare class IBMiTableCompiler extends TableCompiler {
    createQuery(columns: {
        sql: any[];
    }, ifNot: any, like: any): void;
    dropUnique(columns: string[], indexName: any): void;
    unique(columns: string[], indexName: {
        indexName: any;
        deferrable: any;
        predicate: any;
    }): void;
    addColumns(columns: any, prefix: any): void;
    commit(connection: Connection): Promise<void>;
}

declare class IBMiColumnCompiler extends ColumnCompiler {
    increments(options?: {
        primaryKey: boolean;
    }): string;
}

declare class IBMiQueryCompiler extends QueryCompiler {
    insert(): "" | {
        sql: string;
        returning: any;
    };
    _buildInsertData(insertValues: string | any[], returningSql: string): string;
    _prepInsert(data: any): {
        columns: any;
        values: any;
    };
    update(): {
        sql: string;
        returning: any;
    };
    _returning(method: string, value: any, withTrigger: undefined): string | undefined;
    columnizeWithPrefix(prefix: string, target: any): string;
}

declare class DB2Client extends knex.Client {
    constructor(config: Knex.Config<DB2Config>);
    _driver(): typeof odbc;
    wrapIdentifierImpl(value: any): any;
    printDebug(message: string): void;
    printError(message: string): void;
    printWarn(message: string): void;
    acquireRawConnection(): Promise<any>;
    destroyRawConnection(connection: any): Promise<any>;
    _getConnectionString(connectionConfig: DB2ConnectionConfig): string;
    _query(connection: any, obj: any): Promise<any>;
    _stream(connection: any, obj: any, stream: any, options: {
        fetchSize?: number;
        initialBufferSize?: number;
    }): Promise<unknown>;
    transaction(container: any, config: any, outerTx: any): Knex.Transaction;
    schemaCompiler(tableBuilder: any): IBMiSchemaCompiler;
    tableCompiler(tableBuilder: any): IBMiTableCompiler;
    columnCompiler(tableCompiler: any, columnCompiler: any): IBMiColumnCompiler;
    queryCompiler(builder: Knex.QueryBuilder, bindings?: any[]): IBMiQueryCompiler;
    processResponse(obj: any, runner: any): any;
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
    ALLOWPROCCALLS?: 0 | 1;
    XDYNAMIC?: 0 | 1;
}
interface DB2ConnectionConfig {
    database: string;
    host: string;
    port: 50000 | number;
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

export { type DB2Config, DB2Dialect, DB2Client as default };
