import Knex from "knex";
import { DB2Dialect } from "../../../src";
import { testSql } from "../../utils/testSql";

describe("Sequential Insert Transactional Config", () => {
  it("does not alter compiled SQL when enabled", () => {
    const k1 = Knex({
      client: DB2Dialect,
      ibmi: {
        multiRowInsert: "sequential",
        sequentialInsertTransactional: true,
      },
    } as any);
    const query = k1.insert([{ a: 1 }, { a: 2 }]).into("foo");
    // Still only shows first row (sequential strategy) regardless of transactional flag
    testSql(
      query,
      "select IDENTITY_VAL_LOCAL() from FINAL TABLE(insert into foo (a) values (1))"
    );
  });
});
