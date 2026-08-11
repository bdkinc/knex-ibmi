import { expect } from "chai";
import DB2Dialect from "../../src";

describe("Sequential transactional insert execution", () => {
  function makeClient() {
    const client = new DB2Dialect({
      client: "ibmi",
      ibmi: {
        multiRowInsert: "sequential",
        sequentialInsertTransactional: true,
      },
    } as any);
    (client as any).logger = {
      error: () => {},
      warn: () => {},
      debug: () => {},
    };
    // Avoid depending on full query compiler construction for returning paths
    (client as any).queryCompiler = () => ({
      formatter: {
        columnize: (cols: any) =>
          Array.isArray(cols) ? cols.join(", ") : String(cols),
      },
    });
    return client;
  }

  function makeSuccessConnection() {
    const calls: string[] = [];
    const connection: any = {
      calls,
      beginTransaction: async () => {
        calls.push("beginTransaction");
      },
      commit: async () => {
        calls.push("commit");
      },
      rollback: async () => {
        calls.push("rollback");
      },
      query: async (sql: string) => {
        calls.push(`query:${sql}`);
        return [];
      },
      createStatement: async () => ({
        prepare: async () => {},
        bind: async () => {},
        execute: async () => {
          calls.push("execute");
          return {
            statement: "select IDENTITY_VAL_LOCAL() from FINAL TABLE(...)",
            columns: [{ name: "IDENTITY_VAL_LOCAL()" }],
            count: 1,
            map: (fn: any) => [fn({ "IDENTITY_VAL_LOCAL()": 1 })],
            [Symbol.iterator]: function* () {
              yield { "IDENTITY_VAL_LOCAL()": 1 };
            },
          };
        },
        close: async () => {},
      }),
    };
    return connection;
  }

  it("calls beginTransaction and commit on success", async () => {
    const client = makeClient();
    const connection = makeSuccessConnection();

    const obj: any = {
      _ibmiSequentialInsert: {
        rows: [{ a: 1 }, { a: 2 }],
        columns: ["a"],
        tableName: "foo",
        returning: null,
      },
    };

    await (client as any).executeSequentialInsert(connection, obj);

    expect(connection.calls).to.deep.equal([
      "beginTransaction",
      "execute",
      "execute",
      "commit",
    ]);
    expect(obj.response.rowCount).to.equal(2);
  });

  it("uses DEFAULT for columns missing from a heterogeneous row", async () => {
    const client = makeClient();
    const connection = makeSuccessConnection();
    const preparedSql: string[] = [];
    const boundValues: any[][] = [];

    connection.createStatement = async () => ({
      prepare: async (sql: string) => {
        preparedSql.push(sql);
      },
      bind: async (values: any[]) => {
        boundValues.push(values);
      },
      execute: async () => {
        connection.calls.push("execute");
        return {
          statement: "select IDENTITY_VAL_LOCAL() from FINAL TABLE(...)",
          columns: [{ name: "IDENTITY_VAL_LOCAL()" }],
          count: 1,
          map: (fn: any) => [fn({ "IDENTITY_VAL_LOCAL()": 1 })],
          [Symbol.iterator]: function* () {
            yield { "IDENTITY_VAL_LOCAL()": 1 };
          },
        };
      },
      close: async () => {},
    });

    await (client as any).executeSequentialInsert(connection, {
      _ibmiSequentialInsert: {
        rows: [{ a: 1 }, { a: 2, b: null }],
        columns: ["a", "b"],
        tableName: "foo",
        returning: null,
      },
    });

    expect(preparedSql[0]).to.include(
      "insert into foo (a, b) values (?, DEFAULT)",
    );
    expect(boundValues[0]).to.deep.equal([1]);
    expect(preparedSql[1]).to.include("insert into foo (a, b) values (?, ?)");
    expect(boundValues[1]).to.deep.equal([2, null]);
  });

  it("compiles raw values and respects useNullAsDefault", async () => {
    const client = new DB2Dialect({
      client: "ibmi",
      useNullAsDefault: true,
      ibmi: { multiRowInsert: "sequential" },
    } as any);
    (client as any).logger = {
      error: () => {},
      warn: () => {},
      debug: () => {},
    };
    const preparedSql: string[] = [];
    const boundValues: any[][] = [];
    const connection: any = {
      createStatement: async () => ({
        prepare: async (sql: string) => {
          preparedSql.push(sql);
        },
        bind: async (values: any[]) => {
          boundValues.push(values);
        },
        execute: async () => ({
          statement: "select IDENTITY_VAL_LOCAL() from FINAL TABLE(...)",
          columns: [{ name: "IDENTITY_VAL_LOCAL()" }],
          count: 1,
          map: (fn: any) => [fn({ "IDENTITY_VAL_LOCAL()": 1 })],
          [Symbol.iterator]: function* () {
            yield { "IDENTITY_VAL_LOCAL()": 1 };
          },
        }),
        close: async () => {},
      }),
    };

    await (client as any).executeSequentialInsert(connection, {
      _ibmiSequentialInsert: {
        rows: [{ a: 1, b: client.raw("CURRENT TIMESTAMP") }, { a: 2 }],
        columns: ["a", "b"],
        tableName: "foo",
        returning: null,
        useNullAsDefault: true,
      },
    });

    expect(preparedSql[0]).to.include(
      "insert into foo (a, b) values (?, CURRENT TIMESTAMP)",
    );
    expect(boundValues[0]).to.deep.equal([1]);
    expect(preparedSql[1]).to.include("insert into foo (a, b) values (?, ?)");
    expect(boundValues[1]).to.deep.equal([2, null]);
  });

  it("rolls back and rethrows when a row execution fails", async () => {
    const client = makeClient();
    const calls: string[] = [];
    let executes = 0;

    const connection: any = {
      beginTransaction: async () => {
        calls.push("beginTransaction");
      },
      commit: async () => {
        calls.push("commit");
      },
      rollback: async () => {
        calls.push("rollback");
      },
      createStatement: async () => ({
        prepare: async () => {},
        bind: async () => {},
        execute: async () => {
          executes += 1;
          calls.push("execute");
          if (executes === 2) {
            throw new Error("row 2 failed");
          }
          return {
            statement: "select IDENTITY_VAL_LOCAL() from FINAL TABLE(...)",
            columns: [{ name: "IDENTITY_VAL_LOCAL()" }],
            count: 1,
            map: (fn: any) => [fn({ "IDENTITY_VAL_LOCAL()": 1 })],
            [Symbol.iterator]: function* () {
              yield { "IDENTITY_VAL_LOCAL()": 1 };
            },
          };
        },
        close: async () => {},
      }),
    };

    const obj: any = {
      _ibmiSequentialInsert: {
        rows: [{ a: 1 }, { a: 2 }],
        columns: ["a"],
        tableName: "foo",
        returning: null,
      },
    };

    try {
      await (client as any).executeSequentialInsert(connection, obj);
      expect.fail("expected row failure");
    } catch (err: any) {
      expect(err.message).to.equal("row 2 failed");
    }

    expect(calls).to.deep.equal([
      "beginTransaction",
      "execute",
      "execute",
      "rollback",
    ]);
  });

  it("fails when beginTransaction fails rather than proceeding", async () => {
    const client = makeClient();
    const calls: string[] = [];

    const connection: any = {
      beginTransaction: async () => {
        calls.push("beginTransaction");
        throw new Error("cannot begin");
      },
      commit: async () => {
        calls.push("commit");
      },
      rollback: async () => {
        calls.push("rollback");
      },
      createStatement: async () => {
        calls.push("createStatement");
        return {
          prepare: async () => {},
          bind: async () => {},
          execute: async () => {
            calls.push("execute");
            return { count: 1, columns: [], [Symbol.iterator]: function* () {} };
          },
          close: async () => {},
        };
      },
    };

    try {
      await (client as any).executeSequentialInsert(connection, {
        _ibmiSequentialInsert: {
          rows: [{ a: 1 }],
          columns: ["a"],
          tableName: "foo",
          returning: null,
        },
      });
      expect.fail("expected begin failure");
    } catch (err: any) {
      expect(err.message).to.equal("cannot begin");
    }

    expect(calls).to.deep.equal(["beginTransaction"]);
  });
});
