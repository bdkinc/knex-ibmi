import * as odbc from 'odbc';
import { Connection } from 'odbc';
import { knex, Knex } from 'knex';
import SchemaCompiler from 'knex/lib/schema/compiler';
import TableCompiler from 'knex/lib/schema/tablecompiler';
import ColumnCompiler from 'knex/lib/schema/columncompiler';
import QueryCompiler from 'knex/lib/query/querycompiler';

declare class IBMiSchemaCompiler extends SchemaCompiler {
    hasTable(tableName: any): void;
    toSQL(): any;
}

declare class IBMiTableCompiler extends TableCompiler {
    createQuery(columns: any, ifNot: any, like: any): void;
    dropUnique(columns: any, indexName: any): void;
    unique(columns: any, indexName: any): void;
    addColumns(columns: any, prefix: any): void;
    commit(conn: any, value: any): Promise<any>;
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
    _buildInsertData(insertValues: any, returningSql: any): string;
    _prepInsert(data: any): any;
    _returning(method: any, value: any, withTrigger: any): string | undefined;
    columnizeWithPrefix(prefix: any, target: any): string;
}

declare class DB2Client extends knex.Client {
    constructor(config: any);
    _driver(): typeof odbc;
    printDebug(message: string): void;
    acquireRawConnection(): Promise<any>;
    destroyRawConnection(connection: Connection): Promise<void>;
    _getConnectionString(connectionConfig: any): string;
    _query(connection: any, obj: any): Promise<any>;
    _selectAfterUpdate(): string;
    transaction(container: any, config: any, outerTx: any): Knex.Transaction;
    schemaCompiler(): IBMiSchemaCompiler;
    tableCompiler(): IBMiTableCompiler;
    columnCompiler(): IBMiColumnCompiler;
    queryCompiler(): IBMiQueryCompiler;
    processResponse(obj: any, runner: any): any;
}
interface DB2PoolConfig {
    min: number;
    max: number;
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
}
interface DB2ConnectionConfig {
    database: string;
    host: string;
    port: 50000 | number;
    user: string;
    password: string;
    driver: "IBM i Access ODBC Driver" | string;
    connectionStringParams?: DB2ConnectionParams;
    pool?: DB2PoolConfig;
}
interface DB2Config {
    client: any;
    connection: DB2ConnectionConfig;
    pool?: DB2PoolConfig;
}
declare const DB2Dialect: typeof DB2Client;

export { DB2Config, DB2Dialect, DB2Client as default };
