import Knex from "knex";
import { DB2Dialect } from "../../../src";
import { testSql } from "../../utils/testSql";

const knex = Knex({
  client: DB2Dialect,
});

describe("Inserts", () => {
  it("handles insert", () => {
    const record = {
      x: 1,
      y: 2,
    };
    const query = knex.insert(record).into("testtable");

    testSql(
      query,
      `select IDENTITY_VAL_LOCAL() from FINAL TABLE(insert into testtable (x, y) values (1, 2))`
    );
  });

  it("allows identifier wrapper in query", () => {
    const query = knex.insert({ '"x"': 1 }).into('"testtable"');

    testSql(
      query,
      `select IDENTITY_VAL_LOCAL() from FINAL TABLE(insert into "testtable" ("x") values (1))`
    );
  });

  it("supports multi-row insert (auto strategy)", () => {
    const k2 = Knex({
      client: DB2Dialect,
      ibmi: { multiRowInsert: "auto" },
    } as any);
    const query = k2
      .insert([
        { x: 1, y: 2 },
        { x: 3, y: 4 },
      ])
      .into("testtable");
    // Expect * selection for multi-row lenient returning
    testSql(
      query,
      "select * from FINAL TABLE(insert into testtable (x, y) values (1, 2), (3, 4))"
    );
  });

  it("supports multi-row insert disabled (falls back to single)", () => {
    const k3 = Knex({
      client: DB2Dialect,
      ibmi: { multiRowInsert: "disabled" },
    } as any);
    const query = k3
      .insert([
        { x: 1, y: 2 },
        { x: 3, y: 4 },
      ])
      .into("testtable");
    // Falls back to first row only legacy behavior
    testSql(
      query,
      "select IDENTITY_VAL_LOCAL() from FINAL TABLE(insert into testtable (x, y) values (1, 2))"
    );
  });

  it("supports multi-row insert sequential strategy (first row shown)", () => {
    const kSeq = Knex({
      client: DB2Dialect,
      ibmi: { multiRowInsert: "sequential" },
    } as any);
    const query = kSeq
      .insert([
        { x: 1, y: 2 },
        { x: 3, y: 4 },
      ])
      .into("testtable");
    testSql(
      query,
      "select IDENTITY_VAL_LOCAL() from FINAL TABLE(insert into testtable (x, y) values (1, 2))"
    );
  });
});
