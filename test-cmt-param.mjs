// Test to verify CMT parameter is passed through correctly
import { DB2Dialect } from './dist/index.mjs';

// Create a client instance
const client = new DB2Dialect({ client: 'ibmi' });

// Test 1: CMT=0 should be included
const configWithCMT = {
  host: 'localhost',
  database: 'testdb',
  port: 8471,
  user: 'db2inst1',
  password: 'password',
  driver: 'IBM i Access ODBC Driver',
  connectionStringParams: {
    CMT: 0
  }
};

const connectionString1 = client._getConnectionString(configWithCMT);
console.log('Test 1 - CMT=0 parameter:');
console.log('Connection String:', connectionString1);
console.log('Contains CMT=0?', connectionString1.includes('CMT=0'));
console.log('');

// Test 2: CMT=0 should override defaults
const configWithMultipleParams = {
  host: 'localhost',
  database: 'testdb',
  port: 8471,
  user: 'db2inst1',
  password: 'password',
  driver: 'IBM i Access ODBC Driver',
  connectionStringParams: {
    CMT: 0,
    TRUEAUTOCOMMIT: 1, // Override default
    CUSTOMKEY: 123
  }
};

const connectionString2 = client._getConnectionString(configWithMultipleParams);
console.log('Test 2 - Multiple parameters including CMT=0:');
console.log('Connection String:', connectionString2);
console.log('Contains CMT=0?', connectionString2.includes('CMT=0'));
console.log('Contains TRUEAUTOCOMMIT=1?', connectionString2.includes('TRUEAUTOCOMMIT=1'));
console.log('Contains CUSTOMKEY=123?', connectionString2.includes('CUSTOMKEY=123'));
console.log('');

// Test 3: Defaults should be applied when no params provided
const configNoParams = {
  host: 'localhost',
  database: 'testdb',
  port: 8471,
  user: 'db2inst1',
  password: 'password',
  driver: 'IBM i Access ODBC Driver'
};

const connectionString3 = client._getConnectionString(configNoParams);
console.log('Test 3 - Default parameters only:');
console.log('Connection String:', connectionString3);
console.log('Contains BLOCKFETCH=1?', connectionString3.includes('BLOCKFETCH=1'));
console.log('Contains TRUEAUTOCOMMIT=0?', connectionString3.includes('TRUEAUTOCOMMIT=0'));
console.log('');

// Test 4: Check parameter ordering
console.log('Test 4 - Parameter analysis:');
const parts = connectionString1.split(';');
console.log('All parameters:');
parts.forEach(part => {
  if (part.trim()) console.log('  ', part);
});
