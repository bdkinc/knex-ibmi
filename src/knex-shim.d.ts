// ---------------------------------------------------------------------------------------------------------------------
// Extending Knex Types
// ---------------------------------------------------------------------------------------------------------------------

declare module 'knex/lib/execution/transaction'
{
    import { EventEmitter } from 'node:events';
    import { Knex } from 'knex';

    interface Transaction extends Knex.Transaction {}
    class Transaction extends EventEmitter
    {
        constructor(client : Knex.Client, container : any, config : any, outerTx : any);
    }

    export default Transaction;
}

declare module 'knex/lib/query/querycompiler'
{
    import { Knex } from 'knex';

    class QueryCompiler
    {
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

        constructor(client : Knex.Client, builder ?: Knex.QueryBuilder, bindings ?: any);
        toSQL(method, tz): {
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
        select() : string;
        insert() : string | { sql : string; returning ?: any };
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
        wrap(str : string) : string;

        // Internal methods
        _buildInsertValues(insertData : any[]) : string;
        _prepUpdate(data : any) : any;
    }

    export default QueryCompiler;
}

// ---------------------------------------------------------------------------------------------------------------------
