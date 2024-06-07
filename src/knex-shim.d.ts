declare module "knex/lib/execution/transaction" {
  import { EventEmitter } from "node:events";
  import { Knex } from "knex";

  // eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
  interface Transaction extends Knex.Transaction {}
  // eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
  class Transaction extends EventEmitter {
    constructor(client: Knex.Client, container: any, config: any, outerTx: any);
  }

  export default Transaction;
}

declare module "knex/lib/query/querycompiler" {
  // eslint-disable-next-line no-duplicate-imports
  import { Knex } from "knex";

  class QueryCompiler {
    client: Knex.Client;
    method: string;
    options: any;
    single: any;
    queryComments: any[];
    timeout: boolean;
    cancelOnTimeout: boolean;
    grouped: any;
    formatter: any;
    _emptyInsertValue: string;
    first: () => any;
    bindings: any[];
    bindingsHolder: this;
    builder: any;
    tableName: string;

    constructor(
      client: Knex.Client,
      builder: Knex.QueryBuilder,
      bindings?: any,
    );
    toSQL(
      method,
      tz,
    ): {
      method: string;
      options: any;
      timeout: boolean;
      cancelOnTimeout: boolean;
      bindings: any[];
      __knexQueryUid: string;
      toNative: () => { sql: string; bindings: any[] };
      sql?: string;
      as?: string;
    };

    select(): string;
    insert(): string | { sql: string; returning?: any };
    with(): string;
    comments(): string;
    columns(): string;
    join(): string;
    where(): string;
    union(): string;
    group(): string;
    having(): string;
    order(): string;
    limit(): string;
    offset(): string;
    lock(): string;
    waitMode(): string;
    wrap(str: string): string;

    // Internal methods
    _buildInsertValues(insertData: any): string;
    _prepUpdate(data: any): any;
  }

  export default QueryCompiler;
}

declare module "knex/lib/schema/tablecompiler" {
  // Eslint gets dumb about this
  // eslint-disable-next-line no-duplicate-imports
  import { Knex } from "knex";

  class TableCompiler {
    constructor(client: Knex.Client, tableBuilder?: Knex.TableBuilder);

    client: Knex.Client;
    tableBuilder: Knex.TableBuilder;
    _commonBuilder: Knex.TableBuilder;
    method: string;
    schemaNameRaw: string;
    tableNameRaw: string;
    tableNameLikeRaw: string;
    single: any;
    grouped: any;
    formatter: any;
    bindings: any[];
    bindingsHolder: this;
    sequence: any[];
    _formatting: boolean;
    checksCount: number;

    toSQL(): any[];
    create(ifNot: boolean, like: boolean): void;
    createIfNot(): void;
    createLike(): void;
    createLikeIfNot(): void;
    alter(): void;
    foreign(foreignData: any): void;
    getColumnTypes(columns: any[]): any;
    columnQueries(columns: any[]): void;
    addColumns(columns: any[], prefix?: string): void;
    alterColumns(columns: any[], colBuilders: any[]): void;
    getColumns(method?: string): any[];
    tableName(): string;
    tableNameLike(): string;
    alterTable(): void;
    alterTableForCreate(columnTypes: any): void;
    dropIndex(value: string): void;
    dropUnique(columns: string | string[], indexName: string): void;
    dropForeign(): void;
    dropColumn(): void;
    _setNullableState(column: string, nullable: boolean): void;
    setNullable(column: string): void;
    dropNullable(column: string): void;
    dropChecks(checkConstraintNames: string[]): void;
    check(
      checkPredicate: string,
      bindings: any[],
      constraintName: string,
    ): void;
    _addChecks(): string;
    _indexCommand(type: string, tableName: string, columns: string[]): string;
    _getPrimaryKeys(): any[];
    _canBeAddPrimaryKey(options: any): boolean;
    _getIncrementsColumnNames(): any[];
    _getBigIncrementsColumnNames(): any[];

    pushQuery(query: string | { sql: string; bindings: any }): void;
    pushAdditional(fn: any): void;
    unshiftQuery(query: string | { sql: string; bindings: any }): void;

    lowerCase: boolean;
    createAlterTableMethods: any;
    addColumnsPrefix: string;
    alterColumnsPrefix: string;
    modifyColumnPrefix: string;
    dropColumnPrefix: string;

    comment(val: any): void;
  }

  export default TableCompiler;
}

declare module "knex/lib/schema/columncompiler" {
  // Eslint gets dumb about this
  // eslint-disable-next-line no-duplicate-imports
  import { Knex } from "knex";
  import TableCompiler from "knex/lib/schema/tablecompiler";

  class ColumnCompiler {
    constructor(
      client: Knex.Client,
      tableCompiler?: TableCompiler,
      columnBuilder?: Knex.ColumnBuilder,
    );

    client: Knex.Client;
    tableCompiler: TableCompiler;
    columnBuilder: Knex.ColumnBuilder;
    _commonBuilder: Knex.ColumnBuilder;
    args: any[];
    type: string;
    grouped: any;
    modified: any;
    isIncrements: boolean;
    formatter: any;
    bindings: any[];
    bindingsHolder: this;
    sequence: any[];
    modifiers: string[];
    checksCount: number;
    _columnType: string;

    _addCheckModifiers(): void;
    defaults(label: string): any;
    toSQL(): any[];
    compileColumn(): string;
    getColumnName(): string;
    getColumnType(): string;
    getModifiers(): string;

    varchar(length: number): string;
    floating(precision: number, scale: number): string;
    decimal(precision: number, scale: number): string;
    specifictype(type: string): string;

    nullable(nullable: boolean): string;
    notNullable(): string;
    defaultTo(value: any): string;
    increments(options?: { primaryKey: boolean }): string;
    bigincrements(options?: { primaryKey: boolean }): string;

    _pushAlterCheckQuery(checkPredicate: string, constraintName: string): void;
    _checkConstraintName(constraintName: string): string;
    _check(checkPredicate: string, constraintName: string): string;
    checkPositive(constraintName: string): string;
    checkNegative(constraintName: string): string;
    _checkIn(values: any[], constraintName: string, not?: boolean): string;
    checkIn(values: any[], constraintName: string): string;
    checkNotIn(values: any[], constraintName: string): string;
    checkBetween(intervals: any[], constraintName: string): string;
    checkLength(
      operator: string,
      length: number,
      constraintName: string,
    ): string;
  }

  export default ColumnCompiler;
}

declare module "knex/lib/schema/compiler" {
  // Eslint gets dumb about this
  // eslint-disable-next-line no-duplicate-imports
  import { Knex } from "knex";

  class SchemaCompiler {
    constructor(client: Knex.Client, builder?: Knex.TableBuilder);

    client: Knex.Client;
    builder: Knex.TableBuilder;
    _commonBuilder: Knex.TableBuilder;
    schema: any;
    bindings: any[];
    bindingsHolder: this;
    formatter: any;
    sequence: any[];
    dropTablePrefix: string;
    dropViewPrefix: string;
    dropMaterializedViewPrefix: string;
    alterViewPrefix: string;

    createSchema(): void;
    createSchemaIfNotExists(): void;
    dropSchema(): void;
    dropSchemaIfExists(): void;
    dropTable(tableName: string): void;
    dropTableIfExists(tableName: string): void;
    dropView(viewName: string): void;
    dropViewIfExists(viewName: string): void;
    dropMaterializedView(viewName: string): void;
    dropMaterializedViewIfExists(viewName: string): void;
    renameView(from: string, to: string): void;
    refreshMaterializedView(): void;
    _dropView(viewName: string, ifExists: boolean, materialized: boolean): void;
    raw(sql: string, bindings: any[]): void;
    toSQL(): any[];
    generateDdlCommands(): Promise<any>;
    alterTable(): any;
    createTable(): any;
    createTableIfNotExists(): any;
    createTableLike(): any;
    createView(): any;
    createViewOrReplace(): any;
    createMaterializedView(): any;
    alterView(): any;
    pushQuery(): void;
    pushAdditional(): void;
    unshiftQuery(): void;

    pushQuery(
      query: string | { sql: string; bindings: any; output: any },
    ): void;
    pushAdditional(fn: any): void;
    unshiftQuery(query: string | { sql: string; bindings: any }): void;
  }

  export default SchemaCompiler;
}
