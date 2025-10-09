# @bdkinc/knex-ibmi

[![npm version](http://img.shields.io/npm/v/@bdkinc/knex-ibmi.svg)](https://npmjs.org/package/@bdkinc/knex-ibmi)

Knex.js dialect for DB2 on IBM i (via ODBC). Built for usage with the official IBM i Access ODBC driver and tested on IBM i.

For IBM i OSS docs, see https://ibmi-oss-docs.readthedocs.io/. ODBC guidance: https://ibmi-oss-docs.readthedocs.io/en/latest/odbc/README.html.

> Found an issue or have a question? Please open an issue.

## Features

- Query building
- Query execution
- Transactions
- Streaming
- Multi-row insert strategies (auto | sequential | disabled)
- Emulated returning for UPDATE and DELETE

## Requirements

- Node.js >= 16
- ODBC driver (IBM i Access ODBC Driver)

## Installation

```bash
npm install @bdkinc/knex-ibmi knex odbc
```

## Quick Start

```js
import knex from "knex";
import { DB2Dialect } from "@bdkinc/knex-ibmi";

/** @type {import("@bdkinc/knex-ibmi").DB2Config} */
const config = {
  client: DB2Dialect,
  connection: {
    host: "your-ibm-i-host",
    database: "*LOCAL",
    user: "your-username",
    password: "your-password",
    driver: "IBM i Access ODBC Driver",
    connectionStringParams: { DBQ: "MYLIB" },
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

## Usage

This package can be used with CommonJS, ESM, or TypeScript.

### CommonJS

```js
const knex = require("knex");
const { DB2Dialect } = require("@bdkinc/knex-ibmi");

const db = knex({
  client: DB2Dialect,
  connection: {
    host: "your-ibm-i-host",
    database: "*LOCAL",
    user: "your-username",
    password: "your-password",
    driver: "IBM i Access ODBC Driver",
    connectionStringParams: { 
      ALLOWPROCCALLS: 1, 
      CMT: 0, 
      DBQ: "MYLIB" 
    },
  },
  pool: { min: 2, max: 10 },
});

// Example query
db.select("*")
  .from("MYTABLE")
  .where({ STATUS: "A" })
  .then(results => console.log(results))
  .catch(error => console.error("Database error:", error))
  .finally(() => db.destroy());
```

### ESM

```js
import knex from "knex";
import { DB2Dialect } from "@bdkinc/knex-ibmi";

/** @type {import("@bdkinc/knex-ibmi").DB2Config} */
const config = {
  client: DB2Dialect,
  connection: {
    host: "your-ibm-i-host",
    database: "*LOCAL",
    user: "your-username",
    password: "your-password",
    driver: "IBM i Access ODBC Driver",
    connectionStringParams: { 
      ALLOWPROCCALLS: 1, 
      CMT: 0, 
      DBQ: "MYLIB" 
    },
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

### TypeScript

```ts
import { knex } from "knex";
import { DB2Dialect, DB2Config } from "@bdkinc/knex-ibmi";

const config: DB2Config = {
  client: DB2Dialect,
  connection: {
    host: "your-ibm-i-host",
    database: "*LOCAL",
    user: "your-username",
    password: "your-password",
    driver: "IBM i Access ODBC Driver",
    connectionStringParams: { 
      ALLOWPROCCALLS: 1, 
      CMT: 0, 
      DBQ: "MYLIB" 
    },
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

### Streaming

There are two primary ways to consume a result stream: (1) classic Node stream piping with transform stages, and (2) async iteration with `for await` (which can be easier to reason about). Use a `fetchSize` to control how many rows are fetched from the driver per batch.

```ts
import { knex } from "knex";
import { DB2Dialect, DB2Config } from "@bdkinc/knex-ibmi";
import { Transform } from "node:stream";
import { finished } from "node:stream/promises";

const config: DB2Config = { /* ...same as earlier examples... */ };
const db = knex(config);

try {
  const stream = await db("LARGETABLE").select("*").stream({ fetchSize: 100 });

  // Approach 1: Pipe through a Transform stream
  const transform = new Transform({
    objectMode: true,
    transform(row, _enc, cb) {
      // Process each row (side effects, enrichment, filtering, etc.)
      console.log("Transforming row id=", row.ID);
      cb(null, row);
    },
  });
  stream.pipe(transform);
  await finished(stream); // Wait until piping completes

  // Approach 2: Async iteration (recommended for simplicity)
  const iterStream = await db("LARGETABLE").select("*").stream({ fetchSize: 200 });
  for await (const row of iterStream) {
    console.log("Iter row id=", row.ID);
  }
} catch (error) {
  console.error("Streaming error:", error);
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

```
[IBM i Access ODBC Driver]  # driver name in square brackets
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

If unixODBC is using the wrong config directory (e.g., your configs are in `/etc` but it expects elsewhere), set:

```bash
export ODBCINI=/etc
export ODBCSYSINI=/etc
```

## Bundling with Vite

If you bundle with Vite, exclude certain native deps during optimize step:

```js
// vite.config.js
export default {
  optimizeDeps: {
    exclude: ["@mapbox"],
  },
};
```

## Migrations

⚠️ **Important**: Standard Knex migrations don't work reliably with IBM i DB2 due to auto-commit DDL operations and locking issues.

### Recommended: Use Built-in IBM i Migration System

The knex-ibmi library includes a custom migration system that bypasses Knex's problematic locking mechanism:

```js
import { createIBMiMigrationRunner } from "@bdkinc/knex-ibmi";

const migrationRunner = createIBMiMigrationRunner(db, {
  directory: "./migrations",
  tableName: "KNEX_MIGRATIONS", 
  schemaName: "MYSCHEMA"
});

// Run migrations
await migrationRunner.latest();

// Rollback
await migrationRunner.rollback();

// Check status
const pending = await migrationRunner.listPending();
```

**CLI Usage:** The package includes a built-in CLI that can be used via npm scripts or npx:

```bash
# Install globally (optional)
npm install -g @bdkinc/knex-ibmi

# Or use via npx (recommended)
npx ibmi-migrations migrate:latest    # Run pending migrations
npx ibmi-migrations migrate:rollback  # Rollback last batch
npx ibmi-migrations migrate:status    # Show migration status
npx ibmi-migrations migrate:make create_users_table        # Create new JS migration
npx ibmi-migrations migrate:make add_email_column -x ts    # Create new TS migration

# Or add to your package.json scripts:
{
  "scripts": {
    "migrate:latest": "ibmi-migrations migrate:latest",
    "migrate:rollback": "ibmi-migrations migrate:rollback",
    "migrate:status": "ibmi-migrations migrate:status",
    "migrate:make": "ibmi-migrations migrate:make"
  }
}

# Then run with npm:
npm run migrate:latest
npm run migrate:status
```

**Full CLI API (similar to Knex):**
```bash
ibmi-migrations migrate:latest         # Run all pending migrations
ibmi-migrations migrate:rollback       # Rollback last migration batch  
ibmi-migrations migrate:status         # Show detailed migration status
ibmi-migrations migrate:currentVersion # Show current migration version
ibmi-migrations migrate:list           # List all migrations
ibmi-migrations migrate:make <name>    # Create new migration file

# Options:
ibmi-migrations migrate:status --env production
ibmi-migrations migrate:latest --knexfile ./config/knexfile.js
ibmi-migrations migrate:latest --knexfile ./knexfile.ts        # Use TypeScript knexfile
ibmi-migrations migrate:make create_users_table
ibmi-migrations migrate:make add_email_column -x ts            # TypeScript migration
```

📖 **See [MIGRATIONS.md](./MIGRATIONS.md) for complete documentation**

### Alternative: Standard Knex with Transactions Disabled

If you must use standard Knex migrations, disable transactions to avoid issues:

```js
/** @type {import("@bdkinc/knex-ibmi").DB2Config} */
const config = {
  client: DB2Dialect,
  connection: { /* your connection config */ },
  migrations: {
    disableTransactions: true, // Required for IBM i
    directory: './migrations',
    tableName: 'knex_migrations',
  },
};
```

**Warning**: Standard Knex migrations may still hang on lock operations. The built-in IBM i migration system is strongly recommended.

## Multi-Row Insert Strategies

Configure via `ibmi.multiRowInsert` in the knex config:

```ts
const db = knex({
  client: DB2Dialect,
  connection: { /* ... */ },
  ibmi: { multiRowInsert: 'auto' } // 'auto' | 'sequential' | 'disabled'
});
```

- `auto` (default): Generates a single INSERT with multiple VALUES lists. For `.returning('*')` or no explicit column list it returns all inserted rows (lenient fallback). Identity values are whatever DB2 ODBC surfaces for that multi-row statement.
- `sequential`: Compiler shows a single-row statement (first row) but at execution time each row is inserted individually inside a loop to reliably collect identity values (using `IDENTITY_VAL_LOCAL()` per row). Suitable when you need each generated identity.
- `disabled`: Falls back to legacy behavior: only the first row is inserted (others ignored). Useful for strict backward compatibility.

If you specify `.returning(['COL1', 'COL2'])` with multi-row inserts, those columns are selected; otherwise `IDENTITY_VAL_LOCAL()` (single-row) or `*` (multi-row) is used as a lenient fallback.

## Returning Behavior (INSERT / UPDATE / DELETE)

Native `RETURNING` is not broadly supported over ODBC on IBM i. The dialect provides pragmatic emulation:

### INSERT
- `auto` multi-row: generates a single multi-values INSERT. When no explicit column list is requested it returns all inserted rows (`*`) as a lenient fallback. Some installations may see this internally wrapped using a `SELECT * FROM FINAL TABLE( INSERT ... )` pattern in logs or debug output; that wrapper is only an implementation detail to surface inserted rows.
- `sequential`: inserts each row one at a time so it can reliably call `IDENTITY_VAL_LOCAL()` after each insert; builds an array of returned rows.
- `disabled`: legacy single-row insert behavior; additional rows in the values array are ignored.

### UPDATE
- Executes the UPDATE.
- Re-selects the affected rows using the original WHERE clause when `.returning(...)` is requested.

### DELETE
- Selects the rows to be deleted (capturing requested returning columns or `*`).
- Executes the DELETE.
- Returns the previously selected rows.

### Notes
- `returning('*')` can be expensive on large result sets—limit the column list when possible.
- For guaranteed, ordered identity values across many inserted rows use the `sequential` strategy.

## Configuration Summary

```ts
interface IbmiDialectConfig {
  multiRowInsert?: 'auto' | 'sequential' | 'disabled';
  sequentialInsertTransactional?: boolean; // if true, wraps sequential loop in BEGIN/COMMIT
  preparedStatementCache?: boolean; // Enable per-connection statement caching (default: false)
  preparedStatementCacheSize?: number; // Max cached statements per connection (default: 100)
  readUncommitted?: boolean; // Append WITH UR to SELECT queries (default: false)
}
```

Attach under the root knex config as `ibmi`.

### Performance Tuning

#### Prepared Statement Caching (v0.5.0+)

Enable optional prepared statement caching to reduce parse overhead for repeated queries:

```ts
const db = knex({
  client: DB2Dialect,
  connection: { /* ... */ },
  ibmi: {
    preparedStatementCache: true,        // Enable caching
    preparedStatementCacheSize: 100,     // Max statements per connection
  }
});
```

When enabled, the dialect maintains a per-connection LRU cache of prepared statements. Statements are automatically closed when evicted or when the connection is destroyed.

#### Read Uncommitted Isolation (v0.5.0+)

For read-heavy workloads, enable uncommitted read isolation to improve concurrency:

```ts
const db = knex({
  client: DB2Dialect,
  connection: { /* ... */ },
  ibmi: {
    readUncommitted: true  // Appends WITH UR to all SELECT queries
  }
});
```

This appends `WITH UR` to all SELECT queries, allowing reads without waiting for locks. Only use this if your application can tolerate reading uncommitted data.

### Transactional Sequential Inserts

When `ibmi.sequentialInsertTransactional` is `true`, the dialect will attempt `BEGIN` before the per-row loop and `COMMIT` after. On commit failure it will attempt a `ROLLBACK`. If `BEGIN` is not supported, it logs a warning and continues non-transactionally.

<!-- Benchmarks section intentionally removed. Benchmarking is handled in the external test harness project -->

## Links

- Knex: https://knexjs.org/
- Knex repo: https://github.com/knex/knex
- ODBC driver: https://github.com/IBM/node-odbc
- IBM i OSS docs: https://ibmi-oss-docs.readthedocs.io/
