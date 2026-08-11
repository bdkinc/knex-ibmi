# @bdkinc/knex-ibmi

[![npm version](http://img.shields.io/npm/v/@bdkinc/knex-ibmi.svg)](https://npmjs.org/package/@bdkinc/knex-ibmi)

A [Knex.js](https://knexjs.org/) dialect for DB2 on IBM i, built on the IBM-supported [`odbc`](https://github.com/IBM/node-odbc) driver. Tested against the IBM i Access ODBC driver.

For general IBM i + Node.js background, see the [IBM i OSS docs](https://ibmi-oss-docs.readthedocs.io/).

Found an issue or have a question? Please [open an issue](https://github.com/bdkinc/knex-ibmi/issues).

## Features

- Query building and execution against DB2 for IBM i over ODBC
- Transactions
- Streaming (Node stream piping and async iteration)
- Multi-row insert strategies (`auto` | `sequential` | `disabled`)
- Emulated `RETURNING` behavior for `INSERT`, `UPDATE`, and `DELETE`
- Built-in migration runner designed around IBM i's DDL auto-commit behavior

## Prerequisites

Before installing, confirm:

- [ ] Node.js **>= 20**
- [ ] Network access to an IBM i host (or `*LOCAL` if running on the IBM i IFS)
- [ ] The **IBM i Access ODBC Driver** (or equivalent) installed and registered with your platform's ODBC driver manager
- [ ] A valid IBM i user profile with access to the target schema/library

If you haven't installed or configured the ODBC driver yet, do that first — see [ODBC Driver Setup](#odbc-driver-setup) below and the [IBM i OSS ODBC guide](https://ibmi-oss-docs.readthedocs.io/en/latest/odbc/README.html).

## Installation

```bash
npm install @bdkinc/knex-ibmi knex odbc
```

This package declares `knex` `^3.3.0` and `odbc` `^2.5.0` as runtime dependencies. Installing them explicitly is optional, but it can be useful when your application wants to control their versions directly.

## Quick Start

The example below is TypeScript. For ESM JavaScript, remove the `DB2Config` type import and the `: DB2Config` annotation.

```ts
import knex from "knex";
import { DB2Dialect } from "@bdkinc/knex-ibmi";
import type { DB2Config } from "@bdkinc/knex-ibmi";

const config: DB2Config = {
  client: DB2Dialect,
  connection: {
    host: process.env.IBMI_HOST || "your-ibm-i-host",
    database: "*LOCAL",
    user: process.env.IBMI_USER || "your-username",
    password: process.env.IBMI_PASSWORD || "your-password",
    driver: "IBM i Access ODBC Driver",
    connectionStringParams: { DBQ: process.env.IBMI_LIBRARY || "MYLIB" },
  },
  pool: { min: 2, max: 10 },
};

const db = knex(config);

try {
  const results = await db.select("*").from("MYTABLE").where({ STATUS: "A" });
  console.log(results);
} catch (error) {
  console.error("Database error:", error);
} finally {
  await db.destroy();
}
```

### Module formats

The connection config shape is the same in CommonJS, ESM, and TypeScript. The imports and TypeScript annotation differ:

```js
// CommonJS
const knex = require("knex");
const { DB2Dialect } = require("@bdkinc/knex-ibmi");
```

```js
// ESM
import knex from "knex";
import { DB2Dialect } from "@bdkinc/knex-ibmi";
```

```ts
// TypeScript (adds the DB2Config type for config validation)
import knex from "knex";
import { DB2Dialect } from "@bdkinc/knex-ibmi";
import type { DB2Config } from "@bdkinc/knex-ibmi";
```

Use the connection configuration shown in [Quick Start](#quick-start), then call `db.destroy()` when your program exits.

## Identifiers

IBM i DB2 is case-insensitive by default when identifiers are unquoted (unquoted names are folded to uppercase internally). To preserve this behavior, `knex-ibmi` does **not** automatically wrap table or column identifiers in quotes the way most Knex dialects do.

- For ordinary unquoted identifiers, you can write `.where({ status: "A" })` or `.where({ STATUS: "A" })` interchangeably against the same column.
- Mixed-case and other case-sensitive identifiers are supported. Include SQL double quotes in the identifier passed to Knex; for object keys, put the quoted identifier in the key:

  ```ts
  const rows = await db('"MyTable"')
    .select('"recordId"', '"displayName"')
    .where({ '"recordId"': 42 });
  ```

  This generates identifiers such as `"MyTable"` and `"recordId"`, preserving their case on IBM i DB2.

- The built-in migration runner defaults to `KNEX_MIGRATIONS`. The dialect also normalizes the standard `KNEX_MIGRATIONS` / `knex_migrations` names to uppercase; arbitrary custom table names are preserved.

## Streaming

Use `.stream({ fetchSize })` to control how many rows are fetched from the driver per batch. The dialect auto-tunes `fetchSize` based on query complexity if you don't provide one.

**Async iteration** is the simplest and recommended approach:

```ts
// Reuse the `db` instance from Quick Start.
try {
  const stream = await db("LARGETABLE").select("*").stream({ fetchSize: 200 });
  for await (const row of stream) {
    console.log("row id=", row.ID);
  }
} finally {
  await db.destroy();
}
```

If you need a `Transform` stage, use `pipeline()` from `node:stream/promises` rather than `.pipe()` followed by `finished(source)` — `pipeline` propagates errors and closes every stream in the chain for you, and calling `finished()` on the _source_ after you've already piped it elsewhere can resolve/reject incorrectly:

```ts
import { pipeline } from "node:stream/promises";
import { Transform } from "node:stream";

try {
  const stream = await db("LARGETABLE").select("*").stream({ fetchSize: 100 });

  const transform = new Transform({
    objectMode: true,
    transform(row, _enc, cb) {
      console.log("transforming row id=", row.ID);
      cb(null, row);
    },
  });

  await pipeline(stream, transform, async function drain(source) {
    for await (const _row of source) {
      // rows already handled in the transform above
    }
  });
} finally {
  await db.destroy();
}
```

## ODBC Driver Setup

If you don't know the name of your installed driver, check `odbcinst.ini`. Find its path with:

```bash
odbcinst -j
```

Example entries:

```ini
[IBM i Access ODBC Driver]
Description=IBM i Access for Linux ODBC Driver
Driver=/opt/ibm/iaccess/lib/libcwbodbc.so
Setup=/opt/ibm/iaccess/lib/libcwbodbcs.so
Driver64=/opt/ibm/iaccess/lib64/libcwbodbc.so
Setup64=/opt/ibm/iaccess/lib64/libcwbodbcs.so
Threading=0
DontDLClose=1
UsageCount=1

[IBM i Access ODBC Driver 64-bit]
Description=IBM i Access for Linux 64-bit ODBC Driver
Driver=/opt/ibm/iaccess/lib64/libcwbodbc.so
Setup=/opt/ibm/iaccess/lib64/libcwbodbcs.so
Threading=0
DontDLClose=1
UsageCount=1
```

If unixODBC is looking in the wrong config directory (e.g., your configs live in `/etc` but it expects elsewhere), point it explicitly:

```bash
export ODBCINI=/etc
export ODBCSYSINI=/etc
```

## Bundling

`odbc` is a native Node.js addon, and `knex-ibmi` is intended to run server-side only — it cannot run in a browser. If you build this package (or an app that uses it) with a bundler targeting Node.js (webpack, esbuild, Vite in SSR/Node mode, etc.), mark `odbc` and `knex` as **external** dependencies rather than bundling them, so the native binary is loaded from `node_modules` at runtime instead of being inlined.

## Migrations

⚠️ **Important**: Standard Knex migrations are not reliable on IBM i DB2 because DDL auto-commits and Knex's locking approach can conflict with IBM i behavior. Use the built-in IBM i migration runner instead.

### Programmatic API

Create the runner after creating `db` and before your application's final `db.destroy()` call:

```ts
import { createIBMiMigrationRunner } from "@bdkinc/knex-ibmi";

const migrationRunner = createIBMiMigrationRunner(db, {
  directory: "./migrations",
  tableName: "KNEX_MIGRATIONS",
  schemaName: "MYSCHEMA", // optional
});

await migrationRunner.latest(); // run pending migrations
// await migrationRunner.rollback(); // run separately when intentionally rolling back
const pending = await migrationRunner.listPending();
const executed = await migrationRunner.listExecuted();

await db.destroy();
```

> **Rollback note:** if a migration has no `down` export, `rollback()` skips executing a rollback callback for it but still deletes its row from the migration tracking table — the migration will be considered "not applied" even though its `up` changes were never reverted. Write a `down` for every migration you expect to roll back safely.

### CLI

The package ships a CLI binary, `ibmi-migrations`. It uses `./knexfile.js` by default; pass `--knexfile ./knexfile.ts` or another path when needed:

```bash
npx ibmi-migrations migrate:make create_users_table   # scaffold a migration
npx ibmi-migrations migrate:latest                     # run pending migrations
npx ibmi-migrations migrate:status                      # show status
```

Minimal ESM `knexfile.js` (use a `.mjs` extension or set `"type": "module"` in `package.json`):

```js
import { DB2Dialect } from "@bdkinc/knex-ibmi";

export default {
  development: {
    client: DB2Dialect,
    connection: {
      host: process.env.IBMI_HOST,
      database: "*LOCAL",
      user: process.env.IBMI_USER,
      password: process.env.IBMI_PASSWORD,
      driver: "IBM i Access ODBC Driver",
      connectionStringParams: { DBQ: process.env.IBMI_LIBRARY },
    },
    migrations: {
      directory: "./migrations",
      tableName: "KNEX_MIGRATIONS",
    },
  },
};
```

TypeScript knexfiles/migrations (`.ts`) require a TypeScript-capable loader. For example:

```bash
node --import tsx ./node_modules/@bdkinc/knex-ibmi/dist/cli.cjs migrate:latest --knexfile ./knexfile.ts
```

Alternatively, set `NODE_OPTIONS=--import=tsx` when invoking `npx ibmi-migrations`, or precompile the files to JavaScript.

📖 See **[MIGRATIONS.md](./MIGRATIONS.md)** for the full CLI command reference, TypeScript workflow, configuration options, and troubleshooting.

### Alternative: standard Knex migrations with transactions disabled

If you must use Knex's own migration system, disable transactions to avoid hangs on IBM i's auto-commit DDL:

```ts
const config: DB2Config = {
  client: DB2Dialect,
  connection: {
    /* ... */
  },
  migrations: {
    disableTransactions: true, // required for IBM i
    directory: "./migrations",
    tableName: "knex_migrations",
  },
};
```

This is not the recommended path — standard Knex migrations can still hang on lock operations that don't behave as expected against IBM i. Prefer the built-in runner above. Because DDL auto-commits on IBM i, schema changes are not transactionally reversible even when the migration framework reports a transaction boundary.

## Multi-Row Insert Strategies

Configure via `ibmi.multiRowInsert` in the knex config:

```ts
const db = knex({
  client: DB2Dialect,
  connection: {
    /* ... */
  },
  ibmi: { multiRowInsert: "auto" }, // 'auto' | 'sequential' | 'disabled'
});
```

- **`auto`** (default): Generates a single multi-row `INSERT ... VALUES (...), (...), ...` statement.
  - Without `.returning(...)`: executes as plain DML and provides **no guaranteed generated identities**. The returned value is the dialect's processed ODBC result, not a guaranteed affected-row count.
  - With `.returning(...)`: the statement is wrapped as `SELECT ... FROM FINAL TABLE(INSERT ...)` to surface the inserted rows. Whether `FINAL TABLE` works correctly for multi-row inserts depends on your IBM i release and ODBC driver support — test this against your target system before relying on it in production.
- **`sequential`**: Inserts each row individually, in a loop, on the same connection. Because each insert runs on its own, the driver can reliably return per-row values (including generated identities) for every row. Use this when you need dependable identity values across multiple rows.
  - Set `ibmi.sequentialInsertTransactional: true` to wrap the loop in a driver-level transaction using the `odbc` package's `beginTransaction()` / `commit()` / `rollback()` APIs. The target tables must be journaled, and the connection must use a commitment-control level such as `CMT: 1`–`4`; `CMT: 0` disables commitment control. Exact semantics depend on the selected CMT level and your IBM i configuration.
- **`disabled`**: Only the **first row** of a multi-row insert array is inserted; the rest are silently ignored. Provided for legacy compatibility only — avoid this unless you specifically need the old single-row behavior.

If you call `.returning(['COL1', 'COL2'])`, those columns are selected explicitly; otherwise `IDENTITY_VAL_LOCAL()` (single-row) or `*` (multi-row, `auto` strategy) is used as a fallback.

## Returning Behavior (INSERT / UPDATE / DELETE)

IBM i DB2 does not support native `RETURNING` over ODBC. `knex-ibmi` emulates it, with these caveats:

### INSERT

See [Multi-Row Insert Strategies](#multi-row-insert-strategies) above — behavior differs by strategy and by whether `.returning(...)` is used.

### UPDATE

`.returning(...)` on an `UPDATE` runs as **two separate statements**: the `UPDATE`, followed by a `SELECT` using the _same_ `WHERE` clause to fetch the resulting rows.

⚠️ **Race condition**: between the `UPDATE` and the follow-up `SELECT`, another connection could insert, update, or delete rows matching that `WHERE` clause. The rows returned may not exactly reflect what your `UPDATE` changed. For strict consistency:

- Use a serializable (or otherwise sufficiently isolated) transaction around the update, or
- Implement optimistic locking (e.g., a version/timestamp column checked in the `WHERE` clause), or
- Skip `.returning()` on `UPDATE` and fetch the data you need in a separate, deliberate query.

### DELETE

`.returning(...)` on a `DELETE` runs as **two separate statements**: a `SELECT` (using the requested columns or `*`) to capture the rows first, followed by the `DELETE`.

⚠️ Because this emulation is not atomic — it's a `SELECT` followed by a `DELETE`, not a single statement — concurrent writers can change the matching rows between statements. Use suitable transaction isolation and journaled tables when you need stronger consistency, and use an explicit predicate or locking strategy appropriate to your workload.

### General guidance

- `.returning('*')` can be expensive on large result sets; request only the columns you need.
- See [Multi-Row Insert Strategies](#multi-row-insert-strategies) when you need reliable, ordered identity values across many inserted rows.

## Configuration Reference

Attach these options under the root knex config as `ibmi`:

```ts
interface IbmiDialectConfig {
  multiRowInsert?: "auto" | "sequential" | "disabled"; // default: "auto"
  sequentialInsertTransactional?: boolean; // default: false — wrap sequential inserts in a driver transaction
  preparedStatementCache?: boolean; // default: false — enable per-connection prepared statement caching
  preparedStatementCacheSize?: number; // default: 100 — max cached statements per connection
  readUncommitted?: boolean; // default: false — append WITH UR to compiled SELECT queries
  normalizeBigintToString?: boolean; // default: true — stringify BigInt values in results
}
```

```ts
const db = knex({
  client: DB2Dialect,
  connection: {
    /* ... */
  },
  ibmi: {
    multiRowInsert: "auto",
    preparedStatementCache: true,
    preparedStatementCacheSize: 100,
    readUncommitted: false,
    normalizeBigintToString: true,
  },
});
```

### `normalizeBigintToString`

The `odbc` driver can return `BigInt` values for large integer columns. `JSON.stringify()` throws on `BigInt`, which breaks common patterns like returning query results directly from an HTTP handler. `normalizeBigintToString` is **`true` by default** and recursively converts any `BigInt` found in query results (and cursor/stream rows) to a `string`. Set it to `false` only if your application handles `BigInt` values itself and you want to preserve the native type.

### Prepared statement caching

Enable `preparedStatementCache` to reduce prepare overhead for repeated statements that use the prepared-statement execution path, such as `INSERT`, `UPDATE`, and `DELETE`. Ordinary `SELECT` queries use the driver's direct query path and are not cached.

```ts
ibmi: {
  preparedStatementCache: true,
  preparedStatementCacheSize: 100, // per connection
}
```

When enabled, the dialect keeps a per-connection LRU cache of prepared ODBC statements, keyed by SQL text. Statements are closed automatically when evicted from the cache or when their connection is destroyed.

### Read uncommitted isolation

```ts
ibmi: {
  readUncommitted: true,
}
```

This appends `WITH UR` to **compiled `SELECT` queries** produced by the query compiler (i.e., ordinary `.select()`/`.first()`/`.pluck()` calls). It does not apply to `INSERT`/`UPDATE`/`DELETE` statements, nor to the internal `SELECT` statements used to emulate `.returning()` on `UPDATE`/`DELETE`. `WITH UR` allows reads to proceed without waiting on locks, at the cost of **dirty reads** — you may see uncommitted data from other in-flight transactions. Only enable this if your application can tolerate that.

## Links

- Knex: https://knexjs.org/
- Knex repo: https://github.com/knex/knex
- ODBC driver: https://github.com/IBM/node-odbc
- IBM i OSS docs: https://ibmi-oss-docs.readthedocs.io/
- Migration system details: [MIGRATIONS.md](./MIGRATIONS.md)
