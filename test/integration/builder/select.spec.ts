import Knex from "knex";
import { DB2Dialect } from "../../../src";
import { testSql } from "../../utils/testSql";

const knex = Knex({
  client: DB2Dialect,
});

describe("Select", () => {
  it("handles select", () => {
    const query = knex.select(["x", "y"]).from("test").where("x", 1);

    testSql(query, `select x, y from test where x = 1`);
  });

  it("allows identifier wrapper in query", () => {
    const query = knex.select(['"x"', '"y"']).from('"test"').where('"x"', 1);

    testSql(query, `select "x", "y" from "test" where "x" = 1`);
  });
});
