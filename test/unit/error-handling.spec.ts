import { expect } from "chai";
import DB2Dialect from "../../src";

describe("ODBC Error Handling", () => {
  let client: DB2Dialect;

  beforeEach(() => {
    client = new DB2Dialect({ client: "ibmi" });
  });

  describe("Error Classification", () => {
    describe("isConnectionError", () => {
      it("detects SQLSTATE 08001 (connection exception)", () => {
        const error = {
          odbcErrors: [{ state: "08001", message: "Unable to connect" }],
          message: "Connection failed",
        };
        expect((client as any).isConnectionError(error)).to.be.true;
      });

      it("detects SQLSTATE 08003 (connection does not exist)", () => {
        const error = {
          odbcErrors: [{ state: "08003", message: "Connection not open" }],
          message: "Connection error",
        };
        expect((client as any).isConnectionError(error)).to.be.true;
      });

      it("detects SQLSTATE 08S01 (communication link failure)", () => {
        const error = {
          odbcErrors: [{ state: "08S01", message: "Communication link failure" }],
          message: "Link failed",
        };
        expect((client as any).isConnectionError(error)).to.be.true;
      });

      it("detects SQLSTATE 40003 (transaction rollback)", () => {
        const error = {
          odbcErrors: [{ state: "40003", message: "Statement completion unknown" }],
          message: "Transaction rollback",
        };
        expect((client as any).isConnectionError(error)).to.be.true;
      });

      it("detects connection errors from message text", () => {
        const error = { message: "connection closed unexpectedly" };
        expect((client as any).isConnectionError(error)).to.be.true;
      });

      it("returns false for non-connection errors", () => {
        const error = {
          odbcErrors: [{ state: "42S02", message: "Table not found" }],
          message: "SQL error",
        };
        expect((client as any).isConnectionError(error)).to.be.false;
      });
    });

    describe("isTimeoutError", () => {
      it("detects SQLSTATE HYT00 (timeout expired)", () => {
        const error = {
          odbcErrors: [{ state: "HYT00", message: "Timeout expired" }],
          message: "Query timeout",
        };
        expect((client as any).isTimeoutError(error)).to.be.true;
      });

      it("detects SQLSTATE HYT01 (connection timeout)", () => {
        const error = {
          odbcErrors: [{ state: "HYT01", message: "Connection timeout" }],
          message: "Timeout",
        };
        expect((client as any).isTimeoutError(error)).to.be.true;
      });

      it("detects timeout from message text", () => {
        const error = { message: "query timed out after 30 seconds" };
        expect((client as any).isTimeoutError(error)).to.be.true;
      });

      it("returns false for non-timeout errors", () => {
        const error = {
          odbcErrors: [{ state: "42000", message: "Syntax error" }],
          message: "SQL error",
        };
        expect((client as any).isTimeoutError(error)).to.be.false;
      });
    });

    describe("isSQLError", () => {
      it("detects SQLSTATE 42xxx (syntax error)", () => {
        const error = {
          odbcErrors: [{ state: "42S02", message: "Table not found" }],
          message: "SQL error",
        };
        expect((client as any).isSQLError(error)).to.be.true;
      });

      it("detects SQLSTATE 22xxx (data exception)", () => {
        const error = {
          odbcErrors: [{ state: "22001", message: "String data right truncation" }],
          message: "Data error",
        };
        expect((client as any).isSQLError(error)).to.be.true;
      });

      it("detects SQLSTATE 23xxx (integrity constraint)", () => {
        const error = {
          odbcErrors: [{ state: "23000", message: "Integrity constraint violation" }],
          message: "Constraint violation",
        };
        expect((client as any).isSQLError(error)).to.be.true;
      });

      it("detects SQLSTATE 21xxx (cardinality violation)", () => {
        const error = {
          odbcErrors: [{ state: "21000", message: "Cardinality violation" }],
          message: "SQL error",
        };
        expect((client as any).isSQLError(error)).to.be.true;
      });

      it("returns false for non-SQL errors", () => {
        const error = {
          odbcErrors: [{ state: "08001", message: "Connection failed" }],
          message: "Connection error",
        };
        expect((client as any).isSQLError(error)).to.be.false;
      });
    });

    describe("isNoDataError", () => {
      it("detects SQLSTATE 02000 in message", () => {
        const error = { message: "SQLSTATE 02000: No data found" };
        expect((client as any).isNoDataError(error)).to.be.true;
      });

      it("detects 'no data' text in message", () => {
        const error = { message: "no data was returned by the query" };
        expect((client as any).isNoDataError(error)).to.be.true;
      });

      it("detects 'no rows' text in message", () => {
        const error = { message: "no rows were affected" };
        expect((client as any).isNoDataError(error)).to.be.true;
      });

      it("detects '0 rows' text in message", () => {
        const error = { message: "0 rows updated" };
        expect((client as any).isNoDataError(error)).to.be.true;
      });

      it("returns false for null/undefined error", () => {
        expect((client as any).isNoDataError(null)).to.be.false;
        expect((client as any).isNoDataError(undefined)).to.be.false;
      });

      it("returns false for other errors", () => {
        const error = { message: "something went wrong" };
        expect((client as any).isNoDataError(error)).to.be.false;
      });
    });

    describe("getSQLState", () => {
      it("extracts SQLSTATE from odbcErrors array", () => {
        const error = {
          odbcErrors: [{ state: "42S02", message: "Table not found" }],
        };
        expect((client as any).getSQLState(error)).to.equal("42S02");
      });

      it("extracts SQLSTATE from SQLSTATE property", () => {
        const error = {
          odbcErrors: [{ SQLSTATE: "22001", message: "Truncation" }],
        };
        expect((client as any).getSQLState(error)).to.equal("22001");
      });

      it("returns null when no odbcErrors", () => {
        const error = { message: "Generic error" };
        expect((client as any).getSQLState(error)).to.be.null;
      });

      it("returns null for empty odbcErrors array", () => {
        const error = { odbcErrors: [] };
        expect((client as any).getSQLState(error)).to.be.null;
      });
    });
  });

  describe("Error Wrapping", () => {
    it("wraps connection errors with context", () => {
      const error = {
        message: "connection closed",
        odbcErrors: [{ state: "08003" }],
      };
      const queryObject = { sql: "SELECT * FROM users WHERE id = ?" };

      const wrapped = (client as any).wrapError(error, "select", queryObject);

      expect(wrapped.message).to.include("IBM i DB2 connection error");
      expect(wrapped.message).to.include("select");
      expect(wrapped.message).to.include("Context:");
    });

    it("wraps timeout errors with context", () => {
      const error = {
        message: "query timed out",
        odbcErrors: [{ state: "HYT00" }],
      };
      const queryObject = { sql: "SELECT * FROM large_table" };

      const wrapped = (client as any).wrapError(error, "select", queryObject);

      expect(wrapped.message).to.include("IBM i DB2 timeout");
      expect(wrapped.message).to.include("select");
    });

    it("wraps SQL errors with context", () => {
      const error = {
        message: "table not found",
        odbcErrors: [{ state: "42S02" }],
      };
      const queryObject = { sql: "SELECT * FROM nonexistent" };

      const wrapped = (client as any).wrapError(error, "select", queryObject);

      expect(wrapped.message).to.include("IBM i DB2 SQL error");
      expect(wrapped.message).to.include("select");
    });

    it("wraps generic errors with context", () => {
      const error = { message: "unknown error" };
      const queryObject = { sql: "SELECT 1" };

      const wrapped = (client as any).wrapError(error, "select", queryObject);

      expect(wrapped.message).to.include("IBM i DB2 error");
      expect(wrapped.message).to.include("select");
      expect(wrapped.message).to.include("Context:");
    });

    it("truncates long SQL in context", () => {
      const longSql = "SELECT " + "a, ".repeat(100) + "b FROM table";
      const error = { message: "error" };
      const queryObject = { sql: longSql };

      const wrapped = (client as any).wrapError(error, "select", queryObject);

      expect(wrapped.message).to.include("...");
    });
  });

  describe("shouldRetryQuery", () => {
    it("returns true for systables queries", () => {
      const queryObject = { sql: "SELECT * FROM QSYS2.SYSTABLES WHERE ..." };
      expect((client as any).shouldRetryQuery(queryObject, "select")).to.be.true;
    });

    it("returns true for knex_migrations queries", () => {
      const queryObject = { sql: "SELECT * FROM KNEX_MIGRATIONS" };
      expect((client as any).shouldRetryQuery(queryObject, "select")).to.be.true;
    });

    it("returns false for regular queries", () => {
      const queryObject = { sql: "SELECT * FROM users" };
      expect((client as any).shouldRetryQuery(queryObject, "select")).to.be.false;
    });
  });
});
