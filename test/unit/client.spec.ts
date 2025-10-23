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
        `PORT=${connectionConfig.port};DATABASE=${connectionConfig.database};` +
        `UID=${connectionConfig.user};PWD=${connectionConfig.password};` +
        `BLOCKFETCH=1;TRUEAUTOCOMMIT=0;`;

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

  describe("Bigint normalization", () => {
    it("normalizes bigint values to strings by default", () => {
      const queryObject: any = {
        sqlMethod: "select",
        response: {
          rows: [
            {
              id: 9007199254740995n,
              nested: { value: 1n },
              label: "example",
            },
          ],
          rowCount: 1,
        },
      };

      const result = client.processResponse(queryObject, {});

      expect(result).to.deep.equal([
        {
          id: "9007199254740995",
          nested: { value: "1" },
          label: "example",
        },
      ]);
    });

    it("can disable bigint normalization via configuration", () => {
      const customClient = new DB2Dialect({
        client: "ibmi",
        ibmi: { normalizeBigintToString: false },
      });

      const queryObject: any = {
        sqlMethod: "select",
        response: {
          rows: [{ id: 42n }],
          rowCount: 1,
        },
      };

      const result = customClient.processResponse(queryObject, {});

      expect(typeof result[0].id).to.equal("bigint");
    });
  });
});
