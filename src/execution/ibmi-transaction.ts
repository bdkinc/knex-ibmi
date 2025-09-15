import Transaction from "knex/lib/execution/transaction.js";

class IBMiTransaction extends Transaction {
  // Use type assertion to work around ESM import interface issues
  [key: string]: any;

  begin(connection: any): any {
    try {
      return connection.beginTransaction();
    } catch (error: any) {
      if (this.isConnectionClosed(error)) {
        console.warn(
          "IBM i DB2: Connection closed during transaction begin, DDL operations may have caused implicit commit"
        );
        throw new Error(
          "Connection closed during transaction begin - consider using migrations.disableTransactions: true"
        );
      }
      throw error;
    }
  }

  rollback(connection: any): any {
    try {
      return connection.rollback();
    } catch (error: any) {
      // Treat rollback on a closed connection as success to avoid hangs
      console.warn(
        "IBM i DB2: Rollback encountered an error (likely closed connection):",
        error?.message || error
      );
      return Promise.resolve();
    }
  }

  commit(connection: any): any {
    try {
      return connection.commit();
    } catch (error: any) {
      if (this.isConnectionClosed(error)) {
        console.warn(
          "IBM i DB2: Connection closed during commit - DDL operations cause implicit commits"
        );
        // Re-throw so Knex can surface the expected failure semantics
        throw new Error(
          "Connection closed during commit - this is expected with DDL operations on IBM i DB2"
        );
      }
      throw error;
    }
  }

  private isConnectionClosed(error: any): boolean {
    const message = String(error?.message || error || "").toLowerCase();
    return (
      message.includes("connection") &&
      (message.includes("closed") ||
        message.includes("invalid") ||
        message.includes("terminated") ||
        message.includes("not connected"))
    );
  }
}

export default IBMiTransaction;
