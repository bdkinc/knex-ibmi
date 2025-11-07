import Knex from "knex";
import { expect } from "chai";
import { DB2Dialect } from "../../../src";
import { testSql } from "../../utils/testSql";

const knex = Knex({
  client: DB2Dialect,
});

describe("Regression Tests", () => {
  describe("WITH UR optimization hints", () => {
    it("should NOT add WITH UR to basic SELECT queries", () => {
      const query = knex.select('*').from('test');
      testSql(query, 'select * from test');
    });

    it("should NOT add WITH UR to SELECT queries with WHERE clauses", () => {
      const query = knex.select('*').from('test').where('id', 1);
      testSql(query, "select * from test where id = 1");
    });

    it("should NOT add WITH UR to subqueries in EXISTS clauses", () => {
      const query = knex.select('*').from('test').whereExists(
        knex.select('*').from('othertable').where('othertable.id', '=', knex.raw('test.id'))
      );
      testSql(query, 'select * from test where exists (select * from othertable where othertable.id = test.id)');
    });

    it("should NOT add WITH UR to subqueries in NOT EXISTS clauses", () => {
      const query = knex.select('*').from('test').whereNotExists(
        knex.select('*').from('othertable').where('othertable.id', '=', knex.raw('test.id'))
      );
      testSql(query, 'select * from test where not exists (select * from othertable where othertable.id = test.id)');
    });

    it("should NOT add WITH UR to subqueries in WHERE clauses", () => {
      const query = knex.select('*').from('test').where('id', '=',
        knex.select('id').from('othertable').where('name', 'John')
      );
      testSql(query, "select * from test where id = (select id from othertable where name = 'John')");
    });

    it("should NOT add WITH UR to CTEs (Common Table Expressions)", () => {
      const query = knex.with('t', knex.select('x', 'y').from('test')).select('x', 'y').from('t');
      testSql(query, 'with t as (select x, y from test) select x, y from t');
    });

    it("should NOT add WITH UR to complex nested queries", () => {
      const query = knex.select('*').from('t').where('t.x', 1).andWhere(function() {
        this.whereIn('t.y', [2, 3]).orWhere(function() {
          this.where('t.y', 4).andWhere('t.z', 5);
        });
      });
      testSql(query, 'select * from t where t.x = 1 and (t.y in (2, 3) or (t.y = 4 and t.z = 5))');
    });
  });

  describe("INSERT FINAL TABLE wrapping", () => {
    it("should wrap INSERT with FINAL TABLE and return IDENTITY_VAL_LOCAL()", () => {
      const query = knex.insert({x: 1, y: 2}).into('testtable');
      testSql(query, 'select IDENTITY_VAL_LOCAL() from FINAL TABLE(insert into testtable (x, y) values (1, 2))');
    });

    it("should wrap INSERT with quoted identifiers", () => {
      const query = knex.insert({'"x"': 1}).into('"testtable"');
      testSql(query, 'select IDENTITY_VAL_LOCAL() from FINAL TABLE(insert into "testtable" ("x") values (1))');
    });

    it("should handle INSERT with single column", () => {
      const query = knex.insert({name: 'test'}).into('users');
      testSql(query, "select IDENTITY_VAL_LOCAL() from FINAL TABLE(insert into users (name) values ('test'))");
    });
  });

  describe("UPDATE optimization hints", () => {
    it("should NOT add optimization hints to UPDATE queries", () => {
      const query = knex('test').update({x: 10, y: 20});
      testSql(query, 'update test set x = 10, y = 20');
    });

    it("should NOT add optimization hints to UPDATE with WHERE", () => {
      const query = knex('test').update({x: 10}).where('id', 1);
      testSql(query, 'update test set x = 10 where id = 1');
    });

    it("should NOT add optimization hints to UPDATE with subqueries", () => {
      const query = knex('test').update({x: 10, y: 20}).whereExists(
        knex.select('*').from('othertable').where('othertable.id', '=', knex.raw('test.id'))
      );
      testSql(query, 'update test set x = 10, y = 20 where exists (select * from othertable where othertable.id = test.id)');
    });
  });

  describe("DELETE optimization hints", () => {
    it("should NOT add optimization hints to DELETE queries", () => {
      const query = knex('test').del();
      testSql(query, 'delete from test');
    });

    it("should NOT add optimization hints to DELETE with WHERE", () => {
      const query = knex('test').del().where('id', 1);
      testSql(query, 'delete from test where id = 1');
    });

    it("should NOT add optimization hints to DELETE with subqueries", () => {
      const query = knex('test').del().whereExists(
        knex.select('*').from('othertable').where('othertable.id', '=', knex.raw('test.id'))
      );
      testSql(query, 'delete from test where exists (select * from othertable where othertable.id = test.id)');
    });
  });

  describe("UPDATE returning transaction-based approach", () => {
    it("should compile UPDATE returning with single column", () => {
      const query = knex('users').update({name: 'John'}).where('id', 1).returning('id');
      testSql(query, "update users set name = 'John' where id = 1");
    });

    it("should compile UPDATE returning with multiple columns", () => {
      const query = knex('users').update({name: 'John', email: 'john@example.com'}).where('id', 1).returning(['id', 'name']);
      testSql(query, "update users set name = 'John', email = 'john@example.com' where id = 1");
    });

    it("should compile UPDATE returning with complex WHERE clause", () => {
      const query = knex('users').update({status: 'active'}).where('age', '>', 18).andWhere('verified', true).returning(['id', 'status']);
      testSql(query, "update users set status = 'active' where age > 18 and verified = true");
    });

    it("should handle UPDATE returning with no WHERE clause", () => {
      const query = knex('settings').update({updated_at: knex.raw('NOW()')}).returning('id');
      testSql(query, "update settings set updated_at = NOW()");
    });

    it("should preserve metadata for execution", () => {
      const query = knex('users').update({name: 'John'}).where('id', 1).returning('id');
      const compiled = query.toSQL();

      // Check that execution metadata is preserved
      expect(compiled._ibmiUpdateReturning).to.be.an('object');
      expect(compiled._ibmiUpdateReturning.updateSql).to.equal("update users set name = ? where id = ?");
      expect(compiled._ibmiUpdateReturning.selectColumns).to.equal('id');
      expect(compiled._ibmiUpdateReturning.whereClause).to.equal('where id = ?');
      expect(compiled._ibmiUpdateReturning.tableName).to.equal('users');
    });
  });
});