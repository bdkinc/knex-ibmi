import Transaction from "knex/lib/execution/transaction.js";

class IBMiTransaction extends Transaction {
  // Use type assertion to work around ESM import interface issues
  [key: string]: any;

  async begin(connection: any): Promise<any> {
    try {
      return await connection.beginTransaction();
    } catch (error: any) {
      if (this.isConnectionClosed(error)) {
        console.warn(
          "IBM i DB2: Connection closed during transaction begin, DDL operations may have caused implicit commit",
        );
        throw new Error(
          "Connection closed during transaction begin - consider using migrations.disableTransactions: true",
        );
      }
      throw error;
    }
  }

  async rollback(connection: any, error: any): Promise<any> {
    this._completed = true;
    try {
      await connection.rollback();
    } catch (rollbackError: any) {
      if (!this.isConnectionClosed(rollbackError)) {
        this._rejecter(rollbackError);
        return;
      }
      console.warn(
        "IBM i DB2: Rollback encountered a closed connection:",
        rollbackError?.message || rollbackError,
      );
    }

    if (error === undefined && this.doNotRejectOnRollback) {
      this._resolver();
      return;
    }

    this._rejecter(
      error === undefined
        ? new Error("Transaction rejected with non-error: undefined")
        : error,
    );
  }

  async commit(connection: any, value: any): Promise<any> {
    this._completed = true;
    try {
      const result = await connection.commit();
      this._resolver(value);
      return result;
    } catch (error: any) {
      const wrappedError = this.isConnectionClosed(error)
        ? new Error(
            "Connection closed during commit - this is expected with DDL operations on IBM i DB2",
          )
        : error;

      if (wrappedError !== error) {
        console.warn(
          "IBM i DB2: Connection closed during commit - DDL operations cause implicit commits",
        );
      }

      this._rejecter(wrappedError);
      return;
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
