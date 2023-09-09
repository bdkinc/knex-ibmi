import TableCompiler from "knex/lib/schema/tablecompiler";
declare class IBMiTableCompiler extends TableCompiler {
    createQuery(columns: any, ifNot: any, like: any): void;
    dropUnique(columns: any, indexName: any): void;
    unique(columns: any, indexName: any): void;
    addColumns(columns: any, prefix: any): void;
    commit(conn: any): Promise<any>;
}
export default IBMiTableCompiler;
