## 0.5.0 - [Date TBD]

### 🚀 Performance Improvements
- **CRITICAL FIX**: Fixed double-pooling bug that created a new ODBC pool on every connection acquisition, causing memory leaks and performance degradation. Now uses Knex-managed pooling with simple ODBC connections.
- Optimized multi-row INSERTs: Plain INSERT statements (without FINAL TABLE) when RETURNING is not requested, significantly reducing network overhead for bulk inserts.
- Added optional per-connection prepared statement caching with LRU eviction to reduce parse overhead for repeated queries.
- Added smart connection string defaults: `BLOCKFETCH=1` and `TRUEAUTOCOMMIT=0` for better out-of-box performance.

### 🐛 Bug Fixes
- Fixed JSON/JSONB column types: Removed invalid CHECK constraints with hardcoded column names that caused DDL failures.
- Fixed TIMESTAMP WITH TIME ZONE: IBM i doesn't support it; now emits plain TIMESTAMP with warning when `useTz` is requested.
- Fixed CREATE TABLE ... LIKE syntax: Changed from SQL Server syntax to proper DB2 i syntax (`CREATE TABLE AS (...) WITH NO DATA`).
- Improved error logging: Use `safeStringify` everywhere to prevent circular reference errors.
- Enhanced error classification: Now uses ODBC SQLSTATE codes (08xxx for connection, HYT00/HYT01 for timeout, 42xxx for SQL errors) instead of just string matching.

### ✨ New Features
- Added `ibmi.preparedStatementCache` config option to enable optional statement caching (default: false).
- Added `ibmi.preparedStatementCacheSize` to control cache size per connection (default: 100).
- Added `ibmi.readUncommitted` config option to append `WITH UR` to SELECT queries for better read concurrency (default: false).
- Added UNIQUE constraint on migration table NAME column to prevent duplicate migrations in concurrent scenarios.

### 📚 Documentation
- New `AGENTS.md`: Comprehensive project context for AI assistants and developers.
- New `CLAUDE.md`: AI-specific development guide with IBM i DB2 quirks and common patterns.
- New `IMPROVEMENTS.md`: Detailed changelog of all performance and usability improvements.
- Updated README with new configuration options and performance tuning guide.

### ⚠️ Breaking Changes
- Multi-row INSERTs without `.returning()` now return `rowCount` instead of an array of rows for better performance.
  - **Migration**: If you need inserted values, explicitly use `.returning(['col1', 'col2'])`.

---

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
