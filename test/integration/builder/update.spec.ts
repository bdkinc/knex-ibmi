import Knex from "knex";
import { DB2Dialect } from "../../../src";
import { testSql } from "../../utils/testSql";

const knex = Knex({
  client: DB2Dialect,
});

describe("Update Statements", () => {
  it("supports basic update", () => {
    const query = knex("test").update({ x: 10, y: 20 }).where("x", "y");
    testSql(query, "update test set x = 10, y = 20 where x = 'y'");
  });

  it("supports update with whereIn", () => {
    const query = knex("test").update({ x: 10, y: 20 }).whereIn("x", [1, 2, 3]);
    testSql(query, "update test set x = 10, y = 20 where x in (1, 2, 3)");
  });

  it("supports update with whereNotIn", () => {
    const query = knex("test")
      .update({ x: 10, y: 20 })
      .whereNotIn("x", [1, 2, 3]);
    testSql(query, "update test set x = 10, y = 20 where x not in (1, 2, 3)");
  });

  it("supports update with whereNull", () => {
    const updates = { x: 10, y: 20 };
    const query = knex("test").update(updates).whereNull("x");

    testSql(query, "update test set x = 10, y = 20 where x is null");
  });

  it("supports update with whereNotNull", () => {
    const updates = { x: 10, y: 20 };
    const query = knex("test").update(updates).whereNotNull("x");

    testSql(query, "update test set x = 10, y = 20 where x is not null");
  });

  it("supports update with whereExists", () => {
    const updates = { x: 10, y: 20 };
    const query = knex("test")
      .update(updates)
      .whereExists(function () {
        this.select("*").from("othertable").whereRaw("othertable.id = test.id");
      });

    testSql(
      query,
      "update test set x = 10, y = 20 " +
        "where exists (select * from othertable where othertable.id = test.id)",
    );
  });

  it("supports update with whereNotExists", () => {
    const updates = { x: 10, y: 20 };
    const query = knex("test")
      .update(updates)
      .whereNotExists(function () {
        this.select("*").from("othertable").whereRaw("othertable.id = test.id");
      });

    testSql(
      query,
      "update test set x = 10, y = 20 " +
        "where not exists (select * from othertable where othertable.id = test.id)",
    );
  });

  it("supports update with whereBetween", () => {
    const updates = { x: 10, y: 20 };
    const query = knex("test").update(updates).whereBetween("x", [1, 10]);

    testSql(query, "update test set x = 10, y = 20 where x between 1 and 10");
  });

  it("supports update with whereNotBetween", () => {
    const updates = { x: 10, y: 20 };
    const query = knex("test").update(updates).whereNotBetween("x", [1, 10]);

    testSql(
      query,
      "update test set x = 10, y = 20 where x not between 1 and 10",
    );
  });

  it("supports update with a subquery in where clause", () => {
    const updates = { x: 10, y: 20 };
    const query = knex("test")
      .update(updates)
      .where("x", knex.select("id").from("othertable").where("name", "John"));

    testSql(
      query,
      "update test set x = 10, y = 20 " +
        "where x = (select id from othertable where name = 'John')",
    );
  });

  it("supports update with returning clause", () => {
    const updates = { x: 10, y: 20 };
    const query = knex("test").update(updates).where("x", "y").returning("id");
    testSql(
      query,
      "update test set x = 10, y = 20 where x = 'y'",
    );
  });

  it("supports update with returning clause and multiple columns", () => {
    const updates = { x: 10, y: 20 };
    const query = knex("test")
      .update(updates)
      .where("x", "y")
      .returning(["id", "x"]);
    testSql(
      query,
      "update test set x = 10, y = 20 where x = 'y'",
    );
  });

  it("supports conditional update using case/when", () => {
    const updates = {
      x: knex.raw("case when y = 1 then 10 else 20 end"),
    };
    const query = knex("test").update(updates).where("x", "y");
    testSql(
      query,
      "update test set x = case when y = 1 then 10 else 20 end where x = 'y'",
    );
  });

  it("supports update with whereRaw", () => {
    const updates = { x: 10, y: 20 };
    const query = knex("test").update(updates).whereRaw("x = y");
    testSql(query, "update test set x = 10, y = 20 where x = y");
  });

  it("supports update with multiple where clauses", () => {
    const updates = { x: 10, y: 20 };
    const query = knex("test").update(updates).where("x", "y").where("y", "z");
    testSql(query, "update test set x = 10, y = 20 where x = 'y' and y = 'z'");
  });

  it("supports update with dynamic updates (raw expression)", () => {
    const query = knex("test").update("x", knex.raw("x + 1")).where("id", 1);
    testSql(query, "update test set x = x + 1 where id = 1");
  });
});
