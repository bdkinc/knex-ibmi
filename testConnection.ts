import knex from "knex";
import DB2Dialect from "./src/index";

const db = knex({
  // @ts-ignore
  client: DB2Dialect,
  connection: {
    database: "COMPOSER",
    host: "172.16.252.4",
    port: 50000,
    user: "usfpgmlib",
    password: "lansa",
    driver: "IBM i Access ODBC Driver",
    // @ts-ignore
    connectionStringParams: {
      CMT: 0,
      Naming: 1,
      DBQ: ",USAEDIDTA,USFLICLIB",
    },
    pool: {
      max: 100,
      min: 10,
    },
  },
});

async function testConnection() {
  const response = await db.select().from("USAEDIDTA.USAIMPH");
  console.log(JSON.stringify(response, null, 4));
}

testConnection();
