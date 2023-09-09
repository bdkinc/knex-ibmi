import SchemaCompiler from "knex/lib/schema/compiler";
declare class IBMiSchemaCompiler extends SchemaCompiler {
    hasTable(tableName: any): void;
    toSQL(): any;
}
export default IBMiSchemaCompiler;
