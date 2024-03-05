//----------------------------------------------------------------------------------------------------------------------
// DB2 Column Compiler
//----------------------------------------------------------------------------------------------------------------------

import ColumnCompiler from 'knex/lib/schema/columncompiler';

//----------------------------------------------------------------------------------------------------------------------

class Db2ColumnCompiler extends ColumnCompiler
{
    increments(options = { primaryKey: true }) : string
    {
        return (
            `int not null generated always as identity (start with 1, increment by 1)${
                this.tableCompiler._canBeAddPrimaryKey(options) ? ' primary key' : '' }`
        );
    }
}

//----------------------------------------------------------------------------------------------------------------------

export default Db2ColumnCompiler;

//----------------------------------------------------------------------------------------------------------------------
