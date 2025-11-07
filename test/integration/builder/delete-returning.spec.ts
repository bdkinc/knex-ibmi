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

  it("compiles delete returning without where (full table)", () => {
    const q = knexInstance("t").del().returning(["id"]);
    testSql(q, "delete from t");
  });
});
