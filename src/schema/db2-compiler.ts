//----------------------------------------------------------------------------------------------------------------------
// DB2 Schema Compiler
//----------------------------------------------------------------------------------------------------------------------

import SchemaCompiler from 'knex/lib/schema/compiler';

//----------------------------------------------------------------------------------------------------------------------

function prefixedTableName(prefix, table) : string
{
    return prefix ? `${ prefix }.${ table }` : table;
}

//----------------------------------------------------------------------------------------------------------------------

class DB2SchemaCompiler extends SchemaCompiler
{
    hasTable(tableName) : void
    {
        // @ts-expect-error So, the knex types aren't entirely right and kinda suck.
        const formattedTable = this.client.parameter(
            prefixedTableName(this.schema, tableName),
            this.builder,
            this.bindingsHolder
        );
        const bindings = [ tableName ];
        let sql
            = `select TABLE_NAME
               from QSYS2.SYSTABLES `
            + `where TYPE = 'T' and TABLE_NAME = ${ formattedTable }`;
        if(this.schema)
        {
            sql += ' and TABLE_SCHEMA = ?';
            bindings.push(this.schema);
        }

        this.pushQuery({
            sql,
            bindings,
            output: (resp) =>
            {
                return resp.rowCount > 0;
            },
        });
    }

    toSQL() : string[]
    {
        // @ts-expect-error So, the knex types aren't entirely right and kinda suck.
        const sequence = this.builder._sequence;
        for(let i = 0, len = sequence.length; i < len; i++)
        {
            const query = sequence[i];
            this[query.method](...query.args);
        }
        return this.sequence;
    }
}

//----------------------------------------------------------------------------------------------------------------------

export default DB2SchemaCompiler;

//----------------------------------------------------------------------------------------------------------------------
