// Test UPDATE RETURNING with CMT=0 to verify SQL7008 error is avoided
import knex from 'knex';
import { DB2Dialect } from './dist/index.mjs';

// Test configuration - replace with your actual connection details
const config = {
  client: DB2Dialect,
  connection: {
    driver: 'IBM i Access ODBC Driver',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '8471'),
    database: process.env.DB_DATABASE || '*LOCAL',
    user: process.env.DB_USER || 'testuser',
    password: process.env.DB_PASSWORD || 'testpass',
    connectionStringParams: {
      CMT: 0, // Disable commitment control to avoid SQL7008
    }
  },
  debug: false
};

console.log('Testing UPDATE with RETURNING clause...\n');
console.log('Connection config:');
console.log('- Host:', config.connection.host);
console.log('- Database:', config.connection.database);
console.log('- CMT:', config.connection.connectionStringParams.CMT);
console.log('');

const db = knex(config);

async function test() {
  try {
    // Get connection string to verify CMT=0 is included
    const client = db.client;
    const connString = client._getConnectionString(config.connection);
    console.log('Generated Connection String:');
    console.log(connString);
    console.log('');
    console.log('CMT=0 present?', connString.includes('CMT=0') ? 'YES ✓' : 'NO ✗');
    console.log('');

    // Show what the UPDATE...RETURNING query would look like
    const updateQuery = db('TESTLIB.USERS')
      .where({ id: 1 })
      .update({ name: 'Updated Name' })
      .returning(['id', 'name']);

    console.log('UPDATE...RETURNING query:');
    console.log(updateQuery.toString());
    console.log('');

    console.log('Note: This test only verifies the connection string configuration.');
    console.log('To actually test the query, you would need:');
    console.log('1. A valid IBM i connection');
    console.log('2. A table that exists (journaled or with CMT=0)');
    console.log('3. Proper permissions');

  } catch (error) {
    console.error('Error:', error.message);
    if (error.odbcErrors) {
      console.error('ODBC Errors:', error.odbcErrors);
    }
  } finally {
    await db.destroy();
  }
}

test();
