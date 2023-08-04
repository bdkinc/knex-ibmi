// @ts-ignore
import ColumnCompiler from "knex/lib/schema/columncompiler";

class IBMiColumnCompiler extends ColumnCompiler {
  increments(options = { primaryKey: true }) {
    return (
      "int not null generated always as identity (start with 1, increment by 1)" +
      // @ts-ignore
      (this.tableCompiler._canBeAddPrimaryKey(options) ? " primary key" : "")
    );
  }
}

export default IBMiColumnCompiler;
