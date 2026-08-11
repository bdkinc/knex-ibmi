import { expect } from "chai";
import Knex from "knex";
import DB2Dialect from "../../src";
import { testSql } from "../utils/testSql";

describe("Insert prep regressions", () => {
  const knex = Knex({
    client: DB2Dialect,
    ibmi: { multiRowInsert: "auto" },
  } as any);

  it("unions heterogeneous multi-row columns and preserves explicit null", () => {
    const query = knex
      .insert([
        { a: 1, b: null },
        { a: 2, c: 3 },
      ])
      .into("foo");

    // Sorted union columns: a, b, c
    // Explicit null stays bound as null; missing keys become DEFAULT via valueForUndefined
    testSql(
      query,
      "insert into foo (a, b, c) values (1, NULL, DEFAULT), (2, DEFAULT, 3)",
    );
  });

  it("preserves explicit null for single-row insert", () => {
    const query = knex.insert({ a: 1, b: null }).into("foo");
    testSql(
      query,
      "select IDENTITY_VAL_LOCAL() from FINAL TABLE(insert into foo (a, b) values (1, NULL))",
    );
  });

  it("does not mutate caller migration_time input", () => {
    const client = new DB2Dialect({ client: "ibmi" });
    const compiler = client.queryCompiler(
      knex("knex_migrations").insert({}) as any,
    ) as any;

    const migrationTime = new Date("2024-01-15T12:34:56.000Z");
    const input = {
      name: "001_test.js",
      batch: 1,
      migration_time: migrationTime,
    };
    const original = input.migration_time;

    const prepared = compiler._prepInsert(input);

    expect(input.migration_time).to.equal(original);
    expect(prepared.columns).to.deep.equal(["batch", "migration_time", "name"]);
    expect(prepared.values[0][1]).to.be.a("string");
    expect(prepared.values[0][1]).to.match(
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
    );
  });

  it("uses union columns for sequential multi-row metadata", () => {
    const kSeq = Knex({
      client: DB2Dialect,
      ibmi: { multiRowInsert: "sequential" },
    } as any);
    const query = kSeq
      .insert([
        { a: 1 },
        { a: 2, b: null },
      ])
      .into("foo");

    const compiled = (query as any).toSQL();
    expect(compiled._ibmiSequentialInsert).to.exist;
    expect(compiled._ibmiSequentialInsert.columns).to.deep.equal(["a", "b"]);
    expect(compiled._ibmiSequentialInsert.rows).to.deep.equal([
      { a: 1 },
      { a: 2, b: null },
    ]);
  });
});
