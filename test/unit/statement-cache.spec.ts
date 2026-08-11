import { expect } from "chai";
import DB2Dialect from "../../src";

describe("Prepared statement cache", () => {
  it("does not close a newly cached statement and reuses it", async () => {
    const client = new DB2Dialect({
      client: "ibmi",
      ibmi: { preparedStatementCache: true },
    } as any);
    (client as any).logger = {
      error: () => {},
      warn: () => {},
      debug: () => {},
    };

    let closeCount = 0;
    let prepareCount = 0;
    let executeCount = 0;
    const statements: any[] = [];

    const connection: any = {
      createStatement: async () => {
        const stmt = {
          prepare: async () => {
            prepareCount += 1;
          },
          bind: async () => {},
          execute: async () => {
            executeCount += 1;
            return {
              statement: "insert into t (x) values (?)",
              columns: [],
              count: 1,
              [Symbol.iterator]: function* () {},
            };
          },
          close: async () => {
            closeCount += 1;
          },
        };
        statements.push(stmt);
        return stmt;
      },
    };

    const obj1: any = {
      sql: "insert into t (x) values (?)",
      bindings: [1],
      sqlMethod: "insert",
    };
    await (client as any).executeStatementQuery(connection, obj1);

    expect(prepareCount).to.equal(1);
    expect(executeCount).to.equal(1);
    expect(closeCount).to.equal(0);
    expect(statements).to.have.length(1);

    const obj2: any = {
      sql: "insert into t (x) values (?)",
      bindings: [2],
      sqlMethod: "insert",
    };
    await (client as any).executeStatementQuery(connection, obj2);

    expect(prepareCount).to.equal(1, "should reuse cached prepared statement");
    expect(executeCount).to.equal(2);
    expect(closeCount).to.equal(0, "cached statement must not be closed");
    expect(statements).to.have.length(1);
  });

  it("waits for evicted statements to close before destroying the connection", async () => {
    const client = new DB2Dialect({
      client: "ibmi",
      ibmi: { preparedStatementCache: true, preparedStatementCacheSize: 1 },
    } as any);
    (client as any).logger = {
      error: () => {},
      warn: () => {},
      debug: () => {},
    };

    let resolveEvictedClose!: () => void;
    let connectionClosed = false;
    let createCount = 0;
    const connection: any = {
      createStatement: async () => {
        createCount += 1;
        const first = createCount === 1;
        return {
          prepare: async () => {},
          bind: async () => {},
          execute: async () => ({
            statement: "insert",
            columns: [],
            count: 1,
            [Symbol.iterator]: function* () {},
          }),
          close: () =>
            first
              ? new Promise<void>((resolve) => {
                  resolveEvictedClose = resolve;
                })
              : Promise.resolve(),
        };
      },
      close: async () => {
        connectionClosed = true;
      },
    };

    await (client as any).executeStatementQuery(connection, {
      sql: "insert into t (x) values (?)",
      bindings: [1],
      sqlMethod: "insert",
    });
    await (client as any).executeStatementQuery(connection, {
      sql: "insert into t (y) values (?)",
      bindings: [2],
      sqlMethod: "insert",
    });

    const destroyPromise = client.destroyRawConnection(connection);
    await Promise.resolve();
    expect(connectionClosed).to.equal(false);
    resolveEvictedClose();
    await destroyPromise;
    expect(connectionClosed).to.equal(true);
  });

  it("does not retain a statement when prepare fails", async () => {
    const client = new DB2Dialect({
      client: "ibmi",
      ibmi: { preparedStatementCache: true },
    } as any);
    (client as any).logger = {
      error: () => {},
      warn: () => {},
      debug: () => {},
    };

    let closeCount = 0;
    let createCount = 0;
    let prepareAttempts = 0;

    const connection: any = {
      createStatement: async () => {
        createCount += 1;
        return {
          prepare: async () => {
            prepareAttempts += 1;
            if (prepareAttempts === 1) {
              throw new Error("prepare failed");
            }
          },
          bind: async () => {},
          execute: async () => ({
            statement: "insert into t (x) values (?)",
            columns: [],
            count: 1,
            [Symbol.iterator]: function* () {},
          }),
          close: async () => {
            closeCount += 1;
          },
        };
      },
    };

    const sql = "insert into t (x) values (?)";
    try {
      await (client as any).executeStatementQuery(connection, {
        sql,
        bindings: [1],
        sqlMethod: "insert",
      });
      expect.fail("expected prepare failure");
    } catch (err: any) {
      expect(err.message).to.equal("prepare failed");
    }

    expect(closeCount).to.equal(1, "failed statement should be closed");

    // Second attempt creates a new statement (failed one was not reused)
    await (client as any).executeStatementQuery(connection, {
      sql,
      bindings: [2],
      sqlMethod: "insert",
    });

    expect(createCount).to.equal(2);
    expect(prepareAttempts).to.equal(2);
    expect(closeCount).to.equal(1, "successful cache entry stays open");
  });

  it("evicts a broken cached statement after execute failure", async () => {
    const client = new DB2Dialect({
      client: "ibmi",
      ibmi: { preparedStatementCache: true },
    } as any);
    (client as any).logger = {
      error: () => {},
      warn: () => {},
      debug: () => {},
    };

    let createCount = 0;
    let executeAttempts = 0;
    let closeCount = 0;

    const connection: any = {
      createStatement: async () => {
        createCount += 1;
        return {
          prepare: async () => {},
          bind: async () => {},
          execute: async () => {
            executeAttempts += 1;
            if (executeAttempts === 1) {
              throw new Error("execute failed");
            }
            return {
              statement: "insert into t (x) values (?)",
              columns: [],
              count: 1,
              [Symbol.iterator]: function* () {},
            };
          },
          close: async () => {
            closeCount += 1;
          },
        };
      },
    };

    const sql = "insert into t (x) values (?)";
    try {
      await (client as any).executeStatementQuery(connection, {
        sql,
        bindings: [1],
        sqlMethod: "insert",
      });
      expect.fail("expected execute failure");
    } catch (err: any) {
      expect(err.message).to.equal("execute failed");
    }

    expect(closeCount).to.equal(1);

    await (client as any).executeStatementQuery(connection, {
      sql,
      bindings: [2],
      sqlMethod: "insert",
    });

    expect(createCount).to.equal(2, "failed entry must not be reused");
    expect(closeCount).to.equal(1);
  });
});
