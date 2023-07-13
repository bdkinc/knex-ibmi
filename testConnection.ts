import knex from "knex";
import DB2Dialect from "./src/index";

const db = knex({
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
      DBQ: ",BRIAN",
    },
    pool: {
      max: 100,
      min: 10,
    },
  },
});

async function getData() {
  const response = await db.select().from("BRIAN.DATA");
  console.log(JSON.stringify(response, null, 4));
}

async function insertData() {
  const response = await db("BRIAN.DATA").insert({ text: "Soup" });
  console.log(JSON.stringify(response, null, 2));
}

async function updateData() {
  const response = await db("BRIAN.DATA")
    .where({ id: 1 })
    .update({ text: "Sup" });
}

async function testConnection() {
  await insertData();
  await getData();
  await updateData();
  await getData();
  process.exit();
}

testConnection().then(() => console.log("done"));
