import { expect } from "chai";

export const testSql = (
  query: any,
  expectedSql: unknown,
  expectedBindings?: unknown,
) => {
  expect(query.toString()).to.equal(expectedSql);

  if (expectedBindings) {
    expect(query.toSQL().bindings).to.deep.equal(expectedBindings);
  }
};
