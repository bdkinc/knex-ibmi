import { expect } from "chai";
import DB2Dialect from "../../src";
import IBMiTransaction from "../../src/execution/ibmi-transaction";

describe("IBMiTransaction async rejection handling", () => {
  let client: DB2Dialect;
  let tx: any;

  beforeEach(() => {
    client = new DB2Dialect({ client: "ibmi" });
    tx = new (IBMiTransaction as any)(client, async () => {}, {}, undefined);
  });

  it("maps rejected beginTransaction with connection-closed message", async () => {
    const connection = {
      beginTransaction: async () => {
        throw new Error("connection closed by peer");
      },
    };

    try {
      await tx.begin(connection);
      expect.fail("expected begin to throw");
    } catch (err: any) {
      expect(err.message).to.equal(
        "Connection closed during transaction begin - consider using migrations.disableTransactions: true",
      );
    }
  });

  it("rethrows non-connection begin rejections", async () => {
    const connection = {
      beginTransaction: async () => {
        throw new Error("begin boom");
      },
    };

    try {
      await tx.begin(connection);
      expect.fail("expected begin to throw");
    } catch (err: any) {
      expect(err.message).to.equal("begin boom");
    }
  });

  it("suppresses closed-connection rollback rejections and rejects the transaction error", async () => {
    const connection = {
      rollback: async () => {
        throw new Error("connection terminated during rollback");
      },
    };
    const transactionError = new Error("transaction failed");
    let rejected: any;
    tx._resolver = () => {};
    tx._rejecter = (error: any) => {
      rejected = error;
    };

    await tx.rollback(connection, transactionError);

    expect(rejected).to.equal(transactionError);
  });

  it("surfaces non-connection rollback failures", async () => {
    const connection = {
      rollback: async () => {
        throw new Error("rollback failed");
      },
    };
    let rejected: any;
    tx._rejecter = (error: any) => {
      rejected = error;
    };

    await tx.rollback(connection, new Error("transaction failed"));
    expect(rejected.message).to.equal("rollback failed");
  });

  it("maps rejected commit with connection-closed message", async () => {
    const connection = {
      commit: async () => {
        throw new Error("connection is not connected");
      },
    };

    let rejected: any;
    tx._rejecter = (error: any) => {
      rejected = error;
    };
    await tx.commit(connection);
    expect(rejected.message).to.equal(
      "Connection closed during commit - this is expected with DDL operations on IBM i DB2",
    );
  });

  it("rethrows non-connection commit rejections", async () => {
    const connection = {
      commit: async () => {
        throw new Error("commit boom");
      },
    };

    let rejected: any;
    tx._rejecter = (error: any) => {
      rejected = error;
    };
    await tx.commit(connection);
    expect(rejected.message).to.equal("commit boom");
  });

  it("settles driver commit failures without a secondary rollback", async () => {
    const db: any = new DB2Dialect({ client: "ibmi" });
    const calls: string[] = [];
    const connection = {
      beginTransaction: async () => {
        calls.push("begin");
      },
      commit: async () => {
        calls.push("commit");
        throw new Error("commit failed");
      },
      rollback: async () => {
        calls.push("rollback");
      },
    };
    db.acquireConnection = async () => connection;
    db.releaseConnection = () => {
      calls.push("release");
    };

    try {
      await db.transaction(async () => "value");
      expect.fail("expected commit rejection");
    } catch (err: any) {
      expect(err.message).to.equal("commit failed");
    }

    await new Promise((resolve) => setImmediate(resolve));
    expect(calls).to.deep.equal(["begin", "commit", "release"]);
  });

  it("settles driver rollback failures without an unhandled rejection", async () => {
    const db: any = new DB2Dialect({ client: "ibmi" });
    const calls: string[] = [];
    const unhandled: any[] = [];
    const onUnhandled = (error: any) => {
      unhandled.push(error);
    };
    process.on("unhandledRejection", onUnhandled);

    try {
      const connection = {
        beginTransaction: async () => {
          calls.push("begin");
        },
        commit: async () => {
          calls.push("commit");
        },
        rollback: async () => {
          calls.push("rollback");
          throw new Error("rollback failed");
        },
      };
      db.acquireConnection = async () => connection;
      db.releaseConnection = () => {
        calls.push("release");
      };

      try {
        await db.transaction(async () => {
          throw new Error("container failed");
        });
        expect.fail("expected rollback rejection");
      } catch (err: any) {
        expect(err.message).to.equal("rollback failed");
      }

      await new Promise((resolve) => setImmediate(resolve));
      expect(calls).to.deep.equal(["begin", "rollback", "release"]);
      expect(
        unhandled.filter(
          (error) => error?.message === "rollback failed",
        ),
      ).to.deep.equal([]);
    } finally {
      process.off("unhandledRejection", onUnhandled);
    }
  });

  it("settles the observable Knex transaction contract", async () => {
    const db: any = new DB2Dialect({ client: "ibmi" });
    const calls: string[] = [];
    const connection = {
      beginTransaction: async () => {
        calls.push("begin");
      },
      commit: async () => {
        calls.push("commit");
      },
      rollback: async () => {
        calls.push("rollback");
      },
    };
    db.acquireConnection = async () => connection;
    db.releaseConnection = () => {
      calls.push("release");
    };

    const committed = await db.transaction(async () => "committed");
    expect(committed).to.equal("committed");
    expect(calls).to.deep.equal(["begin", "commit", "release"]);

    calls.length = 0;
    try {
      await db.transaction(async () => {
        throw new Error("rolled back");
      });
      expect.fail("expected transaction rejection");
    } catch (err: any) {
      expect(err.message).to.equal("rolled back");
    }
    expect(calls).to.deep.equal(["begin", "rollback", "release"]);
  });
});
