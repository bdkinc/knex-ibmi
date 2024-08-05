import TableCompiler from "knex/lib/schema/tablecompiler";
import isObject from "lodash/isObject";
import { Connection } from "odbc";

class IBMiTableCompiler extends TableCompiler {
  createQuery(columns: { sql: any[] }, ifNot: any, like: any) {
    let createStatement = ifNot
      ? `if object_id('${this.tableName()}', 'U') is null `
      : "";

    if (like) {
      // This query copy only columns and not all indexes and keys like other databases.
      createStatement += `select * into ${this.tableName()} from ${this.tableNameLike()} WHERE 0=1`;
    } else {
      createStatement +=
        "create table " +
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

  dropUnique(columns: string[], indexName: any) {
    indexName = indexName
      ? this.formatter.wrap(indexName)
      : this._indexCommand("unique", this.tableNameRaw, columns);

    this.pushQuery(`drop index ${indexName}`);
  }

  unique(
    columns: string[],
    indexName: { indexName: any; deferrable: any; predicate: any },
  ) {
    let deferrable: string = "";
    let predicate: any;

    if (isObject(indexName)) {
      deferrable = indexName.deferrable;
      predicate = indexName.predicate;
      indexName = indexName.indexName;
    }

    if (deferrable && deferrable !== "not deferrable") {
      this.client.logger.warn?.(
        `IBMi: unique index \`${indexName}\` will not be deferrable ${deferrable}.`,
      );
    }

    indexName = indexName
      ? this.formatter.wrap(indexName)
      : this._indexCommand("unique", this.tableNameRaw, columns);
    columns = this.formatter.columnize(columns);

    const predicateQuery = predicate
      ? " " + this.client.queryCompiler(predicate).where()
      : "";

    this.pushQuery(
      `create unique index ${indexName} on ${this.tableName()} (${columns})${predicateQuery}`,
    );
  }

  // All of the columns to "add" for the query
  addColumns(columns: any, prefix: any) {
    prefix = prefix || this.addColumnsPrefix;

    if (columns.sql.length > 0) {
      const columnSql = columns.sql.map((column) => {
        return prefix + column;
      });
      this.pushQuery({
        sql:
          (this.lowerCase ? "alter table " : "ALTER TABLE ") +
          this.tableName() +
          " " +
          columnSql.join(" "),
        bindings: columns.bindings,
      });
    }
  }

  async commit(connection: Connection) {
    return await connection.commit();
  }
}

export default IBMiTableCompiler;
