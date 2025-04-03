import { knex } from "knex";
import { DB2Dialect } from "../../../src";
import { testSql } from "../../utils/testSql";

const db = knex({
  client: DB2Dialect,
});

describe("Identifiers", () => {
  it("should not wrap identifiers by default", () => {
    const query = db.select(["foo", "bar"]).from("test").where("foo", 1);

    testSql(query, `select foo, bar from test where foo = 1`);
  });

  it("should support wrapping identifiers", () => {
    const query = db
      .select(['"foo"', '"bar"'])
      .from('"test"')
      .where('"foo"', 1);

    testSql(query, `select "foo", "bar" from "test" where "foo" = 1`);
  });
});
