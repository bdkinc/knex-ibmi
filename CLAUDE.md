# Claude AI Context for @bdkinc/knex-ibmi

## What is this project?

This is a **Knex.js dialect for IBM i DB2** that uses the **IBM-supported Node ODBC driver**. It allows developers to use Knex query builder with IBM i (AS/400, iSeries) database systems.

## Key Concepts for AI Assistants

### IBM i DB2 Quirks

IBM i DB2 has several unique characteristics that this dialect handles:

1. **Case Insensitivity**: By default, IBM i normalizes identifiers to uppercase unless quoted. This dialect avoids quoting to prevent accidental case-sensitivity.

2. **Auto-Commit DDL**: DDL operations (CREATE TABLE, ALTER TABLE, etc.) auto-commit immediately and cannot be rolled back. This breaks standard Knex migrations.

3. **No Native RETURNING**: RETURNING clauses aren't supported over ODBC, requiring emulation strategies.

4. **ODBC-Specific Behavior**: Uses ODBC driver which has different error reporting and result formats than typical SQL drivers.

### Architecture Patterns

**Query Execution Flow**:
```
Knex Query → QueryCompiler → DB2Client._query() → ODBC Connection → IBM i DB2
                                     ↓
                              Response Processing → Format for Knex
```

**Special Execution Paths**:
- `_ibmiUpdateReturning`: UPDATE + SELECT emulation
- `_ibmiDeleteReturning`: SELECT + DELETE emulation  
- `_ibmiSequentialInsert`: Row-by-row insert for reliable identity values

### Custom Migration System

**Why it exists**: Standard Knex migrations use row-level locking on the migrations table, which fails on IBM i due to auto-commit DDL.

**How it works**:
- Custom runner bypasses Knex's migration lock mechanism
- Directly queries migration table without locking
- Includes CLI similar to Knex's interface
- Lives in `src/migrations/ibmi-migration-runner.ts`

### Multi-Row Insert Strategies

The dialect offers three strategies because IBM i's IDENTITY value handling differs from other databases:

- **`auto`**: Fast bulk inserts, but identity values may not be individually accessible
- **`sequential`**: Slower but guarantees each row's identity value via `IDENTITY_VAL_LOCAL()`
- **`disabled`**: Backward compatibility (inserts only first row)

## Common Development Tasks

### Adding New Query Features

1. Check if feature is supported by IBM i DB2 SQL
2. If native support exists: add to `ibmi-querycompiler.ts`
3. If emulation needed: add special handling in `DB2Client._query()` or `processResponse()`
4. Add tests in `test/` directory

### Handling ODBC Errors

ODBC errors come in different formats than typical SQL errors:

```typescript
{
  odbcErrors: [
    { state: "02000", message: "No data found" }  // SQLSTATE codes
  ]
}
```

Empty `odbcErrors` arrays often indicate zero-row DML operations, not failures.

### Working with Identifiers

```typescript
// ✅ Good - case-insensitive
db.table('users').select('*')  // → SELECT * FROM USERS

// ❌ Problematic - creates case-sensitive identifier
db.table('"Users"').select('*')  // → SELECT * FROM "Users"
```

The `wrapIdentifierImpl()` method specifically avoids wrapping to maintain case-insensitivity.

### Transaction Considerations

```typescript
// ✅ Good - DDL outside transaction
await db.schema.createTable('users', (t) => { ... });

// ❌ Bad - DDL in transaction (will auto-commit anyway)
await db.transaction(async (trx) => {
  await trx.schema.createTable('users', (t) => { ... });
});
```

## Code Locations

**When modifying**:
- Query compilation logic → `src/query/ibmi-querycompiler.ts`
- Schema/DDL generation → `src/schema/*.ts`
- Connection/execution → `src/index.ts` (DB2Client class)
- Migration logic → `src/migrations/ibmi-migration-runner.ts`
- Type definitions → `types/` and interfaces in `src/index.ts`

**When debugging**:
- Set `DEBUG=true` for verbose logs
- Check `executeStatementQuery()` for DML execution
- Check `executeSelectQuery()` for SELECT execution
- Check `processResponse()` for result formatting

## Testing Philosophy

Tests should verify:
1. Correct SQL generation (query compiler tests)
2. Proper ODBC parameter binding
3. IBM i-specific edge cases (case insensitivity, IDENTITY handling)
4. Error handling for ODBC-specific errors

Run tests with: `npm test`

## Common Questions

**Q: Why not use Knex's built-in DB2 dialect?**  
A: Knex's DB2 dialect targets DB2 LUW (Linux/Unix/Windows), which has different characteristics than IBM i DB2. IBM i requires ODBC and has unique quirks.

**Q: Why custom migrations instead of fixing Knex's system?**  
A: IBM i's auto-commit DDL fundamentally conflicts with Knex's transaction-based migration locking. A bypass is necessary.

**Q: How does streaming work?**  
A: Uses ODBC cursors with configurable `fetchSize`. The `_stream()` method creates a Readable stream from the ODBC cursor.

**Q: What's IDENTITY_VAL_LOCAL()?**  
A: IBM i DB2's function to retrieve the last auto-generated identity value on the current connection. Similar to MySQL's LAST_INSERT_ID().

## Important Files to Review

- [src/index.ts](src/index.ts): Main dialect implementation, all execution logic
- [src/query/ibmi-querycompiler.ts](src/query/ibmi-querycompiler.ts): SQL generation
- [src/migrations/ibmi-migration-runner.ts](src/migrations/ibmi-migration-runner.ts): Custom migration system
- [README.md](README.md): User documentation
- [MIGRATIONS.md](MIGRATIONS.md): Migration system docs
- [package.json](package.json): Scripts and dependencies

## Related Technologies

- **Knex.js**: SQL query builder - https://knexjs.org/
- **IBM i Access ODBC Driver**: Native driver from IBM
- **node-odbc**: Node.js ODBC bindings - https://github.com/IBM/node-odbc
- **IBM i OSS Docs**: https://ibmi-oss-docs.readthedocs.io/

## Cursor Position Context

You're currently viewing `src/index.ts` at line 304, which is in the `executeUpdateReturning()` method. This method handles UPDATE queries with RETURNING clauses by:
1. Executing the UPDATE statement
2. Extracting WHERE clause bindings
3. Re-selecting updated rows using the same WHERE clause
4. Returning the selected rows as the UPDATE result

This is necessary because IBM i DB2 doesn't support UPDATE...RETURNING over ODBC.
