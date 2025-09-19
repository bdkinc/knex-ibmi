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

```ts
import { knex } from "knex";
import { DB2Dialect, DB2Config } from "@bdkinc/knex-ibmi";
import { Transform } from "node:stream";
import { finished } from "node:stream/promises";

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
  const stream = await db.select("*").from("LARGETABLE").stream({ fetchSize: 100 });

  const transform = new Transform({
    objectMode: true,
    transform(chunk, _enc, cb) {
      // Process each row
      console.log("Processing row:", chunk);
      cb(null, chunk);
    },
  });

  stream.pipe(transform);
  await finished(stream);

  // Alternative: async iteration
  for await (const record of stream) {
    console.log(record);
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

# Legacy aliases (backward compatibility):
ibmi-migrations latest                 # Same as migrate:latest
ibmi-migrations rollback               # Same as migrate:rollback
ibmi-migrations status                 # Same as migrate:status

# Options:
ibmi-migrations migrate:status --env production
ibmi-migrations migrate:latest --knexfile ./config/knexfile.js
ibmi-migrations migrate:make create_users_table
ibmi-migrations migrate:make add_email_column -x ts      # TypeScript migration
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

- `auto` (default): Generates a single INSERT with multiple VALUES lists and wraps in `select * from FINAL TABLE(...)`. Returns all rows as provided by DB2 (may not include identities individually when only `IDENTITY_VAL_LOCAL()` is available without explicit returning list).
- `sequential`: Compiler shows a single-row statement (first row) but at execution time each row is inserted individually inside a loop to reliably collect identity values (using `IDENTITY_VAL_LOCAL()` per row). Suitable when you need each generated identity.
- `disabled`: Falls back to legacy behavior: only the first row is inserted (others ignored). Useful for strict backward compatibility.

If you specify `.returning(['COL1', 'COL2'])` with multi-row inserts, those columns are selected; otherwise `IDENTITY_VAL_LOCAL()` (single-row) or `*` (multi-row) is used as a lenient fallback.

## Returning Behavior (INSERT / UPDATE / DELETE)

IBM i DB2 via ODBC has limited native `RETURNING` support. This dialect implements emulation strategies:

### INSERT
- Wrapped as `select IDENTITY_VAL_LOCAL()` or `select *` from `FINAL TABLE(insert ...)`.
- Multi-row `auto` uses `select *` unless explicit returning columns provided.
- Sequential strategy gathers per-row identity values by executing each row separately.

### UPDATE
- For `.returning(...)` the compiler emits a synthetic `select ... from FINAL TABLE(update ...)` string for readability, but execution actually performs the UPDATE first, then re-selects the updated rows using the original WHERE clause.
- Ensures compatibility where FINAL TABLE over UPDATE is unreliable.

### DELETE
- For `.returning(...)` the dialect selects the target rows first, then issues the DELETE, returning the previously selected data.
- Compiler shows `select ... from FINAL TABLE(delete ...)` for consistency, though execution uses SELECT+DELETE.

### Caveats
- `returning('*')` on large tables may produce large result sets; a warning is logged in debug mode for multi-row inserts.
- Ambiguous identity retrieval in single-statement multi-row inserts (`auto` strategy) is handled by returning the full row set; if you need ordered identity values, prefer `sequential`.

## Configuration Summary

```ts
interface IbmiDialectConfig {
  multiRowInsert?: 'auto' | 'sequential' | 'disabled';
  sequentialInsertTransactional?: boolean; // if true, wraps sequential loop in BEGIN/COMMIT
}
```

Attach under the root knex config as `ibmi`.

### Transactional Sequential Inserts

When `ibmi.sequentialInsertTransactional` is `true`, the dialect will attempt `BEGIN` before the per-row loop and `COMMIT` after. On commit failure it will attempt a `ROLLBACK`. If `BEGIN` is not supported, it logs a warning and continues non-transactionally.

## Benchmarks

A simple benchmark script is provided to compare insert strategies:

```bash
npm run build
npm run bench:insert -- host.example.com MYUSER MYPASS *LOCAL QGPL rows=2000 strategy=auto
npm run bench:insert -- host.example.com MYUSER MYPASS *LOCAL QGPL rows=2000 strategy=sequential

# Or using environment variables (database defaults to *LOCAL if omitted):
export DB2_HOST=host.example.com
export DB2_USER=MYUSER
export DB2_PASSWORD=MYPASS
export DB2_DATABASE='*LOCAL'
export DB2_SCHEMA=QGPL
export BENCH_ROWS=3000
export BENCH_STRATEGY=sequential
npm run bench:insert
```

Output includes elapsed time and approximate rows/sec. Use a dedicated schema/library for benchmarking as the script drops and recreates `BM_INSERT_BENCH`.

## Links

- Knex: https://knexjs.org/
- Knex repo: https://github.com/knex/knex
- ODBC driver: https://github.com/IBM/node-odbc
- IBM i OSS docs: https://ibmi-oss-docs.readthedocs.io/
