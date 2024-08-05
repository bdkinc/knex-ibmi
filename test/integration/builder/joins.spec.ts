import Knex from "knex";
import { DB2Dialect } from "../../../src";
import { testSql } from "../../utils/testSql";

const knex = Knex({
  client: DB2Dialect,
});

describe("Joins", () => {
  it("handles basic join", () => {
    const query = knex
      .select()
      .from("test")
      .join("othertable", "test.id", "=", "othertable.id");

    testSql(
      query,
      `select * from test inner join othertable on test.id = othertable.id`,
    );
  });

  it("allows identifier wrapper in query", () => {
    const query = knex
      .select()
      .from('"test"')
      .join('"othertable"', '"test"."id"', "=", '"othertable"."id"');

    testSql(
      query,
      `select * from "test" inner join "othertable" on "test"."id" = "othertable"."id"`,
    );
  });
});
