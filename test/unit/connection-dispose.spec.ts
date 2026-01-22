import { PassThrough } from "node:stream";
import { expect } from "chai";
import DB2Dialect from "../../src";

describe("Pool Connection Disposal", () => {
  let client: DB2Dialect;

  beforeEach(() => {
    client = new DB2Dialect({ client: "ibmi" });
    // Silence expected error logs for this suite
    (client as any).logger = {
      ...((client as any).logger || {}),
      error: () => {},
      warn: () => {},
      debug: () => {},
    };
  });

  it("marks a connection as disposed on connection errors in _query", async () => {
    const error = {
      odbcErrors: [{ state: "08S01", message: "Communication link failure" }],
      message: "Link failed",
    };

    const connection: any = {
      connected: true,
      query: async () => {
        throw error;
      },
    };

    try {
      await (client as any)._query(connection, { sql: "select 1", bindings: [] });
      expect.fail("Expected query to throw");
    } catch {
      // ignore
    }

    expect(connection.__knex__disposed).to.equal(error);
  });

  it("marks a connection as disposed on connection errors in _stream", async () => {
    const error = {
      odbcErrors: [{ state: "08003", message: "Connection does not exist" }],
      message: "Connection not open",
    };

    const connection: any = {
      connected: true,
      query: (_sql: string, _bindings: any[], _opts: any, cb: any) => cb(error),
    };

    const passthrough = new PassThrough({ objectMode: true });

    try {
      await (client as any)._stream(
        connection,
        { sql: "select 1", bindings: [] },
        passthrough,
        {},
      );
      expect.fail("Expected stream to reject");
    } catch {
      // ignore
    }

    expect(connection.__knex__disposed).to.equal(error);
  });

  it("validateConnection returns false when connection is not connected", async () => {
    const connection: any = { connected: false };
    const ok = await (client as any).validateConnection(connection);
    expect(ok).to.equal(false);
  });
});
