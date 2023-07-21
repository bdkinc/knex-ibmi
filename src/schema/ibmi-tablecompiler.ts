import TableCompiler from "knex/lib/schema/tablecompiler";

class IBMiTableCompiler extends TableCompiler {
  createQuery(columns, ifNot, like) {
    let createStatement = ifNot
      // @ts-ignore
      ? `if object_id('${this.tableName()}', 'U') is null `
      : "";

    if (like) {
      // This query copy only columns and not all indexes and keys like other databases.
      // @ts-ignore
      createStatement += `SELECT * INTO ${this.tableName()} FROM ${this.tableNameLike()} WHERE 0=1`;
    } else {
      createStatement +=
        "CREATE TABLE " +
        // @ts-ignore
        this.tableName() +
        // @ts-ignore
        (this._formatting ? " (\n    " : " (") +
        // @ts-ignore
        columns.sql.join(this._formatting ? ",\n    " : ", ") +
        // @ts-ignore
        this._addChecks() +
        ")";
    }

    // @ts-ignore
    this.pushQuery(createStatement);

    // @ts-ignore
    if (this.single.comment) {
      // @ts-ignore
      this.comment(this.single.comment);
    }
    if (like) {
      // @ts-ignore
      this.addColumns(columns, this.addColumnsPrefix);
    }
  }

  // All of the columns to "add" for the query
  addColumns(columns, prefix) {
    // @ts-ignore
    prefix = prefix || this.addColumnsPrefix;

    if (columns.sql.length > 0) {
      const columnSql = columns.sql.map((column) => {
        return prefix + column;
      });
      // @ts-ignore
      this.pushQuery({
        sql:
          // @ts-ignore
          (this.lowerCase ? 'alter table ' : 'ALTER TABLE ') +
          // @ts-ignore
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
