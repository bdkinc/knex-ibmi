const Knex = require("knex");

const { DB2Dialect } = require("../../../dist/");

const knex = Knex({
  client: DB2Dialect,
});

const testSql = require("../../utils/testSql");

describe("Joins", () => {
  it("handles basic join", () => {
    const query = knex
      .select()
      .from("test")
      .join("othertable", "test.id", "=", "othertable.id");

    testSql(
      query,
      'select * from "test" inner join "othertable" on "test"."id" = "othertable"."id"',
    );
  });
});
