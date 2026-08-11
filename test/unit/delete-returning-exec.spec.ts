import { expect } from "chai";
import DB2Dialect from "../../src";

describe("Delete returning execution", () => {
  it("uses one WHERE binding set for SELECT and one for DELETE", async () => {
    const client = new DB2Dialect({ client: "ibmi" });
    (client as any).logger = {
      error: () => {},
      warn: () => {},
      debug: () => {},
    };

    const calls: Array<{ sql: string; bindings: any[] }> = [];
    const connection: any = {
      query: async (sql: string, bindings: any[]) => {
        calls.push({ sql, bindings });
        return [{ ID: 5 }];
      },
      createStatement: async () => {
        let sql = "";
        let bindings: any[] = [];
        return {
          prepare: async (value: string) => {
            sql = value;
          },
          bind: async (value: any[]) => {
            bindings = value;
          },
          execute: async () => {
            calls.push({ sql, bindings });
            return {
              statement: sql,
              columns: [],
              count: 1,
              [Symbol.iterator]: function* () {},
            };
          },
          close: async () => {},
        };
      },
    };

    const obj: any = {
      sql: "delete from t where ID = ?",
      bindings: [5, 5],
      _ibmiDeleteReturning: {
        deleteSql: "delete from t where ID = ?",
        selectColumns: "ID",
        whereClause: "where ID = ?",
        deleteBindingCount: 1,
        whereBindingCount: 1,
        tableName: "t",
      },
    };

    await (client as any).executeDeleteReturning(connection, obj);

    expect(calls).to.deep.equal([
      { sql: "select ID from t where ID = ?", bindings: [5] },
      { sql: "delete from t where ID = ?", bindings: [5] },
    ]);
    expect(obj.response.rows).to.deep.equal([{ ID: 5 }]);
  });

  it("keeps CTE bindings with DELETE and uses trailing WHERE bindings for SELECT", async () => {
    const client = new DB2Dialect({ client: "ibmi" });
    const calls: Array<{ sql: string; bindings: any[] }> = [];
    const connection: any = {
      query: async (sql: string, bindings: any[]) => {
        calls.push({ sql, bindings });
        return [{ ID: 1 }];
      },
      createStatement: async () => {
        let sql = "";
        let bindings: any[] = [];
        return {
          prepare: async (value: string) => {
            sql = value;
          },
          bind: async (value: any[]) => {
            bindings = value;
          },
          execute: async () => {
            calls.push({ sql, bindings });
            return {
              statement: sql,
              columns: [],
              count: 1,
              [Symbol.iterator]: function* () {},
            };
          },
          close: async () => {},
        };
      },
    };
    const obj: any = {
      bindings: [9, 1, 1],
      _ibmiDeleteReturning: {
        deleteSql:
          "with x as (select * from s where Z = ?) delete from t where ID = ?",
        selectColumns: "ID",
        whereClause: "where ID = ?",
        deleteBindingCount: 2,
        whereBindingCount: 1,
        tableName: "t",
      },
    };

    await (client as any).executeDeleteReturning(connection, obj);

    expect(calls).to.deep.equal([
      { sql: "select ID from t where ID = ?", bindings: [1] },
      {
        sql: "with x as (select * from s where Z = ?) delete from t where ID = ?",
        bindings: [9, 1],
      },
    ]);
  });

  it("assigns raw returning bindings to SELECT after the DELETE boundary", async () => {
    const client = new DB2Dialect({ client: "ibmi" });
    const calls: Array<{ sql: string; bindings: any[] }> = [];
    const connection: any = {
      query: async (sql: string, bindings: any[]) => {
        calls.push({ sql, bindings });
        return [{ MARKER: 7 }];
      },
      createStatement: async () => {
        let sql = "";
        let bindings: any[] = [];
        return {
          prepare: async (value: string) => {
            sql = value;
          },
          bind: async (value: any[]) => {
            bindings = value;
          },
          execute: async () => {
            calls.push({ sql, bindings });
            return {
              statement: sql,
              columns: [],
              count: 1,
              [Symbol.iterator]: function* () {},
            };
          },
          close: async () => {},
        };
      },
    };
    const obj: any = {
      bindings: [9, 1, 7, 1],
      _ibmiDeleteReturning: {
        deleteSql:
          "with x as (select * from s where Z = ?) delete from t where ID = ?",
        selectColumns: "? as marker",
        whereClause: "where ID = ?",
        deleteBindingCount: 2,
        whereBindingCount: 1,
        tableName: "t",
      },
    };

    await (client as any).executeDeleteReturning(connection, obj);

    expect(calls).to.deep.equal([
      {
        sql: "select ? as marker from t where ID = ?",
        bindings: [7, 1],
      },
      {
        sql: "with x as (select * from s where Z = ?) delete from t where ID = ?",
        bindings: [9, 1],
      },
    ]);
  });
});
