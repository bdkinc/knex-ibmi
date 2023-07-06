import Transaction from "./transaction";
// @ts-ignore
import Client from "knex/lib/client";
import * as process from "process";
import { Connection } from "odbc";
import { Knex } from "knex";

class DB2Client extends Client<Knex.Client> {
  private dialect: string;
  private readonly driverName: string;

  constructor(config: any = {}) {
    super(config);

    this.dialect = "db2";
    this.driverName = "odbc";

    Client.call(this, config);

    const { driver } = config.connection || {};

    if (!driver) {
      // @ts-ignore
      this.logger.warn(
        "Warn: config.connection.driver is needed for connecting to the database"
      );
    }
  }

  async _driver() {
    return await import(this.driverName);
  }

  transaction() {
    // @ts-ignore
    return new Transaction(this, ...arguments);
  }

  wrapIdentifierImpl(value: any) {
    // override default wrapper ("). we don't want to use it since
    // it makes identifiers case-sensitive in DB2
    return value;
  }

  printDebug(message: string) {
    if (process.env.DEBUG === "true") {
      // @ts-ignore
      this.logger.log(message);
    }
  }

  // Get a raw connection, called by the pool manager whenever a new
  // connection needs to be added to the pool.
  async acquireRawConnection() {
    this.printDebug("acquiring raw connection");
    // @ts-ignore
    const connectionConfig = this.config.connection;

    try {
      // @ts-ignore
      return await this.driver.connect(
        this._getConnectionString(connectionConfig)
      );
    } catch (err) {
      // @ts-ignore
      throw new Error(err);
    }
  }

  // Used to explicitly close a connection, called internally by the pool manager
  // when a connection times out or the pool is shutdown.
  async destroyRawConnection(connection: Connection) {
    return await connection.close();
  }

  async validateConnection(connection: Connection) {
    // @ts-ignore
    return await connection.tables();
  }

  _stream(connection: Connection, obj: any, stream: any, options: any) {
    this._stream(connection, obj, stream, options);
    throw new Error("Not yet implemented");
  }

  _getConnectionString(connectionConfig: any = {}) {
    const connectionStringParams =
      connectionConfig.connectionStringParams || {};
    const connectionStringExtension = Object.keys(
      connectionStringParams
    ).reduce((result, key) => {
      const value = connectionStringParams[key];
      return `${result}${key}=${value}`;
    }, "");

    return `${
      `DRIVER=${connectionConfig.driver};SYSTEM=${connectionConfig.host};HOSTNAME=${connectionConfig.host};` +
      `PORT=${connectionConfig.port};DATABASE=${connectionConfig.database};` +
      `UID=${connectionConfig.user};PWD=${connectionConfig.password};`
    }${connectionStringExtension}`;
  }

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  async _query(connection: Connection, obj: any) {
    // TODO: verify correctness
    if (!obj || typeof obj == "string") obj = { sql: obj };
    const method = (obj.method !== "raw"
      ? obj.method
      : obj.sql.split(" ")[0]
    ).toLowerCase();
    obj.sqlMethod = method;

    // Different functions are used since query() doesn't return # of rows affected,
    // which is needed for queries that modify the database
    if (method === "select" || method === "first" || method === "pluck") {
      const rows: any = await connection.query(obj.sql, obj.bindings);
      if (rows) {
        obj.response = { rows, rowCount: rows.length };
      }

      return obj;
    }

    const statement = await connection.createStatement();
    await statement.prepare(obj.sql);
    await statement.bind(obj.bindings);
    obj.response = await statement.execute();

    return obj;
  }

  processResponse(obj: any, runner: any) {
    // TODO: verify correctness
    if (obj === null) return null;

    const resp = obj.response;
    const method = obj.sqlMethod;
    const { rows } = resp;

    if (obj.output) return obj.output.call(runner, resp);

    switch (method) {
      case "select":
      case "pluck":
      case "first": {
        if (method === "pluck") return rows.map(obj.pluck);
        return method === "first" ? rows[0] : rows;
      }
      case "insert":
      case "del":
      case "delete":
      case "update":
      case "counter":
        return resp.rowCount;
      default:
        return resp;
    }
  }
}

export default DB2Client;
