//----------------------------------------------------------------------------------------------------------------------
// DB2 Schema Compiler
//----------------------------------------------------------------------------------------------------------------------

import SchemaCompiler from 'knex/lib/schema/compiler';

//----------------------------------------------------------------------------------------------------------------------

class DB2SchemaCompiler extends SchemaCompiler
{
    hasTable(tableName)
    {
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
        // @ts-ignore
        if(this.schema)
        {
            sql += ' and TABLE_SCHEMA = ?';
            // @ts-ignore
            bindings.push(this.schema);
        }

        // @ts-ignore
        this.pushQuery({
            sql,
            bindings,
            output: (resp) =>
            {
                return resp.rowCount > 0;
            },
        });
    }

    toSQL()
    {
        const sequence = this.builder._sequence;
        for(let i = 0, l = sequence.length; i < l; i++)
        {
            const query = sequence[i];
            this[query.method].apply(this, query.args);
        }
        return this.sequence;
    }
}

//----------------------------------------------------------------------------------------------------------------------

function prefixedTableName(prefix, table)
{
    return prefix ? `${ prefix }.${ table }` : table;
}

//----------------------------------------------------------------------------------------------------------------------

export default DB2SchemaCompiler;

//----------------------------------------------------------------------------------------------------------------------
