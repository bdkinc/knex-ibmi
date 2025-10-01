import { expect } from "chai";
import DB2Dialect from "../../src";

describe("IBMi Client", () => {
  let client: DB2Dialect;

  beforeEach(() => {
    client = new DB2Dialect({ client: "ibmi" });
  });

  it("can be initialized with just the client name in config", () => {
    expect(new DB2Dialect({ client: "ibmi" })).to.exist;
  });

  describe("Connection String", () => {
    it("should return expected connection string", () => {
      const connectionConfig = {
        host: "localhost",
        database: "testdb",
        port: 8471,
        user: "db2inst1",
        password: "password",
        driver: "{IBM Cli Driver}",
      };
      const expectedConnectionString =
        `DRIVER=${connectionConfig.driver};SYSTEM=${connectionConfig.host};` +
        `HOSTNAME=${connectionConfig.host};` +
        `PORT=${connectionConfig.port};DATABASE=${connectionConfig.database};` +
        `UID=${connectionConfig.user};PWD=${connectionConfig.password};`;

      const connectionString = client._getConnectionString(connectionConfig);

      expect(connectionString).to.equal(expectedConnectionString);
    });

    it("should append additional connection string parameters", () => {
      const connectionConfig = {
        connectionStringParams: {
          X: "1",
          Y: "20",
        },
      };

      // @ts-ignore
      const connectionString = client._getConnectionString(connectionConfig);

      expect(connectionString.endsWith("X=1;Y=20;")).to.be.true;
    });
  });
});
