import Transaction from "knex/lib/execution/transaction";
import { Knex } from "knex";

class IBMiTransaction extends Transaction {
  begin(connection: any): Knex.QueryBuilder<any, any[]> {
    return connection.beginTransaction();
  }

  rollback(connection: any): Knex.QueryBuilder<any, any[]> {
    return connection.rollback();
  }

  commit(connection: any): Knex.QueryBuilder<any, any[]> {
    return connection.commit();
  }
}

export default IBMiTransaction;
