import QueryCompiler from "knex/lib/query/querycompiler";
declare class IBMiQueryCompiler extends QueryCompiler {
    insert(): "" | {
        sql: string;
        returning: any;
    };
    _buildInsertData(insertValues: any, returningSql: any): string;
    _prepInsert(data: any): any;
    update(): {
        sql: string;
        returning: any;
        selectReturning: string;
    };
    _returning(method: any, value: any, withTrigger: any): string | undefined;
    columnizeWithPrefix(prefix: any, target: any): string;
}
export default IBMiQueryCompiler;
