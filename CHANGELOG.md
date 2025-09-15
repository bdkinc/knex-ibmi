## Unreleased - September 12th, 2025

- **BREAKING CHANGE**: Migration configuration change required for IBM i DB2 compatibility.
  - **SOLUTION**: Set `migrations: { disableTransactions: true }` in knex config.
  - **REASON**: IBM i DB2 implicitly commits transactions on DDL operations (like MySQL), causing connection closure and "table already exists" errors during migration setup.
- Fix: Case-insensitive `hasTable` check for IBM i. Use `UPPER(TABLE_NAME)`/`UPPER(TABLE_SCHEMA)` with parameter bindings to prevent false negatives that caused duplicate creation of `KNEX_MIGRATIONS` and `KNEX_MIGRATIONS_LOCK` tables.
- Fix: Proper error propagation.
	- Re-throw errors in statement execution so callers/tests receive rejections.
	- In streaming, reject and emit on cursor errors rather than only logging.
- Improvement: Remove `date-fns` and use native date formatting for `migration_time` with a local timestamp formatter (`yyyy-MM-dd HH:mm:ss`).
- Improvement: Safer null checks and tighter types.
	- Null-safe empty object detection in insert prep.
	- Default return for `_returning` to avoid undefined.
	- Narrow `columnizeWithPrefix` to `string | string[]`.
- Cleanup: Remove lodash `isObject` usage and simplify index options typing/handling in table compiler.
- Cleanup: Avoid `// @ts-expect-error` by using parameter placeholders and explicit casts where needed.
- Docs: Overhauled README.
	- ESM-first Quick Start with JSDoc typing, consistent config examples, and proper connection cleanup.
	- Expanded ODBC setup and Vite notes.

## 0.3.0 - February 9th, 2025
- add streaming support

## 0.0.5 - July 23rd, 2023
- add unique and dropUnique methods

## 0.0.4 - July 21st, 2023
- remove unnecessary compiler methods

## 0.0.3 - July 19th, 2023
- add transaction support

## 0.0.2 - July 15th, 2023
- update readme and code examples

## 0.0.1 - July 14th, 2023
- Imported DB2 Dialect and re-wrote
