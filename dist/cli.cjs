#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/cli.ts
var import_knex = __toESM(require("knex"));
var import_path2 = require("path");
var import_url = require("url");
var import_fs2 = require("fs");

// src/migrations/ibmi-migration-runner.ts
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var IBMiMigrationRunner = class {
  constructor(knex2, config) {
    __publicField(this, "knex");
    __publicField(this, "config");
    this.knex = knex2;
    this.config = {
      directory: "./migrations",
      tableName: "KNEX_MIGRATIONS",
      schemaName: void 0,
      extension: "js",
      ...config
    };
  }
  getFullTableName() {
    return this.config.schemaName ? `${this.config.schemaName}.${this.config.tableName}` : this.config.tableName;
  }
  async latest() {
    try {
      console.log(
        "\u{1F680} IBM i DB2 Migration Runner - bypassing Knex locking system"
      );
      const tableName = this.getFullTableName();
      const migrationTableExists = await this.knex.schema.hasTable(
        tableName
      );
      if (!migrationTableExists) {
        console.log(`\u{1F4DD} Creating migration table: ${tableName}`);
        await this.knex.schema.createTable(tableName, (table) => {
          table.increments("id").primary();
          table.string("name");
          table.integer("batch");
          table.timestamp("migration_time");
        });
        console.log("\u2705 Migration table created");
      }
      const completed = await this.knex(tableName).select("NAME").orderBy("ID");
      const completedNames = completed.map((c) => c.NAME);
      console.log(`\u{1F4CB} Found ${completedNames.length} completed migrations`);
      const migrationFiles = this.getMigrationFiles();
      console.log(`\u{1F4C1} Found ${migrationFiles.length} migration files`);
      const newMigrations = migrationFiles.filter(
        (file) => !completedNames.includes(file)
      );
      if (newMigrations.length === 0) {
        console.log("\u2705 No new migrations to run");
        return;
      }
      console.log(`\u{1F3AF} Running ${newMigrations.length} new migrations:`);
      newMigrations.forEach((file) => console.log(`  - ${file}`));
      const batchResult = await this.knex(tableName).max("BATCH as max_batch");
      const nextBatch = (batchResult[0]?.max_batch || 0) + 1;
      console.log(`\u{1F4CA} Using batch number: ${nextBatch}`);
      for (const migrationFile of newMigrations) {
        console.log(`
\u{1F504} Running migration: ${migrationFile}`);
        try {
          const migrationPath = this.getMigrationPath(migrationFile);
          const migration = await import(migrationPath);
          if (!migration.up || typeof migration.up !== "function") {
            throw new Error(`Migration ${migrationFile} has no 'up' function`);
          }
          console.log(`  \u26A1 Executing migration...`);
          await migration.up(this.knex);
          await this.knex(tableName).insert({
            name: migrationFile,
            batch: nextBatch,
            migration_time: /* @__PURE__ */ new Date()
          });
          console.log(`  \u2705 Migration ${migrationFile} completed successfully`);
        } catch (error) {
          console.error(
            `  \u274C Migration ${migrationFile} failed:`,
            error.message
          );
          throw error;
        }
      }
      console.log(`
\u{1F389} All migrations completed successfully!`);
    } catch (error) {
      console.error("\u274C Migration runner failed:", error.message);
      throw error;
    }
  }
  async rollback(steps = 1) {
    try {
      console.log(`\u{1F504} Rolling back ${steps} migration batch(es)...`);
      const tableName = this.getFullTableName();
      const batchesToRollback = await this.knex(tableName).distinct("BATCH").orderBy("BATCH", "desc").limit(steps);
      if (batchesToRollback.length === 0) {
        console.log("\u2705 No migrations to rollback");
        return;
      }
      const batchNumbers = batchesToRollback.map((b) => b.BATCH);
      console.log(`\u{1F4CA} Rolling back batches: ${batchNumbers.join(", ")}`);
      const migrationsToRollback = await this.knex(tableName).select("NAME").whereIn("BATCH", batchNumbers).orderBy("ID", "desc");
      console.log(`\u{1F3AF} Rolling back ${migrationsToRollback.length} migrations:`);
      migrationsToRollback.forEach((m) => console.log(`  - ${m.NAME}`));
      for (const migrationRecord of migrationsToRollback) {
        const migrationFile = migrationRecord.NAME;
        console.log(`
\u{1F504} Rolling back migration: ${migrationFile}`);
        try {
          const migrationPath = this.getMigrationPath(migrationFile);
          const migration = await import(migrationPath);
          if (migration.down && typeof migration.down === "function") {
            console.log(`  \u26A1 Executing rollback...`);
            await migration.down(this.knex);
          } else {
            console.log(
              `  \u26A0\uFE0F Migration ${migrationFile} has no 'down' function, skipping rollback`
            );
          }
          await this.knex(tableName).where("NAME", migrationFile).del();
          console.log(
            `  \u2705 Migration ${migrationFile} rolled back successfully`
          );
        } catch (error) {
          console.error(
            `  \u274C Migration ${migrationFile} rollback failed:`,
            error.message
          );
          throw error;
        }
      }
      console.log(`
\u{1F389} Rollback completed successfully!`);
    } catch (error) {
      console.error("\u274C Rollback failed:", error.message);
      throw error;
    }
  }
  async currentVersion() {
    try {
      const tableName = this.getFullTableName();
      const migrationTableExists = await this.knex.schema.hasTable(
        tableName
      );
      if (!migrationTableExists) {
        return null;
      }
      const result = await this.knex(tableName).select("NAME").orderBy("ID", "desc").first();
      return result?.NAME || null;
    } catch (error) {
      console.error("\u274C Error getting current version:", error.message);
      return null;
    }
  }
  async listExecuted() {
    try {
      const tableName = this.getFullTableName();
      const migrationTableExists = await this.knex.schema.hasTable(
        tableName
      );
      if (!migrationTableExists) {
        return [];
      }
      const completed = await this.knex(tableName).select("NAME").orderBy("ID");
      return completed.map((c) => c.NAME);
    } catch (error) {
      console.error("\u274C Error listing executed migrations:", error.message);
      return [];
    }
  }
  async listPending() {
    try {
      const allFiles = this.getMigrationFiles();
      const executed = await this.listExecuted();
      return allFiles.filter((file) => !executed.includes(file));
    } catch (error) {
      console.error("\u274C Error listing pending migrations:", error.message);
      return [];
    }
  }
  getMigrationFiles() {
    const { directory, extension } = this.config;
    if (!import_fs.default.existsSync(directory)) {
      throw new Error(`Migration directory does not exist: ${directory}`);
    }
    const validExtensions = ["js", "ts", "mjs", "cjs"];
    const extensionToCheck = extension || "js";
    return import_fs.default.readdirSync(directory).filter((file) => {
      if (extension && extension !== "js") {
        return file.endsWith(`.${extension}`);
      }
      return validExtensions.some((ext) => file.endsWith(`.${ext}`));
    }).sort();
  }
  getMigrationPath(filename) {
    return import_path.default.resolve(this.config.directory, filename);
  }
};
function createIBMiMigrationRunner(knex2, config) {
  return new IBMiMigrationRunner(knex2, config);
}

// src/cli.ts
function showHelp() {
  console.log("IBM i DB2 Migration CLI");
  console.log("=======================");
  console.log("");
  console.log("Commands:");
  console.log("  migrate:latest         - Run all pending migrations");
  console.log("  migrate:rollback       - Rollback the last migration batch");
  console.log("  migrate:status         - Show migration status");
  console.log("  migrate:currentVersion - Show current migration version");
  console.log("  migrate:list           - List all migrations");
  console.log("  migrate:make <name>    - Create a new migration file");
  console.log("");
  console.log("Legacy aliases:");
  console.log("  latest                 - Same as migrate:latest");
  console.log("  rollback               - Same as migrate:rollback");
  console.log("  status                 - Same as migrate:status");
  console.log("");
  console.log("Options:");
  console.log(
    "  --env <environment>    - Specify environment (default: development)"
  );
  console.log(
    "  --knexfile <file>      - Specify knexfile path (default: ./knexfile.js)"
  );
  console.log("  -x <extension>         - File extension for new migrations (js|ts)");
  console.log("  --help                 - Show this help message");
  console.log("");
  console.log("Examples:");
  console.log("  ibmi-migrations migrate:latest");
  console.log("  ibmi-migrations migrate:rollback");
  console.log("  ibmi-migrations migrate:status --env production");
  console.log("  ibmi-migrations migrate:make create_users_table");
  console.log("  ibmi-migrations migrate:make add_email_to_users -x ts");
  console.log("  ibmi-migrations latest --knexfile ./config/knexfile.js");
}
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    command: null,
    env: process.env.NODE_ENV || "development",
    knexfile: "./knexfile.js",
    help: false,
    extension: "js",
    migrationName: null
  };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
    } else if (arg === "--env" && args[i + 1]) {
      parsed.env = args[i + 1];
      i++;
    } else if (arg === "--knexfile" && args[i + 1]) {
      parsed.knexfile = args[i + 1];
      i++;
    } else if (arg === "-x" && args[i + 1]) {
      parsed.extension = args[i + 1];
      i++;
    } else if (!parsed.command) {
      parsed.command = arg;
    } else if (parsed.command === "migrate:make" && !parsed.migrationName) {
      parsed.migrationName = arg;
    }
  }
  return parsed;
}
function formatDate() {
  const now = /* @__PURE__ */ new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}
function getJsMigrationTemplate(migrationName) {
  return `/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = (knex) => {
  // Add your migration logic here
  // Example: return knex.schema.createTable("table_name", (table) => {
  //   table.increments("id").primary();
  //   table.string("name").notNullable();
  //   table.timestamps(true, true);
  // });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = (knex) => {
  // Add your rollback logic here
  // Example: return knex.schema.dropTable("table_name");
};
`;
}
function getTsMigrationTemplate(migrationName) {
  return `import { Knex } from "knex";

export const up = async (knex: Knex): Promise<void> => {
  // Add your migration logic here
  // Example: return knex.schema.createTable("table_name", (table) => {
  //   table.increments("id").primary();
  //   table.string("name").notNullable();
  //   table.timestamps(true, true);
  // });
};

export const down = async (knex: Knex): Promise<void> => {
  // Add your rollback logic here
  // Example: return knex.schema.dropTable("table_name");
};
`;
}
function createMigrationFile(migrationName, directory, extension) {
  if (!(0, import_fs2.existsSync)(directory)) {
    (0, import_fs2.mkdirSync)(directory, { recursive: true });
  }
  const timestamp = formatDate();
  const fileName = `${timestamp}_${migrationName}.${extension}`;
  const filePath = (0, import_path2.join)(directory, fileName);
  const template = extension === "ts" ? getTsMigrationTemplate(migrationName) : getJsMigrationTemplate(migrationName);
  (0, import_fs2.writeFileSync)(filePath, template);
  return filePath;
}
async function loadKnexfile(knexfilePath, environment) {
  try {
    const fullPath = (0, import_path2.resolve)(process.cwd(), knexfilePath);
    const fileUrl = (0, import_url.pathToFileURL)(fullPath).href;
    const knexfile = await import(`${fileUrl}?t=${Date.now()}`);
    const config = knexfile.default || knexfile;
    if (!config || typeof config !== "object") {
      throw new Error("Invalid knexfile format");
    }
    const envConfig = typeof config === "function" ? config() : config[environment];
    if (!envConfig) {
      throw new Error(`No configuration found for environment: ${environment}`);
    }
    return envConfig;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("\u274C Failed to load knexfile:", message);
    console.error(`Make sure you have a valid knexfile at: ${knexfilePath}`);
    process.exit(1);
  }
}
async function main() {
  const args = parseArgs();
  if (args.help) {
    showHelp();
    return;
  }
  if (!args.command) {
    console.error("\u274C No command specified");
    showHelp();
    process.exit(1);
  }
  let command = args.command;
  const legacyCommands = {
    latest: "migrate:latest",
    rollback: "migrate:rollback",
    status: "migrate:status"
  };
  if (legacyCommands[command]) {
    command = legacyCommands[command];
  }
  const validCommands = [
    "migrate:latest",
    "migrate:rollback",
    "migrate:status",
    "migrate:currentVersion",
    "migrate:list",
    "migrate:make"
  ];
  if (!validCommands.includes(command)) {
    console.error(`\u274C Unknown command: ${args.command}`);
    showHelp();
    process.exit(1);
  }
  if (command === "migrate:make") {
    if (!args.migrationName) {
      console.error("\u274C Migration name is required for migrate:make command");
      console.error("Usage: ibmi-migrations migrate:make <migration_name>");
      process.exit(1);
    }
    if (!["js", "ts"].includes(args.extension)) {
      console.error("\u274C Invalid extension. Use 'js' or 'ts'");
      process.exit(1);
    }
    try {
      const config2 = await loadKnexfile(args.knexfile, args.env);
      const migrationDir = config2.migrations?.directory || "./migrations";
      const filePath = createMigrationFile(
        args.migrationName,
        migrationDir,
        args.extension
      );
      console.log(`\u2705 Created migration file: ${filePath}`);
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("\u274C Failed to create migration:", message);
      process.exit(1);
    }
  }
  const config = await loadKnexfile(args.knexfile, args.env);
  const db = (0, import_knex.default)(config);
  try {
    const migrationConfig = {
      directory: config.migrations?.directory || "./migrations",
      tableName: config.migrations?.tableName || "KNEX_MIGRATIONS",
      schemaName: config.migrations?.schemaName,
      extension: config.migrations?.extension || "js"
    };
    const migrationRunner = createIBMiMigrationRunner(db, migrationConfig);
    switch (command) {
      case "migrate:latest":
        console.log("\u{1F680} Running pending migrations...");
        await migrationRunner.latest();
        break;
      case "migrate:rollback":
        const steps = parseInt(
          process.argv.find((arg, i) => process.argv[i - 1] === command)?.split(" ")[1] || "1"
        ) || 1;
        console.log(`\u{1F504} Rolling back ${steps} migration batch(es)...`);
        await migrationRunner.rollback(steps);
        break;
      case "migrate:status":
        console.log("\u{1F4CB} Migration Status Report");
        console.log("========================");
        const currentVersion = await migrationRunner.currentVersion();
        console.log("\u{1F4CC} Current version:", currentVersion || "None");
        const executed = await migrationRunner.listExecuted();
        console.log(`\u2705 Executed migrations (${executed.length}):`);
        if (executed.length > 0) {
          executed.forEach((migration, index) => {
            console.log(`   ${index + 1}. ${migration}`);
          });
        } else {
          console.log("   (none)");
        }
        const pending = await migrationRunner.listPending();
        console.log(`\u23F3 Pending migrations (${pending.length}):`);
        if (pending.length > 0) {
          pending.forEach((migration, index) => {
            console.log(`   ${index + 1}. ${migration}`);
          });
        } else {
          console.log("   (none)");
        }
        break;
      case "migrate:currentVersion":
        const version = await migrationRunner.currentVersion();
        console.log("\u{1F4CC} Current migration version:", version || "None");
        break;
      case "migrate:list":
        console.log("\u{1F4CB} All Migrations");
        console.log("=================");
        const allExecuted = await migrationRunner.listExecuted();
        const allPending = await migrationRunner.listPending();
        if (allExecuted.length > 0) {
          console.log("\u2705 Executed:");
          allExecuted.forEach((migration, index) => {
            console.log(`   ${index + 1}. ${migration}`);
          });
        }
        if (allPending.length > 0) {
          console.log("\u23F3 Pending:");
          allPending.forEach((migration, index) => {
            console.log(`   ${index + 1}. ${migration}`);
          });
        }
        if (allExecuted.length === 0 && allPending.length === 0) {
          console.log("   No migrations found");
        }
        break;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\u274C Command '${command}' failed:`, message);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}
main().catch((error) => {
  console.error(
    "\u274C CLI failed:",
    error instanceof Error ? error.message : String(error)
  );
  process.exit(1);
});
