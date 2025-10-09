/**
 * Benchmark to compare ODBC pooling vs Knex pooling for IBM i DB2
 * 
 * Run with: ts-node test/pooling-benchmark.ts
 */

import knex, { Knex } from 'knex';
import { DB2Dialect, DB2Config } from '../src/index';

// Configuration - UPDATE WITH YOUR CREDENTIALS
const baseConfig = {
  host: process.env.IBMI_HOST || 'your-host',
  database: '*LOCAL',
  user: process.env.IBMI_USER || 'your-user',
  password: process.env.IBMI_PASSWORD || 'your-password',
  driver: 'IBM i Access ODBC Driver',
  connectionStringParams: {
    DBQ: process.env.IBMI_LIBRARY || 'QGPL',
    CMT: 0,
  },
};

async function benchmark(name: string, config: DB2Config, iterations: number = 100) {
  console.log(`\n🧪 Testing: ${name}`);
  console.log(`   Iterations: ${iterations}`);
  
  const db = knex(config);
  const times: number[] = [];
  
  try {
    // Warmup
    await db.raw('SELECT 1 FROM SYSIBM.SYSDUMMY1');
    
    // Benchmark
    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint();
      await db.raw('SELECT 1 FROM SYSIBM.SYSDUMMY1');
      const end = process.hrtime.bigint();
      times.push(Number(end - start) / 1_000_000); // Convert to ms
    }
    
    // Calculate statistics
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const sorted = times.sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];
    const min = Math.min(...times);
    const max = Math.max(...times);
    
    console.log(`   ✅ Results:`);
    console.log(`      Avg:  ${avg.toFixed(2)}ms`);
    console.log(`      p50:  ${p50.toFixed(2)}ms`);
    console.log(`      p95:  ${p95.toFixed(2)}ms`);
    console.log(`      p99:  ${p99.toFixed(2)}ms`);
    console.log(`      Min:  ${min.toFixed(2)}ms`);
    console.log(`      Max:  ${max.toFixed(2)}ms`);
    
    return { name, avg, p50, p95, p99, min, max };
  } catch (error) {
    console.error(`   ❌ Error:`, error);
    throw error;
  } finally {
    await db.destroy();
  }
}

async function concurrentBenchmark(name: string, config: DB2Config, concurrency: number = 10, iterations: number = 50) {
  console.log(`\n🚀 Concurrent Test: ${name}`);
  console.log(`   Concurrency: ${concurrency}, Iterations per worker: ${iterations}`);
  
  const db = knex(config);
  
  try {
    // Warmup
    await db.raw('SELECT 1 FROM SYSIBM.SYSDUMMY1');
    
    const start = process.hrtime.bigint();
    
    // Run concurrent workers
    const workers = Array.from({ length: concurrency }, async () => {
      for (let i = 0; i < iterations; i++) {
        await db.raw('SELECT 1 FROM SYSIBM.SYSDUMMY1');
      }
    });
    
    await Promise.all(workers);
    
    const end = process.hrtime.bigint();
    const totalTime = Number(end - start) / 1_000_000; // ms
    const totalQueries = concurrency * iterations;
    const throughput = (totalQueries / totalTime) * 1000; // queries/sec
    
    console.log(`   ✅ Results:`);
    console.log(`      Total time:  ${totalTime.toFixed(2)}ms`);
    console.log(`      Total queries: ${totalQueries}`);
    console.log(`      Throughput:  ${throughput.toFixed(2)} queries/sec`);
    
    return { name, totalTime, throughput };
  } catch (error) {
    console.error(`   ❌ Error:`, error);
    throw error;
  } finally {
    await db.destroy();
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  IBM i DB2 Pooling Strategy Benchmark');
  console.log('═══════════════════════════════════════════════════════');
  
  // Test 1: Knex pooling only (no ODBC pool)
  const knexPoolConfig: DB2Config = {
    client: DB2Dialect,
    connection: baseConfig,
    pool: { min: 2, max: 10 },
    // This will use the fixed version without ODBC pooling
  };
  
  // Test 2: ODBC pooling (requires fixed implementation)
  const odbcPoolConfig: DB2Config = {
    client: DB2Dialect,
    connection: baseConfig,
    pool: { min: 2, max: 10 },
    useOdbcPooling: true, // Custom flag we'll add
  };
  
  try {
    // Sequential benchmark
    console.log('\n📊 SEQUENTIAL PERFORMANCE');
    console.log('─────────────────────────────────────────────────────');
    const seqResults = [];
    
    seqResults.push(await benchmark('Knex Pooling', knexPoolConfig, 100));
    // Uncomment after implementing ODBC pooling fix:
    // seqResults.push(await benchmark('ODBC Pooling', odbcPoolConfig, 100));
    
    // Concurrent benchmark
    console.log('\n📊 CONCURRENT PERFORMANCE');
    console.log('─────────────────────────────────────────────────────');
    const concResults = [];
    
    concResults.push(await concurrentBenchmark('Knex Pooling', knexPoolConfig, 10, 50));
    // Uncomment after implementing ODBC pooling fix:
    // concResults.push(await concurrentBenchmark('ODBC Pooling', odbcPoolConfig, 10, 50));
    
    // Summary
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\nSequential (lower is better):');
    seqResults.forEach(r => {
      console.log(`  ${r.name.padEnd(20)} | Avg: ${r.avg.toFixed(2)}ms | p95: ${r.p95.toFixed(2)}ms`);
    });
    
    console.log('\nConcurrent (higher throughput is better):');
    concResults.forEach(r => {
      console.log(`  ${r.name.padEnd(20)} | Throughput: ${r.throughput.toFixed(2)} q/sec`);
    });
    
  } catch (error) {
    console.error('Benchmark failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
