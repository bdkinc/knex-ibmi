import Transaction from "knex/lib/execution/transaction";

class IBMiTransaction extends Transaction {
  async begin(conn) {
    const connection = await conn.connect();
    await connection.beginTransaction();
    return connection;
  }

  async rollback(conn) {
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
