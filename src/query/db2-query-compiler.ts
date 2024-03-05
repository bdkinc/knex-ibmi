//----------------------------------------------------------------------------------------------------------------------
// DB2 Query Compiler
//----------------------------------------------------------------------------------------------------------------------

import QueryCompiler from 'knex/lib/query/querycompiler';
import isObject from 'lodash/isObject';
import { rawOrFn as rawOrFn_ } from 'knex/lib/formatter/wrappingFormatter';
import { format } from 'date-fns';
import isEmpty from 'lodash/isEmpty';

//----------------------------------------------------------------------------------------------------------------------

class DB2QueryCompiler extends QueryCompiler
{
    insert() : string | { sql : string; returning ?: any }
    {
        const insertValues = this.single.insert || [];
        // we need to return a value
        // we need to wrap the insert statement in a select statement
        // we use the "IDENTITY_VAL_LOCAL()" function to return the IDENTITY
        // unless specified in a return
        let sql = `select ${
            this.single.returning
                ? this.formatter.columnize(this.single.returning)
                : 'IDENTITY_VAL_LOCAL()'
        }
                   from FINAL TABLE(`;
        sql += `${ this.with() }
        insert
        into
        ${ this.tableName } `;
        const { returning } = this.single;
        const returningSql = returning ? `${ this._returning('insert', returning) } ` : '';

        if(Array.isArray(insertValues))
        {
            if(insertValues.length === 0)
            {
                return '';
            }
        }
        else if(typeof insertValues === 'object' && isEmpty(insertValues))
        {
            return {
                sql: sql + returningSql + this._emptyInsertValue,
                returning,
            };
        }

        sql += this._buildInsertData(insertValues, returningSql);
        sql += ')';

        return {
            sql,
            returning,
        };
    }

    _buildInsertData(insertValues, returningSql) : string
    {
        let sql = '';
        const insertData = this._prepInsert(insertValues);
        if(typeof insertData === 'string')
        {
            sql += insertData;
        }
        else if(insertData.columns.length)
        {
            sql += `(${ this.formatter.columnize(insertData.columns) }`;
            sql
                += `) ${ returningSql }values (${
                    this._buildInsertValues(insertData)
                })`;
        }
        else if(insertValues.length === 1 && insertValues[0])
        {
            sql += returningSql + this._emptyInsertValue;
        }
        else
        {
            return '';
        }
        return sql;
    }

    _prepInsert(data) : { columns : any[]; values : any[] }
    {
        if(isObject(data))
        {
            if(Object.hasOwn(data, 'migration_time'))
            {
                // @ts-expect-error - Typescript is being really dumb here
                const parsed = new Date(data.migration_time);

                // @ts-expect-error - Typescript is being really dumb here
                data.migration_time = format(parsed, 'yyyy-MM-dd HH:mm:ss');
            }
        }

        const isRaw = rawOrFn_(
            data,
            undefined,
            this.builder,
            this.client,
            this.bindingsHolder
        );
        if(isRaw)
        {
            return isRaw;
        }
        let columns : any[] = [];
        const values : any[] = [];
        if(!Array.isArray(data))
        {
            data = data ? [ data ] : [];
        }
        let idx = -1;
        while(++idx < data.length)
        {
            if(data[idx] == null)
            {
                break;
            }
            if(idx === 0)
            {
                columns = Object.keys(data[idx]).sort();
            }
            const row = new Array(columns.length);
            const keys = Object.keys(data[idx]);
            let jdx = -1;
            while(++jdx < keys.length)
            {
                const key = keys[jdx];
                let idx = columns.indexOf(key);
                if(idx === -1)
                {
                    columns = columns.concat(key).sort();
                    idx = columns.indexOf(key);
                    let kdx = -1;
                    while(++kdx < values.length)
                    {
                        values[kdx].splice(idx, 0, undefined);
                    }
                    row.splice(idx, 0, undefined);
                }
                row[idx] = data[idx][key];
            }
            values.push(row);
        }
        return {
            columns,
            values,
        };
    }

    update() : { sql : string; returning : any; selectReturning : string }
    {
        const withSQL = this.with();
        const updates = this._prepUpdate(this.single.update);
        const where = this.where();
        const order = this.order();
        const limit = this.limit();
        const { returning } = this.single;
        // const values = Object.values(this.single.update)
        //     .map((a) => `${ a }`)
        //     .join(', ');

        const moreWheres
            = this.grouped.where && this.grouped.where.length > 0
                ? this.grouped.where.map((where) =>
                {
                    if(Object.hasOwn(this.single.update, where.column))
                    {
                        return;
                    }
                    if(!where.value)
                    {
                        return;
                    }
                    return `"${ where.column }" ${ where.not ? '!' : '' }${ where.operator } ${ where.value }`;
                })
                : [];

        const selectReturning = returning ? `select ${ returning.map((item) => `"${ item }"`).join(', ') }
                                   from ${
    this.tableName
}
                                   where ${ Object.entries(this.single.update)
        .map(([ key, value ]) => `"${ key }" = '${ value }'`)
        .join(' and ') }${ moreWheres.length > 0 && ' and ' }${ moreWheres.join(
    ' and '
) }`
            : '';

        const sql = `${ withSQL }update ${ this.single.only ? 'only ' : '' }${ this.tableName }`
            + ` set ${
                updates.join(', ')
            }${ where ? ` ${ where }` : ''
            }${ order ? ` ${ order }` : ''
            }${ limit ? ` ${ limit }` : '' }`;

        return { sql, returning, selectReturning };
    }

    _returning(method, value, withTrigger = false) : string | void
    {
        // currently a placeholder in case I need to update return values
        switch (method)
        {
            case 'update':
            case 'insert':
                return value ? `${ withTrigger ? ' into #out' : '' }` : '';
            case 'del':
                return value ? `${ withTrigger ? ' into #out' : '' }` : '';
            case 'rowcount':
                return value ? 'select @@rowcount' : '';
        }
    }

    columnizeWithPrefix(prefix, target) : string
    {
        const columns = typeof target === 'string' ? [ target ] : target;
        let str = '';
        let i = -1;
        while(++i < columns.length)
        {
            if(i > 0)
            {
                str += ', ';
            }
            str += prefix + this.wrap(columns[i]);
        }
        return str;
    }
}

//----------------------------------------------------------------------------------------------------------------------

export default DB2QueryCompiler;

//----------------------------------------------------------------------------------------------------------------------
