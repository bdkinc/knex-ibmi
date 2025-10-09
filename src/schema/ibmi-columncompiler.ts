import ColumnCompiler from "knex/lib/schema/columncompiler.js";

class IBMiColumnCompiler extends ColumnCompiler {
  // Use type assertion to work around ESM import interface issues
  [key: string]: any;

  increments(options = { primaryKey: true }) {
    return (
      "int not null generated always as identity (start with 1, increment by 1)" +
      (this.tableCompiler._canBeAddPrimaryKey(options) ? " primary key" : "")
    );
  }

  // Add more IBM i DB2 specific column types for better support
  bigIncrements(options = { primaryKey: true }) {
    return (
      "bigint not null generated always as identity (start with 1, increment by 1)" +
      (this.tableCompiler._canBeAddPrimaryKey(options) ? " primary key" : "")
    );
  }

  varchar(length?: number) {
    return length ? `varchar(${length})` : 'varchar(255)';
  }

  char(length?: number) {
    return length ? `char(${length})` : 'char(1)';
  }

  text() {
    // IBM i DB2 uses CLOB for large text
    return 'clob(1M)';
  }

  mediumtext() {
    return 'clob(16M)';
  }

  longtext() {
    return 'clob(2G)';
  }

  binary(length?: number) {
    return length ? `binary(${length})` : 'binary(1)';
  }

  varbinary(length?: number) {
    return length ? `varbinary(${length})` : 'varbinary(255)';
  }

  // IBM i DB2 decimal with precision/scale
  decimal(precision?: number, scale?: number) {
    if (precision && scale) {
      return `decimal(${precision}, ${scale})`;
    } else if (precision) {
      return `decimal(${precision})`;
    }
    return 'decimal(10, 2)';
  }

  // IBM i DB2 timestamp
  // Note: IBM i DB2 does not support TIMESTAMP WITH TIME ZONE
  timestamp(options?: any) {
    if (options?.useTz && this.client?.logger?.warn) {
      this.client.logger.warn(
        'IBM i DB2 does not support TIMESTAMP WITH TIME ZONE. Using plain TIMESTAMP instead.'
      );
    }
    return 'timestamp';
  }

  datetime(options?: any) {
    return this.timestamp(options);
  }

  // IBM i DB2 date and time types
  date() {
    return 'date';
  }

  time() {
    return 'time';
  }

  // JSON support (IBM i 7.3+)
  // Note: CHECK constraints with column references are not supported in this context
  // Users should add validation constraints separately if needed
  json() {
    return 'clob(16M)';
  }

  jsonb() {
    // IBM i doesn't have native JSONB, use CLOB
    return 'clob(16M)';
  }

  // UUID support using CHAR(36)
  uuid() {
    return 'char(36)';
  }
}

export default IBMiColumnCompiler;
