import ColumnCompiler from "knex/lib/schema/columncompiler";
import * as console from "console";

class IBMiColumnCompiler extends ColumnCompiler {
  constructor(client, tableCompiler, columnBuilder) {
    super(client, tableCompiler, columnBuilder);
  }

  increments(options = { primaryKey: true }) {
    return (
      "int not null generated always as identity (start with 1, increment by 1)" +
      (this.tableCompiler._canBeAddPrimaryKey(options) ? " primary key" : "")
    );
  }

  datetime(withoutTz = false, precision) {
    let useTz;
    if (isObject(withoutTz)) {
      ({ useTz, precision } = withoutTz);
    } else {
      useTz = !withoutTz;
    }
    useTz = typeof useTz === "boolean" ? useTz : true;
    precision =
      precision !== undefined && precision !== null
        ? "(" + precision + ")"
        : "";

    console.log(useTz, precision);
    return `${useTz ? "timestamptz" : "timestamp"}${precision}`;
  }
}

export default IBMiColumnCompiler;
