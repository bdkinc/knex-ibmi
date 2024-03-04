const Knex = require("knex");

const { DB2Dialect } = require("../../../dist/");

const knex = Knex({
  client: DB2Dialect,
});

const testSql = require("../../utils/testSql");

describe("Inserts", () => {
  it("handles insert", () => {
    const record = {
      x: 1,
      y: 2,
    };
    const query = knex.insert(record).into("testtable");

    // FIXME: This should not be doing this wrapping; knex doesn't require an insert statement to return a value.
    // testSql(query, 'insert into "testtable" ("x", "y") values (1, 2)');
    testSql(query, 'select IDENTITY_VAL_LOCAL() from FINAL TABLE(insert into "testtable" ("x", "y") values (1, 2))');
  });
});
