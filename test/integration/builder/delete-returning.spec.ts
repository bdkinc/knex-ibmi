import { expect } from "chai";
import Knex from "knex";
import { DB2Dialect } from "../../../src";
import { testSql } from "../../utils/testSql";

const knexInstance = Knex({ client: DB2Dialect });

describe("Delete Returning Emulation", () => {
  it("compiles delete returning single column", () => {
    const q = knexInstance("t").where("id", 5).del().returning("id");
    testSql(q, "delete from t where id = 5");
  });

  it("compiles delete returning multiple columns", () => {
    const q = knexInstance("t").where("x", 1).del().returning(["id", "x"]);
    testSql(q, "delete from t where x = 1");
  });

  it("keeps one binding set for each emulated returning statement", () => {
    const compiled: any = knexInstance("t")
      .where("id", 5)
      .del()
      .returning("id")
      .toSQL();

    expect(compiled.bindings).to.deep.equal([5, 5]);
    expect(compiled._ibmiDeleteReturning.deleteBindingCount).to.equal(1);
    expect(compiled._ibmiDeleteReturning.whereBindingCount).to.equal(1);
  });

  it("keeps CTE bindings with the DELETE statement", () => {
    const compiled: any = knexInstance
      .with("x", (query) => query.select("*").from("s").where("z", 9))
      .from("t")
      .where("a", 1)
      .del()
      .returning("a")
      .toSQL();

    expect(compiled.bindings).to.deep.equal([9, 1, 1]);
    expect(compiled._ibmiDeleteReturning.deleteBindingCount).to.equal(2);
    expect(compiled._ibmiDeleteReturning.whereBindingCount).to.equal(1);
  });

  it("assigns raw returning bindings to the preliminary SELECT", () => {
    const compiled: any = knexInstance
      .with("x", (query) => query.select("*").from("s").where("z", 9))
      .from("t")
      .where("a", 1)
      .del()
      .returning(knexInstance.raw("? as marker", [7]))
      .toSQL();

    expect(compiled.bindings).to.deep.equal([9, 1, 7, 1]);
    expect(compiled._ibmiDeleteReturning.deleteBindingCount).to.equal(2);
    expect(compiled._ibmiDeleteReturning.whereBindingCount).to.equal(2);
  });

  it("compiles delete returning without where (full table)", () => {
    const q = knexInstance("t").del().returning(["id"]);
    testSql(q, "delete from t");
  });
});
