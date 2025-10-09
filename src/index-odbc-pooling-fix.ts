/**
 * PROPER ODBC POOLING IMPLEMENTATION
 * 
 * This shows how to fix the double-pooling bug while keeping ODBC pooling.
 * Key changes:
 * 1. Create ODBC pool ONCE during initialization
 * 2. Store pool as instance variable
 * 3. Reuse pool in acquireRawConnection
 * 4. Clean up pool in destroy
 */

import knex, { Knex } from "knex";
import odbc, { Connection, Pool } from "odbc";

class DB2ClientWithODBCPooling extends knex.Client {
  private odbcPool?: Pool; // Store the ODBC pool instance

  constructor(config: Knex.Config<any>) {
    super(config);
    this.driverName = "odbc";

    // ... existing constructor code ...

    // Initialize ODBC pool if configured
    if (config.useOdbcPooling && config.connection) {
      this.initializeODBCPool(config);
    }
  }

  /**
   * Initialize ODBC pool ONCE during construction
   */
  private async initializeODBCPool(config: Knex.Config<any>) {
    const connectionConfig = config.connection as any;
    
    const poolConfig = {
      connectionString: this._getConnectionString(connectionConfig),
      connectionTimeout: config.acquireConnectionTimeout || 60000,
      initialSize: config.pool?.min || 2,
      maxSize: config.pool?.max || 10,
      reuseConnection: true,
    };

    try {
      this.odbcPool = await odbc.pool(poolConfig);
      console.log('✅ ODBC pool initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize ODBC pool:', error);
      throw error;
    }
  }

  /**
   * FIXED: Reuse the existing ODBC pool instead of creating new one
   */
  async acquireRawConnection() {
    this.printDebug("acquiring raw connection");
    const connectionConfig = this.config.connection as any;

    if (!connectionConfig) {
      return this.printError("There is no connection config defined");
    }

    this.printDebug(
      "connection config: " + this._getConnectionString(connectionConfig)
    );

    let connection: Connection;

    // If ODBC pooling is enabled, use the pre-initialized pool
    if (this.odbcPool) {
      connection = await this.odbcPool.connect();
      this.printDebug("connection acquired from ODBC pool");
    } else {
      // Fall back to direct connection (Knex manages pooling)
      connection = await odbc.connect(
        this._getConnectionString(connectionConfig)
      );
      this.printDebug("direct connection created (Knex pooling)");
    }

    return connection;
  }

  /**
   * Clean up ODBC pool on destroy
   */
  async destroy() {
    if (this.odbcPool) {
      try {
        await this.odbcPool.close();
        console.log('✅ ODBC pool closed');
      } catch (error) {
        console.error('⚠️ Error closing ODBC pool:', error);
      }
      this.odbcPool = undefined;
    }
    
    return super.destroy();
  }

  // ... rest of the implementation stays the same ...
}

/**
 * Usage example:
 * 
 * const db = knex({
 *   client: DB2Dialect,
 *   connection: { ... },
 *   pool: { min: 2, max: 10 },
 *   useOdbcPooling: true  // Enable ODBC pooling
 * });
 */
