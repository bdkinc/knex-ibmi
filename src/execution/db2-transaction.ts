//----------------------------------------------------------------------------------------------------------------------

import Transaction from 'knex/lib/execution/transaction';
import * as odbc from 'odbc';

//----------------------------------------------------------------------------------------------------------------------

// The Knex.Transaction interface doesn't correctly implement the `begin`, `rollback`, or `commit` methods. This class
// Has to use a type definition that sucks, because Knex's typing sucks. Sorry.

class DB2Transaction extends Transaction
{
    begin(connection : odbc.Connection) : any
    {
        return connection.beginTransaction();
    }

    rollback(connection : odbc.Connection) : any
    {
        return connection.rollback();
    }

    commit(connection : odbc.Connection) : any
    {
        return connection.commit();
    }
}

//----------------------------------------------------------------------------------------------------------------------

export default DB2Transaction;

//----------------------------------------------------------------------------------------------------------------------
