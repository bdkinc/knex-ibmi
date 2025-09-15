# IBM i Migration System

Due to IBM i DB2's auto-commit behavior on DDL operations, Knex's standard migration system with locking doesn't work reliably. The knex-ibmi library provides a built-in migration system that bypasses the problematic locking mechanism.

## Usage

### Option 1: Programmatic API

```javascript
import knex from "knex";
import { createIBMiMigrationRunner } from "@bdkinc/knex-ibmi";

// Create your knex instance
const db = knex({
  client: "@bdkinc/knex-ibmi",
  connection: {
    // your connection config
  },
  migrations: {
    directory: "./migrations",
    tableName: "KNEX_MIGRATIONS",
    schemaName: "MYSCHEMA"
  }
});

// Create migration runner
const migrationRunner = createIBMiMigrationRunner(db, {
  directory: "./migrations",
  tableName: "KNEX_MIGRATIONS",
  schemaName: "MYSCHEMA"
});

// Run latest migrations
await migrationRunner.latest();

// Rollback last batch
await migrationRunner.rollback();

// Get migration status
const currentVersion = await migrationRunner.currentVersion();
const executed = await migrationRunner.listExecuted();
const pending = await migrationRunner.listPending();

// Always clean up
await db.destroy();
```

### Option 2: Command Line Interface

Copy the provided CLI script to your project:

```bash
# Copy the CLI script from node_modules
cp node_modules/@bdkinc/knex-ibmi/cli/ibmi-migrations.js ./

# Or if installed globally
cp $(npm root -g)/@bdkinc/knex-ibmi/cli/ibmi-migrations.js ./
```

Then use it with your knexfile.js:

```bash
# Run all pending migrations
node ibmi-migrations.js latest

# Rollback last migration batch
node ibmi-migrations.js rollback

# Rollback last 2 batches
node ibmi-migrations.js rollback 2

# Show migration status
node ibmi-migrations.js status
```

## Key Differences from Standard Knex Migrations

1. **No Locking**: The IBM i migration system completely bypasses Knex's migration locking mechanism which doesn't work with IBM i DB2's auto-commit behavior.

2. **Uppercase Column Names**: IBM i DB2 uses uppercase column names by default. The migration system handles this automatically.

3. **No Transaction Wrapping**: Migrations run without transaction wrapping since IBM i DDL operations auto-commit anyway.

4. **Reliable**: No more hanging on migration lock operations.

## Migration File Format

Your migration files work exactly the same as standard Knex migrations:

```javascript
// 20231214_create_users_table.js

export const up = (knex) => {
  return knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('email').unique();
    table.timestamps(true, true);
  });
};

export const down = (knex) => {
  return knex.schema.dropTable('users');
};
```

## Configuration

The migration runner accepts the same configuration as Knex migrations:

```javascript
{
  directory: "./migrations",      // Migration files directory
  tableName: "KNEX_MIGRATIONS",  // Migration tracking table name
  schemaName: "MYSCHEMA",        // Schema/library name (optional)
  extension: "js"                // Migration file extension
}
```

## Why Not Use Standard Knex Migrations?

IBM i DB2 has unique characteristics that make standard Knex migrations problematic:

- **Auto-commit DDL**: DDL operations automatically commit, breaking Knex's transaction-based locking
- **Case sensitivity**: IBM i uses uppercase identifiers by default
- **ODBC driver behavior**: The node-odbc driver has specific behaviors that conflict with Knex's expectations

The built-in IBM i migration system is specifically designed to work around these issues while maintaining compatibility with standard Knex migration file formats.