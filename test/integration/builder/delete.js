const Knex = require("knex");

const { DB2Dialect } = require("../../../dist/");
const testSql = require("../../utils/testSql");

const knex = Knex({
  client: DB2Dialect,
});

describe("Delete", () => {
  it("handles delete", () => {
    const query = knex.delete().from("test").where("x", "y");

    testSql(query, 'delete from "test" where "x" = \'y\'');
  });
});
