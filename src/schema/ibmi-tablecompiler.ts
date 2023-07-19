import TableCompiler from "knex/lib/schema/tablecompiler";

class IBMiTableCompiler extends TableCompiler {
  constructor(client, tableBuilder) {
    super(client, tableBuilder);
  }

  unique(columns, indexName) {
    /** @type {string | undefined} */
    let deferrable;
    let useConstraint = false;
    let predicate;
    if (typeof indexName === "object") {
      ({ indexName, deferrable, useConstraint, predicate } = indexName);
    }
    if (deferrable && deferrable !== 'not deferrable') {
      this.client.logger.warn(
        `ibmi: unique index [${indexName}] will not be deferrable ${deferrable} because mssql does not support deferred constraints.`
      );
    }
    if (useConstraint && predicate) {
      throw new Error('ibmi cannot create constraint with predicate');
    }
    indexName = indexName
      ? this.formatter.wrap(indexName)
      : this._indexCommand('unique', this.tableNameRaw, columns);

    if (!Array.isArray(columns)) {
      columns = [columns];
    }

    if (useConstraint) {
      // mssql supports unique indexes and unique constraints.
      // unique indexes cannot be used with foreign key relationships hence unique constraints are used instead.
      this.pushQuery(
        `ALTER TABLE ${this.tableName()} ADD CONSTRAINT ${indexName} UNIQUE (${this.formatter.columnize(
          columns
        )})`
      );
    } else {
      // default to making unique index that allows null https://stackoverflow.com/a/767702/360060
      // to be more or less compatible with other DBs (if any of the columns is NULL then "duplicates" are allowed)
      const predicateQuery = predicate
        ? ' ' + this.client.queryCompiler(predicate).where()
        : ' WHERE ' +
        columns
          .map((column) => this.formatter.columnize(column) + ' IS NOT NULL')
          .join(' AND ');
      this.pushQuery(
        `CREATE UNIQUE INDEX ${indexName} ON ${this.tableName()} (${this.formatter.columnize(
          columns
        )})${predicateQuery}`
      );
    }
  }

  createQuery(columns, ifNot, like) {
    let createStatement = ifNot
      ? `if object_id('${this.tableName()}', 'U') is null `
      : "";

    if (like) {
      // This query copy only columns and not all indexes and keys like other databases.
      createStatement += `SELECT * INTO ${this.tableName()} FROM ${this.tableNameLike()} WHERE 0=1`;
    } else {
      createStatement +=
        "CREATE TABLE " +
        this.tableName() +
        (this._formatting ? " (\n    " : " (") +
        columns.sql.join(this._formatting ? ",\n    " : ", ") +
        this._addChecks() +
        ")";
    }

    this.pushQuery(createStatement);

    if (this.single.comment) {
      this.comment(this.single.comment);
    }
    if (like) {
      this.addColumns(columns, this.addColumnsPrefix);
    }
  }

  // All of the columns to "add" for the query
  addColumns(columns, prefix) {
    prefix = prefix || this.addColumnsPrefix;

    if (columns.sql.length > 0) {
      const columnSql = columns.sql.map((column) => {
        return prefix + column;
      });
      this.pushQuery({
        sql:
          (this.lowerCase ? 'alter table ' : 'ALTER TABLE ') +
          this.tableName() +
          ' ' +
          columnSql.join(' '),
        bindings: columns.bindings,
      });
    }
  }

  async commit(conn, value) {
    return await conn.commit();
  }
}

export default IBMiTableCompiler
