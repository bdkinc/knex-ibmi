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

The package includes a built-in CLI that works just like Knex migrations:

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

**Full CLI API:**
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
ibmi-migrations migrate:latest --knexfile ./knexfile.ts        # Use TypeScript knexfile
ibmi-migrations migrate:make create_users_table
ibmi-migrations migrate:make add_email_column -x ts            # TypeScript migration
```

## TypeScript Support

The ibmi-migrations CLI has full support for TypeScript projects:

### Using TypeScript Knexfiles

The CLI can automatically load and use TypeScript knexfiles (`.ts` extension):

```bash
# Explicitly specify a TypeScript knexfile
npx ibmi-migrations migrate:latest --knexfile knexfile.ts
npx ibmi-migrations migrate:status --knexfile ./config/knexfile.ts

# The CLI automatically detects and loads .ts files
```

### Creating TypeScript Migrations

Use the `-x ts` flag to create TypeScript migration files:

```bash
# Create a TypeScript migration
npx ibmi-migrations migrate:make create_users_table -x ts

# The generated file will have proper TypeScript types
```

### Running TypeScript Migrations

The migration runner automatically detects and runs both `.js` and `.ts` migration files:

```bash
# This will run both JS and TS migrations in the correct order
npx ibmi-migrations migrate:latest --knexfile knexfile.ts
```

### Complete TypeScript Workflow Example

```bash
# 1. Create a TypeScript knexfile (knexfile.ts)
# 2. Create a TypeScript migration
npx ibmi-migrations migrate:make create_initial_schema -x ts --knexfile knexfile.ts

# 3. Edit the migration file with your schema changes
# 4. Run the migration
npx ibmi-migrations migrate:latest --knexfile knexfile.ts

# 5. Check status
npx ibmi-migrations migrate:status --knexfile knexfile.ts
```

**Note:** The CLI uses dynamic imports to load TypeScript files directly, so no separate build step is required for your knexfile or migrations.

## CLI Features

The built-in CLI provides a complete migration management experience:

### Migration Management
- **`migrate:latest`**: Run all pending migrations
- **`migrate:rollback`**: Rollback the last batch of migrations
- **`migrate:status`**: Show detailed migration status with executed/pending lists
- **`migrate:currentVersion`**: Display the current migration version
- **`migrate:list`**: List all available migrations

### Migration Creation
- **`migrate:make <name>`**: Create new migration files with proper timestamps
- **TypeScript Support**: Use `-x ts` to create TypeScript migration files
- **Smart Templates**: Generates properly formatted templates with helpful examples
- **Mixed Extensions**: Supports both `.js` and `.ts` migrations in the same project

### Environment Management
- **Multi-environment**: Use `--env` to target different environments
- **Custom Knexfiles**: Use `--knexfile` to specify custom configuration files
- **Package.json Integration**: Add scripts for easy team usage

### Example Workflow
```bash
# Create a new migration
npx ibmi-migrations migrate:make create_users_table

# Check what needs to be run
npx ibmi-migrations migrate:status

# Run pending migrations
npx ibmi-migrations migrate:latest

# If something goes wrong, rollback
npx ibmi-migrations migrate:rollback
```

## Key Differences from Standard Knex Migrations

1. **No Locking**: The IBM i migration system completely bypasses Knex's migration locking mechanism which doesn't work with IBM i DB2's auto-commit behavior.

2. **Uppercase Column Names**: IBM i DB2 uses uppercase column names by default. The migration system handles this automatically.

3. **No Transaction Wrapping**: Migrations run without transaction wrapping since IBM i DDL operations auto-commit anyway.

4. **Reliable**: No more hanging on migration lock operations.

## Migration File Format

Your migration files work exactly the same as standard Knex migrations. You can use either JavaScript or TypeScript:

### JavaScript Migration
```javascript
// 20231214_create_users_table.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = (knex) => {
  return knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('email').unique();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = (knex) => {
  return knex.schema.dropTable('users');
};
```

### TypeScript Migration
```typescript
// 20231214_add_user_profile.ts

import { Knex } from "knex";

export const up = async (knex: Knex): Promise<void> => {
  return knex.schema.alterTable('users', (table) => {
    table.text('profile').nullable();
    table.timestamp('last_login').nullable();
  });
};

export const down = async (knex: Knex): Promise<void> => {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('profile');
    table.dropColumn('last_login');
  });
};
```

### Creating Migration Files
Use the CLI to generate properly formatted migration files:

```bash
# Create JavaScript migration (default)
npx ibmi-migrations migrate:make create_users_table

# Create TypeScript migration
npx ibmi-migrations migrate:make add_user_profile -x ts
```

## Configuration

The migration runner accepts the same configuration as Knex migrations. Configure these in your `knexfile.js` or `knexfile.ts`:

### JavaScript Configuration
```javascript
// knexfile.js
import { DB2Dialect } from "@bdkinc/knex-ibmi";

export default {
  development: {
    client: DB2Dialect,
    connection: {
      // your connection config
    },
    migrations: {
      directory: "./migrations",      // Migration files directory
      tableName: "KNEX_MIGRATIONS",  // Migration tracking table name
      schemaName: "MYSCHEMA",        // Schema/library name (optional)
      extension: "js"                // Default extension for new migrations
    }
  }
};
```

### TypeScript Configuration
```typescript
// knexfile.ts
import { DB2Dialect } from "@bdkinc/knex-ibmi";
import type { Knex } from "knex";

interface KnexConfig {
  [key: string]: Knex.Config;
}

const config: KnexConfig = {
  development: {
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
      }
    },
    migrations: {
      directory: "./migrations",
      tableName: "KNEX_MIGRATIONS",
      schemaName: "MYSCHEMA",
      extension: "ts"                // Default extension for new migrations
    }
  }
};

export default config;
```

**Configuration Options:**
- `directory`: Where migration files are stored (default: `"./migrations"`)
- `tableName`: Database table to track migrations (default: `"KNEX_MIGRATIONS"`)
- `schemaName`: IBM i schema/library name (optional)
- `extension`: Default file extension for new migrations (`"js"` or `"ts"`, default: `"js"`)

**Note:** The CLI can create both JavaScript and TypeScript migrations regardless of the `extension` setting by using the `-x` flag.

## Why Not Use Standard Knex Migrations?

IBM i DB2 has unique characteristics that make standard Knex migrations problematic:

- **Auto-commit DDL**: DDL operations automatically commit, breaking Knex's transaction-based locking
- **Case sensitivity**: IBM i uses uppercase identifiers by default
- **ODBC driver behavior**: The node-odbc driver has specific behaviors that conflict with Knex's expectations

The built-in IBM i migration system is specifically designed to work around these issues while maintaining compatibility with standard Knex migration file formats.

## Troubleshooting

### CLI Not Found
If you get "command not found" errors:

```bash
# Make sure the package is installed
npm ls @bdkinc/knex-ibmi

# Use npx to run without global install
npx ibmi-migrations --help

# Or install globally
npm install -g @bdkinc/knex-ibmi
```

### Mixed File Extensions
The migration system automatically detects both `.js` and `.ts` files. If you're not seeing TypeScript migrations:

1. Make sure your `knexfile.js` doesn't have a restrictive `extension` setting
2. Check that the migration files are in the correct directory
3. Use `migrate:list` to see all detected migrations

### Connection Issues
If migrations fail to connect:

1. Verify your `knexfile.js` configuration
2. Test the connection with a simple query first
3. Check IBM i ODBC driver installation and configuration
4. Ensure proper schema/library permissions

### Example Complete Setup
```bash
# 1. Install the package
npm install @bdkinc/knex-ibmi knex odbc

# 2. Create knexfile.js (see Configuration section above)

# 3. Create your first migration
npx ibmi-migrations migrate:make create_initial_tables

# 4. Edit the migration file, then run
npx ibmi-migrations migrate:latest

# 5. Check status
npx ibmi-migrations migrate:status
```