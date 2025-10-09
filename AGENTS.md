# Agent Context for @bdkinc/knex-ibmi

## Project Overview

This is a **Knex.js dialect for IBM i DB2** using the official **IBM-supported Node ODBC driver** (`odbc` npm package). The library provides a bridge between Knex.js query builder and IBM i DB2 database systems.

**Package**: `@bdkinc/knex-ibmi`
**Repository**: https://github.com/bdkinc/knex-ibmi
**License**: MIT
**Node Version**: >= 16

## Core Technologies

- **Language**: TypeScript
- **Database Driver**: `odbc` (IBM-supported Node ODBC driver)
- **Query Builder**: Knex.js v3
- **Build Tool**: tsup
- **Test Framework**: Mocha with ts-mocha and chai
- **Linting**: ESLint with TypeScript plugin

## Project Structure

```
/var/apps/knex-ibmi/
├── src/
│   ├── index.ts                    # Main dialect implementation (DB2Client)
│   ├── query/                      # Query compiler
│   │   └── ibmi-querycompiler.ts
│   ├── schema/                     # Schema/DDL compilers
│   │   ├── ibmi-compiler.ts
│   │   ├── ibmi-tablecompiler.ts
│   │   └── ibmi-columncompiler.ts
│   ├── execution/                  # Transaction handling
│   │   └── ibmi-transaction.ts
│   └── migrations/                 # Custom IBM i migration system
│       └── ibmi-migration-runner.ts
├── test/                           # Test files
├── types/                          # Type definitions
├── dist/                           # Build output
└── scripts/                        # Build scripts
```

## Key Features & Architecture

### 1. **Custom Dialect Implementation**
- Extends `knex.Client` as `DB2Client`
- Uses ODBC connection pooling
- Custom identifier wrapping (case-insensitive by default for IBM i)
- Custom query/schema/table/column compilers

### 2. **Multi-Row Insert Strategies**
The dialect supports three insert strategies via `ibmi.multiRowInsert` config:
- **`auto`** (default): Single INSERT with multiple VALUES lists
- **`sequential`**: Row-by-row inserts with reliable identity value collection
- **`disabled`**: Legacy single-row only

### 3. **Returning Clause Emulation**
IBM i DB2 doesn't support RETURNING over ODBC, so the dialect emulates it:
- **INSERT**: Uses `SELECT * FROM FINAL TABLE(INSERT ...)` or `IDENTITY_VAL_LOCAL()`
- **UPDATE**: Executes UPDATE then SELECTs updated rows using same WHERE clause
- **DELETE**: SELECTs rows first, then DELETEs them

### 4. **Custom Migration System**
Standard Knex migrations fail on IBM i due to auto-commit DDL and locking issues. The library includes a custom migration runner:
- `createIBMiMigrationRunner()` function
- Built-in CLI: `ibmi-migrations`
- Bypasses Knex's problematic locking mechanism
- See [MIGRATIONS.md](./MIGRATIONS.md) for details

### 5. **Streaming Support**
- Supports query streaming with configurable `fetchSize`
- Auto-optimizes fetch size based on query complexity
- Supports both Node stream piping and async iteration

## Common Commands

### Build
```bash
npm run build          # Build with tsup + post-process CLI
```

### Testing
```bash
npm test              # Run all tests with ts-mocha
```

### Linting
```bash
npm run lint          # ESLint
npm run format        # Prettier
```

### Migrations (CLI)
```bash
npx ibmi-migrations migrate:latest
npx ibmi-migrations migrate:rollback
npx ibmi-migrations migrate:status
npx ibmi-migrations migrate:make <name>
```

## ODBC Configuration

### Connection String Parameters
The library builds ODBC connection strings from config:
```typescript
interface DB2ConnectionConfig {
  database: string;          // Usually "*LOCAL"
  host: string;             // IBM i system name
  port: number;             // Default 8471 or 9471
  user: string;
  password: string;
  driver: string;           // "IBM i Access ODBC Driver"
  connectionStringParams?: { // Optional ODBC params
    DBQ?: string;           // Library list
    CMT?: number;           // Commitment control
    ALLOWPROCCALLS?: 0 | 1;
    // ... many more ODBC-specific params
  };
}
```

### Finding ODBC Driver
```bash
odbcinst -j              # Show ODBC config paths
cat /etc/odbcinst.ini    # View installed drivers
```

## Important Implementation Details

### Identifier Handling
- IBM i DB2 is case-insensitive by default
- The dialect avoids wrapping identifiers in quotes to prevent case-sensitivity issues
- Migration table names are always uppercased

### Transaction Handling
- DDL operations auto-commit on IBM i (cannot be rolled back)
- Migrations should use `disableTransactions: true` if using standard Knex migrations
- Sequential inserts can optionally wrap in BEGIN/COMMIT via `sequentialInsertTransactional: true`

### Error Handling
- ODBC errors with SQLSTATE 02000 (no data) are treated as 0-row DML success
- Connection errors are wrapped with context
- Empty `odbcErrors` arrays are handled gracefully for UPDATE/DELETE operations

### Response Processing
- `IDENTITY_VAL_LOCAL()` results are specially formatted
- DML operations return rowCount for consistency with other Knex dialects
- SELECT operations return rows array

## Debugging

Set `DEBUG=true` environment variable to enable verbose logging:
```bash
DEBUG=true npm test
```

The client logs:
- Connection acquisition
- Migration queries
- Query execution times
- ODBC errors with full context

## Code Style Guidelines

- **TypeScript**: Strict null checks enabled, but `noImplicitAny: false`
- **Target**: ES2020
- **Module**: CommonJS with ESM support via tsup
- **Formatting**: Prettier
- **Naming**: 
  - Classes: PascalCase (e.g., `DB2Client`)
  - Files: kebab-case (e.g., `ibmi-querycompiler.ts`)
  - Interfaces: PascalCase with optional `I` prefix (e.g., `DB2Config`)

## Testing Guidelines

- Tests use Mocha + Chai
- Test files: `test/**/*.spec.ts`
- Run with ts-mocha and tsx import
- Tests should cover query compilation, execution, and edge cases

## Common Gotchas

1. **Migrations**: Always use the custom IBM i migration system, not standard Knex migrations
2. **Identifiers**: Don't wrap in quotes unless you need case-sensitive names
3. **DDL in Transactions**: DDL auto-commits, so migrations must disable transactions
4. **RETURNING**: Not natively supported; uses emulation strategies
5. **Case Sensitivity**: IBM i DB2 normalizes to uppercase unless quoted
6. **Connection Pooling**: Uses ODBC driver's built-in pooling

## Dependencies

**Runtime**:
- `knex`: ^3
- `odbc`: ^2.4.9

**Dev**:
- TypeScript 5.9+
- ESLint 9+
- Mocha 11+
- tsup 8+

## Environment Variables

- `DEBUG=true`: Enable verbose logging
- `ODBCINI=/etc`: ODBC config directory
- `ODBCSYSINI=/etc`: ODBC system config directory

## Additional Documentation

- [README.md](./README.md): User-facing documentation and quick start
- [MIGRATIONS.md](./MIGRATIONS.md): Complete migration system documentation
- [CHANGELOG.md](./CHANGELOG.md): Version history
