import Knex from "knex";
import { DB2Dialect } from "../../../src";
import { testSql } from "../../utils/testSql";

const knex = Knex({
  client: DB2Dialect,
});

describe('Select Statements', () =>
{
  it('supports basic select', () =>
  {
    const query = knex.select([ 'x', 'y' ]).from('test')
      .where('x', 1);

    testSql(query, 'select x, y from test where x = 1');
  });

  it('supports select with whereIn', () =>
  {
    const query = knex.select([ 'x', 'y' ]).from('test')
      .whereIn('x', [ 1, 2, 3 ]);

    testSql(query, 'select x, y from test where x in (1, 2, 3)');
  });

  it('supports select with whereNotIn', () =>
  {
    const query = knex.select([ 'x', 'y' ]).from('test')
      .whereNotIn('x', [ 1, 2, 3 ]);

    testSql(query, 'select x, y from test where x not in (1, 2, 3)');
  });

  it('supports select with whereNull', () =>
  {
    const query = knex.select([ 'x', 'y' ]).from('test')
      .whereNull('x');

    testSql(query, 'select x, y from test where x is null');
  });

  it('supports select with whereNotNull', () =>
  {
    const query = knex.select([ 'x', 'y' ]).from('test')
      .whereNotNull('x');

    testSql(query, 'select x, y from test where x is not null');
  });

  it('supports select with whereExists', () =>
  {
    const query = knex.select([ 'x', 'y' ]).from('test')
      .whereExists(knex.select([ 'x', 'y' ]).from('othertable')
        .where('x', 1));

    testSql(
      query,
      'select x, y from test where exists (select x, y from othertable where x = 1)'
    );
  });

  it('supports select with whereNotExists', () =>
  {
    const query = knex.select([ 'x', 'y' ]).from('test')
      .whereNotExists(knex.select([ 'x', 'y' ]).from('othertable')
        .where('x', 1));

    testSql(
      query,
      'select x, y from test where not exists (select x, y from othertable where x = 1)'
    );
  });

  it('supports select with whereRaw', () =>
  {
    const query = knex.select([ 'x', 'y' ]).from('test')
      .whereRaw('x = 1');

    testSql(query, 'select x, y from test where x = 1');
  });

  it('supports select with whereRaw and bindings', () =>
  {
    const query = knex.select([ 'x', 'y' ]).from('test')
      .whereRaw('x = ?', [ 1 ]);

    testSql(query, 'select x, y from test where x = 1');
  });

  it('supports select with .as()', () =>
  {
    const query = knex.avg('sum_column1')
      .from(function()
      {
        this.sum('column1 as sum_column1')
          .from('t1')
          .groupBy('column1')
          .as('t1');
      })
      .as('ignored_alias');

    testSql(
      query,
      'select avg(sum_column1) from (select sum(column1) as sum_column1 from t1 group by column1) as t1'
    );
  });

  it('supports select with as in string', () =>
  {
    const query = knex.select([ 'x as foo', 'y' ]).from('test');

    testSql(query, 'select x as foo, y from test');
  });

  it('supports select with a ref', () =>
  {
    const query = knex.select([ 'x', 'y' ]).from('test')
      .where('x', knex.ref('y'));

    testSql(query, 'select x, y from test where x = y');
  });

  it('supports select with a ref and a table', () =>
  {
    const query = knex.select([ 'x', 'y' ]).from('test')
      .where('x', knex.ref('y').withSchema('test'));

    testSql(query, 'select x, y from test where x = test.y');
  });

  it('supports select with a fromRaw', () =>
  {
    const query = knex.select([ 'x', 'y' ]).fromRaw('test');

    testSql(query, 'select x, y from test');
  });

  it('supports select with a fromRaw and bindings', () =>
  {
    const query = knex.select([ 'x', 'y' ]).fromRaw(knex.raw('test where x = ?', [ 1 ]));

    testSql(query, 'select x, y from test where x = 1');
  });

  it('supports a with clause', () =>
  {
    const query = knex.with('t', knex.select([ 'x', 'y' ]).from('test'))
      .select([ 'x', 'y' ])
      .from('t');

    testSql(query, 'with t as (select x, y from test) select x, y from t');
  });

  it('supports complex where clauses', () =>
  {
    const query = knex.select('*')
      .from('t')
      .where('t.x', 1)
      .where((q1) =>
      {
        q1.whereIn('t.y', [ 2, 3 ])
          .orWhere((q2) =>
          {
            q2.where('t.y', 4)
              .andWhere('t.z', 5);
          });
      });

    testSql(query, 'select * from t where t.x = 1 and (t.y in (2, 3) or (t.y = 4 and t.z = 5))');
  });
});
