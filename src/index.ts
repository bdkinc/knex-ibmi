//----------------------------------------------------------------------------------------------------------------------
// IBM DB2 Knex Dialect
//----------------------------------------------------------------------------------------------------------------------

import * as process from 'process';
import { Connection } from 'odbc';
import { Knex, knex } from 'knex';
import * as odbc from 'odbc';

import SchemaCompiler from './schema/db2-compiler';
import TableCompiler from './schema/db2-table-compiler';
import ColumnCompiler from './schema/db2-column-compiler';
import Transaction from './execution/db2-transaction';
import QueryCompiler from './query/db2-query-compiler';

//----------------------------------------------------------------------------------------------------------------------

class DB2Client extends knex.Client
{
    constructor(config)
    {
        super(config);
        this.driverName = 'odbc';

        if(this.dialect && !this.config.client)
        {
            this.logger.warn?.(
                `Using 'this.dialect' to identify the client is deprecated and support for it will be removed in the `
                + `future. Please use configuration option 'client' instead.`
            );
        }

        const dbClient = this.config.client || this.dialect;
        if(!dbClient)
        {
            throw new Error(
                `knex: Required configuration option 'client' is missing.`
            );
        }

        if(config.version)
        {
            this.version = config.version;
        }

        if(this.driverName && config.connection)
        {
            this.initializeDriver();
            if(!config.pool || (config.pool && config.pool.max !== 0))
            {
                this.initializePool(config);
            }
        }
        this.valueForUndefined = this.raw('DEFAULT');
        if(config.useNullAsDefault)
        {
            this.valueForUndefined = null;
        }
    }

    _driver() : any
    {
        return odbc;
    }

    wrapIdentifierImpl(value) : string
    {
        if(value === '*')
        {
            return value;
        }

        let arrayAccessor = '';
        const arrayAccessorMatch = value.match(/(.*?)(\[[0-9]+\])/);

        if(arrayAccessorMatch)
        {
            value = arrayAccessorMatch[1];
            arrayAccessor = arrayAccessorMatch[2];
        }

        return `"${ value.replace(/"/g, '""') }"${ arrayAccessor }`;
    }

    printDebug(message : string) : void
    {
        if(process.env.DEBUG === 'true')
        {
            this.logger.debug?.(`knex-db2: ${ message }`);
        }
    }

    // Get a raw connection, called by the pool manager whenever a new
    // connection needs to be added to the pool.
    async acquireRawConnection() : Promise<Connection>
    {
        this.printDebug('acquiring raw connection');
        const connectionConfig = this.config.connection;
        this.printDebug(this._getConnectionString(connectionConfig));

        if(this.config?.pool)
        {
            const poolConfig = {
                connectionString: this._getConnectionString(connectionConfig),
                connectionTimeout: this.config?.acquireConnectionTimeout || 60000,
                initialSize: this.config?.pool?.min || 2,
                maxSize: this.config?.pool?.max || 10,
                reuseConnection: true,
            };
            const pool = await this.driver.pool(poolConfig);
            return pool.connect();
        }

        return this.driver.connect(
            this._getConnectionString(connectionConfig)
        );
    }

    // Used to explicitly close a connection, called internally by the pool manager
    // when a connection times out or the pool is shutdown.
    async destroyRawConnection(connection : Connection) : Promise<void>
    {
        this.printDebug('destroy connection');
        return connection.close();
    }

    _getConnectionString(connectionConfig) : string
    {
        const connectionStringParams
            = connectionConfig.connectionStringParams || {};
        const connectionStringExtension = Object.keys(
            connectionStringParams
        ).reduce((result, key) =>
        {
            const value = connectionStringParams[key];
            return `${ result }${ key }=${ value };`;
        }, '');

        return `${
            `DRIVER=${ connectionConfig.driver };SYSTEM=${ connectionConfig.host };HOSTNAME=${ connectionConfig.host };`
            + `PORT=${ connectionConfig.port };DATABASE=${ connectionConfig.database };`
            + `UID=${ connectionConfig.user };PWD=${ connectionConfig.password };`
        }${ connectionStringExtension }`;
    }

    // Runs the query on the specified connection, providing the bindings
    // and any other necessary prep work.
    async _query(connection : any, obj : any) : Promise<any>
    {
        if(!obj || typeof obj == 'string')
        {
            obj = { sql: obj };
        }
        const method = (
            Object.hasOwn(obj, 'method') && obj.method !== 'raw'
                ? obj.method
                : obj.sql.split(' ')[0]
        ).toLowerCase();
        obj.sqlMethod = method;

        // Different functions are used since query() doesn't return # of rows affected,
        // which is needed for queries that modify the database

        if(method === 'select' || method === 'first' || method === 'pluck')
        {
            const rows : any = await connection.query(obj.sql, obj.bindings);
            if(rows)
            {
                obj.response = { rows, rowCount: rows.length };
            }
        }
        else
        {
            await connection.beginTransaction();
            this.printDebug('transaction begun');
            try
            {
                const statement = await connection.createStatement();
                await statement.prepare(obj.sql);
                if(obj.bindings)
                {
                    await statement.bind(obj.bindings);
                }
                const result = await statement.execute();
                // this is hacky we check the SQL for the ID column
                // most dialects return the ID of the inserted
                // we check for the IDENTITY scalar function
                // if that function is present, then we just return the value of the
                // IDENTITY column
                if(result.statement.includes('IDENTITY_VAL_LOCAL()'))
                {
                    obj.response = {
                        rows: result.map((row) =>
                        {
                            return (result.columns && result.columns?.length > 0) ? row[result.columns[0].name] : row;
                        }),
                        rowCount: result.count,
                    };
                }
                else if(method === 'update')
                {
                    if(obj.selectReturning)
                    {
                        const returningSelect = await connection.query(obj.selectReturning);
                        obj.response = {
                            rows: returningSelect,
                            rowCount: result.count,
                        };
                    }
                    else
                    {
                        obj.response = {
                            rows: result,
                            rowCount: result.count,
                        };
                    }
                }
                else
                {
                    obj.response = { rows: result, rowCount: result.count };
                }
            }
            catch (err : any)
            {
                this.printDebug(err);
                await connection.rollback();
                throw new Error(err);
            }
            finally
            {
                this.printDebug('transaction committed');
                await connection.commit();
            }
        }

        this.printDebug(obj.sql + obj.bindings ? JSON.stringify(obj.bindings) : '');
        return obj;
    }

    transaction(container : any, config : any, outerTx : any) : Knex.Transaction
    {
        return new Transaction(this, container, config, outerTx);
    }

    schemaCompiler(tableBuilder : any) : SchemaCompiler
    {
        return new SchemaCompiler(this, tableBuilder);
    }

    tableCompiler(tableBuilder : any) : TableCompiler
    {
        return new TableCompiler(this, tableBuilder);
    }

    columnCompiler(tableCompiler : any, columnCompiler : any) : ColumnCompiler
    {
        return new ColumnCompiler(this, tableCompiler, columnCompiler);
    }

    queryCompiler(builder : Knex.QueryBuilder) : QueryCompiler
    {
        return new QueryCompiler(this, builder);
    }

    processResponse(obj : any, runner : any) : any
    {
        if(obj === null)
        {
            return null;
        }

        const resp = obj.response;
        const method = obj.sqlMethod;
        const { rows, rowCount } = resp;

        if(obj.output)
        {
            return obj.output.call(runner, resp);
        }

        switch (method)
        {
            case 'select':
                return rows;
            case 'pluck':
                return rows.map(obj.pluck);
            case 'first':
                return rows[0];
            case 'insert':
                return rows;
            case 'del':
            case 'delete':
            case 'update':
                if(obj.selectReturning)
                {
                    return rows;
                }
                return rowCount;
            case 'counter':
                return rowCount;
            default:
                return rows;
        }
    }
}

//----------------------------------------------------------------------------------------------------------------------

interface DB2PoolConfig
{
    min ?: number;
    max ?: number;
    acquireConnectionTimeout ?: number;
}

interface DB2ConnectionParams
{
    CMT ?: number;
    CONNTYPE ?: number;
    DBQ ?: string;
    MAXDECPREC ?: 31 | 63;
    MAXDECSCALE ?: number;
    MINDIVSCALE ?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
    NAM ?: 0 | 1;
    DFT ?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
    DSP ?: 0 | 1 | 2 | 3 | 4;
    DEC ?: 0 | 1;
    DECFLOATERROROPTION ?: 0 | 1;
    DECFLOATROUNDMODE ?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    MAPDECIMALFLOATDESCRIBE ?: 1 | 3;
    ALLOWPROCCALLS : 0 | 1;
}

interface DB2ConnectionConfig
{
    database : string;
    host : string;
    port : 50000 | number;
    user : string;
    password : string;
    driver : 'IBM DB2 Driver' | string;
    connectionStringParams ?: DB2ConnectionParams;
}

export interface DB2Config
{
    client : any;
    connection : DB2ConnectionConfig;
    pool ?: DB2PoolConfig;
}

//----------------------------------------------------------------------------------------------------------------------

export const DB2Dialect = DB2Client;
export default DB2Client;

//----------------------------------------------------------------------------------------------------------------------
