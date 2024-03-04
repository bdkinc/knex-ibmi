const Knex = require("knex");

const { DB2Dialect } = require("../../../dist/");

const knex = Knex({
  client: DB2Dialect,
});

const testSql = require("../../utils/testSql");

describe("Select", () => {
  it("handles select", () => {
    const query = knex.select(["x", "y"]).from("test").where("x", 1);

    testSql(query, 'select "x", "y" from "test" where "x" = 1');
  });
});
