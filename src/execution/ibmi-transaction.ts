// @ts-ignore
import Transaction from "knex/lib/execution/transaction";

class IBMiTransaction extends Transaction {
  async begin(connection: any) {
    await connection.beginTransaction();
    return connection;
  }

  async rollback(connection: any) {
    await connection.rollback();
    return connection;
  }

  async commit(connection: any) {
    await connection.commit();
    return connection;
  }
}

export default IBMiTransaction;
