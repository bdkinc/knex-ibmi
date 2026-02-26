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
    it("should return expected connection string with driver defaults", () => {
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

    it("should pass through CMT parameter without modifying TRUEAUTOCOMMIT", () => {
      const connectionConfig = {
        host: "localhost",
        database: "testdb",
        port: 8471,
        user: "db2inst1",
        password: "password",
        driver: "{IBM Cli Driver}",
        connectionStringParams: {
          CMT: 0, // Disable commitment control (*NONE)
        },
      };

      const connectionString = client._getConnectionString(connectionConfig);

      // Should pass through CMT without automatically setting TRUEAUTOCOMMIT
      expect(connectionString).to.include("CMT=0");
      expect(connectionString).to.not.include("TRUEAUTOCOMMIT");
    });

    it("should respect user-specified TRUEAUTOCOMMIT value", () => {
      const connectionConfig = {
        host: "localhost",
        database: "testdb",
        port: 8471,
        user: "db2inst1",
        password: "password",
        driver: "{IBM Cli Driver}",
        connectionStringParams: {
          CMT: 0,
          TRUEAUTOCOMMIT: 1, // User explicitly wants TRUEAUTOCOMMIT=1
        },
      };

      const connectionString = client._getConnectionString(connectionConfig);

      // Should use user's explicit value
      expect(connectionString).to.include("CMT=0");
      expect(connectionString).to.include("TRUEAUTOCOMMIT=1");
    });

    it("should respect multiple user-specified parameters", () => {
      const connectionConfig = {
        host: "localhost",
        database: "testdb",
        port: 8471,
        user: "db2inst1",
        password: "password",
        driver: "{IBM Cli Driver}",
        connectionStringParams: {
          CMT: 0,
          TRUEAUTOCOMMIT: 0,
          BLOCKFETCH: 1,
        },
      };

      const connectionString = client._getConnectionString(connectionConfig);

      // All user settings should be respected
      expect(connectionString).to.include("CMT=0");
      expect(connectionString).to.include("TRUEAUTOCOMMIT=0");
      expect(connectionString).to.include("BLOCKFETCH=1");
    });

    it("should not add any parameters when none are specified", () => {
      const connectionConfig = {
        host: "localhost",
        database: "testdb",
        port: 8471,
        user: "db2inst1",
        password: "password",
        driver: "{IBM Cli Driver}",
      };

      const connectionString = client._getConnectionString(connectionConfig);

      // Should only contain basic connection info, no auto-added parameters
      expect(connectionString).to.not.include("TRUEAUTOCOMMIT");
      expect(connectionString).to.not.include("CMT");
      expect(connectionString).to.not.include("BLOCKFETCH");
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

  describe("Response handling regressions", () => {
    it("does not throw when insert response is missing", () => {
      const queryObject: any = {
        sqlMethod: "insert",
      };

      expect(() => client.processResponse(queryObject, {})).to.not.throw();
      expect(client.processResponse(queryObject, {})).to.deep.equal([]);
    });

    it("returns 0 for update when response is missing", () => {
      const queryObject: any = {
        sqlMethod: "update",
      };

      expect(client.processResponse(queryObject, {})).to.equal(0);
    });

    it("uses rowCount for counter when rows are missing", () => {
      const queryObject: any = {
        sqlMethod: "counter",
        response: {
          rowCount: 7,
        },
      };

      expect(client.processResponse(queryObject, {})).to.equal(7);
    });
  });
});
