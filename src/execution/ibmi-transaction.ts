// @ts-ignore
import Transaction from "knex/lib/execution/transaction";

class IBMiTransaction extends Transaction {
  async begin(connection) {
    await connection.beginTransaction();
    return connection;
  }

  async rollback(connection) {
    await connection.rollback();
    return connection;
  }

  async commit(connection) {
    await connection.commit();
    return connection;
  }
}

export default IBMiTransaction;
