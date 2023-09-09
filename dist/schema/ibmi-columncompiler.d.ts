import ColumnCompiler from "knex/lib/schema/columncompiler";
declare class IBMiColumnCompiler extends ColumnCompiler {
    increments(options?: {
        primaryKey: boolean;
    }): string;
}
export default IBMiColumnCompiler;
