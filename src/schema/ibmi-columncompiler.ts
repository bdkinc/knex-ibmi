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
}

export default IBMiColumnCompiler;
