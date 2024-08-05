import Knex from "knex";
import { DB2Dialect } from "../../../src";
import { testSql } from "../../utils/testSql";

const knex = Knex({
  client: DB2Dialect,
});

describe("Delete Statements", () => {
  it("supports basic delete", () => {
    const query = knex.delete().from("test").where("x", "y");

    testSql(query, `delete from test where x = 'y'`);
  });

  it("supports delete with whereIn", () => {
    const query = knex.delete().from("test").whereIn("x", [1, 2, 3]);

    testSql(query, `delete from test where x in (1, 2, 3)`);
  });

  it("supports delete with whereNotIn", () => {
    const query = knex.delete().from("test").whereNotIn("x", [1, 2, 3]);

    testSql(query, `delete from test where x not in (1, 2, 3)`);
  });

  it("supports delete with whereNull", () => {
    const query = knex.delete().from("test").whereNull("x");

    testSql(query, `delete from test where x is null`);
  });

  it("supports delete with whereNotNull", () => {
    const query = knex.delete().from("test").whereNotNull("x");

    testSql(query, `delete from test where x is not null`);
  });

  it("supports delete with whereExists", () => {
    const query = knex
      .delete()
      .from("test")
      .whereExists(function () {
        this.select("*").from("othertable").whereRaw("othertable.id = test.id");
      });

    testSql(
      query,
      "delete from test where exists (select * from othertable where othertable.id = test.id)",
    );
  });

  it("supports delete with whereNotExists", () => {
    const query = knex
      .delete()
      .from("test")
      .whereNotExists(function () {
        this.select("*").from("othertable").whereRaw("othertable.id = test.id");
      });

    testSql(
      query,
      `delete from test where not exists (select * from othertable where othertable.id = test.id)`,
    );
  });

  it("supports delete with whereBetween", () => {
    const query = knex.delete().from("test").whereBetween("x", [1, 10]);

    testSql(query, `delete from test where x between 1 and 10`);
  });

  it("supports delete with whereNotBetween", () => {
    const query = knex.delete().from("test").whereNotBetween("x", [1, 10]);

    testSql(query, `delete from test where x not between 1 and 10`);
  });

  it("supports delete with whereRaw", () => {
    const query = knex.delete().from("test").whereRaw("x = y");

    testSql(query, `delete from test where x = y`);
  });

  it("supports delete with orWhere", () => {
    const query = knex.delete().from("test").where("x", "y").orWhere("x", "z");

    testSql(query, `delete from test where x = 'y' or x = 'z'`);
  });

  it("supports delete with orWhereIn", () => {
    const query = knex
      .delete()
      .from("test")
      .where("x", "y")
      .orWhereIn("x", [1, 2, 3]);

    testSql(query, `delete from test where x = 'y' or x in (1, 2, 3)`);
  });

  it("supports delete with orWhereNotIn", () => {
    const query = knex
      .delete()
      .from("test")
      .where("x", "y")
      .orWhereNotIn("x", [1, 2, 3]);

    testSql(query, `delete from test where x = 'y' or x not in (1, 2, 3)`);
  });

  it("supports delete with orWhereNull", () => {
    const query = knex.delete().from("test").where("x", "y").orWhereNull("x");

    testSql(query, `delete from test where x = 'y' or x is null`);
  });

  it("supports delete with orWhereNotNull", () => {
    const query = knex
      .delete()
      .from("test")
      .where("x", "y")
      .orWhereNotNull("x");

    testSql(query, `delete from test where x = 'y' or x is not null`);
  });

  it("supports delete with orWhereExists", () => {
    const query = knex
      .delete()
      .from("test")
      .where("x", "y")
      .orWhereExists(function () {
        this.select("*").from("othertable").whereRaw("othertable.id = test.id");
      });

    testSql(
      query,
      `delete from test where x = 'y' or exists (select * from othertable where othertable.id = test.id)`,
    );
  });

  it("supports delete with orWhereNotExists", () => {
    const query = knex
      .delete()
      .from("test")
      .where("x", "y")
      .orWhereNotExists(function () {
        this.select("*").from("othertable").whereRaw("othertable.id = test.id");
      });

    testSql(
      query,
      `delete from test where x = 'y' or not exists (select * from othertable where othertable.id = test.id)`,
    );
  });

  it("supports delete with orWhereBetween", () => {
    const query = knex
      .delete()
      .from("test")
      .where("x", "y")
      .orWhereBetween("x", [1, 10]);

    testSql(query, `delete from test where x = 'y' or x between 1 and 10`);
  });

  it("supports delete with orWhereNotBetween", () => {
    const query = knex
      .delete()
      .from("test")
      .where("x", "y")
      .orWhereNotBetween("x", [1, 10]);

    testSql(query, `delete from test where x = 'y' or x not between 1 and 10`);
  });

  it("supports delete with orWhereRaw", () => {
    const query = knex
      .delete()
      .from("test")
      .where("x", "y")
      .orWhereRaw("x = z");

    testSql(query, `delete from test where x = 'y' or x = z`);
  });

  it("supports delete with multiple where clauses", () => {
    const query = knex.delete().from("test").where("x", "y").where("y", "z");

    testSql(query, `delete from test where x = 'y' and y = 'z'`);
  });
});
