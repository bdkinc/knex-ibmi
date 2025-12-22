import { expect } from "chai";
import DB2Dialect from "../../src";

describe("Streaming", () => {
  let client: DB2Dialect;

  beforeEach(() => {
    client = new DB2Dialect({ client: "ibmi" });
  });

  describe("calculateOptimalFetchSize", () => {
    it("returns 500 for queries with JOINs", () => {
      // Access private method via any cast for testing
      const fetchSize = (client as any).calculateOptimalFetchSize(
        "SELECT * FROM users JOIN orders ON users.id = orders.user_id"
      );
      expect(fetchSize).to.equal(500);
    });

    it("returns 500 for queries with aggregates", () => {
      const fetchSize = (client as any).calculateOptimalFetchSize(
        "SELECT COUNT(*) FROM users"
      );
      expect(fetchSize).to.equal(500);
    });

    it("returns 500 for queries with ORDER BY", () => {
      const fetchSize = (client as any).calculateOptimalFetchSize(
        "SELECT * FROM users ORDER BY created_at"
      );
      expect(fetchSize).to.equal(500);
    });

    it("returns 500 for queries with GROUP BY", () => {
      const fetchSize = (client as any).calculateOptimalFetchSize(
        "SELECT status, COUNT(*) FROM orders GROUP BY status"
      );
      expect(fetchSize).to.equal(500);
    });

    it("returns 100 for simple queries", () => {
      const fetchSize = (client as any).calculateOptimalFetchSize(
        "SELECT * FROM users WHERE id = 1"
      );
      expect(fetchSize).to.equal(100);
    });

    it("returns 100 for basic SELECT queries", () => {
      const fetchSize = (client as any).calculateOptimalFetchSize(
        "SELECT id, name FROM products"
      );
      expect(fetchSize).to.equal(100);
    });

    it("handles case-insensitive detection of JOIN", () => {
      const fetchSize = (client as any).calculateOptimalFetchSize(
        "select * from users LEFT JOIN orders on users.id = orders.user_id"
      );
      expect(fetchSize).to.equal(500);
    });

    it("handles case-insensitive detection of aggregate functions", () => {
      const fetchSize = (client as any).calculateOptimalFetchSize(
        "select SUM(amount), AVG(quantity) from orders"
      );
      expect(fetchSize).to.equal(500);
    });
  });
});
