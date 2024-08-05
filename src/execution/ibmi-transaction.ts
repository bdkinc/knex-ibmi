import Transaction from "knex/lib/execution/transaction";
import { Knex } from "knex";

class IBMiTransaction extends Transaction {
  begin(connection: any): Knex.QueryBuilder<any, any[]> {
    connection.beginTransaction();
    return connection;
  }

  rollback(connection: any): Knex.QueryBuilder<any, any[]> {
    connection.rollback();
    return connection;
  }

  commit(connection: any): Knex.QueryBuilder<any, any[]> {
    connection.commit();
    return connection;
  }
}

export default IBMiTransaction;
