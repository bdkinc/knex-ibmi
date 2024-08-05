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

    testSql(query, `select IDENTITY_VAL_LOCAL() from FINAL TABLE(insert into testtable (x, y) values (1, 2))`);
  });

  it("allows identifier wrapper in query", () => {
    const query = knex.insert({ '"x"': 1 }).into('"testtable"');

    testSql(query, `select IDENTITY_VAL_LOCAL() from FINAL TABLE(insert into "testtable" ("x") values (1))`);
  });
});
