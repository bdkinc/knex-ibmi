import Transaction from "knex/lib/execution/transaction";
import * as console from "console";

class IBMiTransaction extends Transaction {
  async begin(conn) {
    const connection = await conn.connect();
    await connection.beginTransaction();
    return connection;
  }

  async rollback(conn) {
    console.log({ conn });
    const connection = await conn.connect();
    await connection.rollback();
    return connection;
  }

  async commit(conn) {
    await conn.commit();
    return conn;
  }
}

export default IBMiTransaction;
