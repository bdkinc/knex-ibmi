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

## Requirements

- Node.js >= 16
- ODBC driver (IBM i Access ODBC Driver)

## Installation

```bash
npm install @bdkinc/knex-ibmi knex odbc
```

## Quick Start

```js
const knex = require("knex");
const { DB2Dialect } = require("@bdkinc/knex-ibmi");

const db = knex({
  client: DB2Dialect,
  connection: {
    host: "localhost",
    database: "*LOCAL",
    user: "<user>",
    password: "<password>",
    driver: "IBM i Access ODBC Driver",
    connectionStringParams: { DBQ: "MYLIB" },
  },
  pool: { min: 2, max: 10 },
});

db.select("*")
  .from("table")
  .where({ foo: "bar" })
  .then(console.log)
  .catch(console.error)
  .finally(() => process.exit());
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
    host: "localhost",
    database: "*LOCAL",
    user: "<user>",
    password: "<password>",
    driver: "IBM i Access ODBC Driver",
    connectionStringParams: { ALLOWPROCCALLS: 1, CMT: 0, DBQ: "MYLIB" },
  },
  pool: { min: 2, max: 10 },
});
```

### ESM

```js
import knex from "knex";
import { DB2Dialect } from "@bdkinc/knex-ibmi";

/** @type {import("@bdkinc/knex-ibmi").DB2Config} */
const config = {
  client: DB2Dialect,
  connection: {
    host: "localhost",
    database: "*LOCAL",
    user: "<user>",
    password: "<password>",
    driver: "IBM i Access ODBC Driver",
    connectionStringParams: { ALLOWPROCCALLS: 1, CMT: 0, DBQ: "MYLIB" },
  },
  pool: { min: 2, max: 10 },
};

const db = knex(config);

try {
  const data = await db.select("*").from("table").where({ foo: "bar" });
  console.log(data);
} catch (err) {
  throw err;
} finally {
  process.exit();
}
```

### TypeScript

```ts
import { knex } from "knex";
import { DB2Dialect, DB2Config } from "@bdkinc/knex-ibmi";

const config: DB2Config = {
  client: DB2Dialect,
  connection: {
    host: "localhost",
    database: "*LOCAL",
    user: "<user>",
    password: "<password>",
    driver: "IBM i Access ODBC Driver",
    connectionStringParams: { ALLOWPROCCALLS: 1, CMT: 0, DBQ: "MYLIB" },
  },
  pool: { min: 2, max: 10 },
};

const db = knex(config);

try {
  const data = await db.select("*").from("table").where({ foo: "bar" });
  console.log(data);
} catch (err) {
  throw err;
} finally {
  process.exit();
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
    host: "localhost",
    database: "*LOCAL",
    user: "<user>",
    password: "<password>",
    driver: "IBM i Access ODBC Driver",
    connectionStringParams: { ALLOWPROCCALLS: 1, CMT: 0, DBQ: "MYLIB" },
  },
  pool: { min: 2, max: 10 },
};

const db = knex(config);

try {
  const data = await db.select("*").from("table").stream({ fetchSize: 1 });

  const transform = new Transform({
    objectMode: true,
    transform(chunk, _enc, cb) {
      console.log(chunk);
      cb(null, chunk);
    },
  });

  data.pipe(transform);
  await finished(data);

  for await (const record of data) {
    console.log(record);
  }
} catch (err) {
  throw err;
} finally {
  process.exit();
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

## Links

- Knex: https://knexjs.org/
- Knex repo: https://github.com/knex/knex
- ODBC driver: https://github.com/IBM/node-odbc
- IBM i OSS docs: https://ibmi-oss-docs.readthedocs.io/
