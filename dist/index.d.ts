import { Connection } from "odbc";
import { knex, Knex } from "knex";
import * as odbc from "odbc";
import SchemaCompiler from "./schema/ibmi-compiler";
import TableCompiler from "./schema/ibmi-tablecompiler";
import ColumnCompiler from "./schema/ibmi-columncompiler";
import QueryCompiler from "./query/ibmi-querycompiler";
declare class DB2Client extends knex.Client {
    constructor(config: any);
    _driver(): typeof odbc;
    printDebug(message: string): void;
    acquireRawConnection(): Promise<any>;
    destroyRawConnection(connection: Connection): Promise<void>;
    _getConnectionString(connectionConfig: any): string;
    _query(connection: any, obj: any): Promise<any>;
    transaction(container: any, config: any, outerTx: any): Knex.Transaction;
    schemaCompiler(): SchemaCompiler;
    tableCompiler(): TableCompiler;
    columnCompiler(): ColumnCompiler;
    queryCompiler(): QueryCompiler;
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
export interface DB2Config {
    client: any;
    connection: DB2ConnectionConfig;
    pool?: DB2PoolConfig;
}
export declare const DB2Dialect: typeof DB2Client;
export default DB2Client;
