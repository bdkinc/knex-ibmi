/**
 * IBM i DB2 Migration CLI
 *
 * A command-line interface for running migrations with knex-ibmi.
 * This bypasses Knex's problematic locking system that doesn't work with IBM i DB2.
 *
 * Usage:
 *   ibmi-migrations migrate:latest         - Run all pending migrations
 *   ibmi-migrations migrate:rollback       - Rollback the last migration batch
 *   ibmi-migrations migrate:status         - Show migration status
 *   ibmi-migrations migrate:currentVersion - Show current migration version
 *   ibmi-migrations migrate:list           - List all migrations
 *   ibmi-migrations migrate:make <name>    - Create new migration file
 *
 * Legacy aliases (for backward compatibility):
 *   ibmi-migrations latest    - Same as migrate:latest
 *   ibmi-migrations rollback  - Same as migrate:rollback
 *   ibmi-migrations status    - Same as migrate:status
 *
 * Options:
 *   --env <environment>     - Specify environment (default: development)
 *   --knexfile <file>       - Specify knexfile path (supports .js and .ts)
 *   -x <extension>          - File extension for new migrations (js|ts)
 *   --steps <number>        - Rollback this many migration batches
 *   --help                  - Show this help message
 *
 * TypeScript Support:
 *   The CLI can load TypeScript knexfiles and migrations when running under a
 *   TS-capable runtime (for example, Node with tsx import hook).
 *   Use --knexfile knexfile.ts to target a TypeScript configuration.
 *   Use -x ts when creating migrations to generate TypeScript files.
 */

import knex, { Knex } from "knex";
import { resolve, join } from "path";
import { pathToFileURL } from "url";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import {
  createIBMiMigrationRunner,
  type IBMiMigrationConfig,
} from "./migrations/ibmi-migration-runner.js";

interface ParsedArgs {
  command: string | null;
  env: string;
  knexfile: string;
  help: boolean;
  extension: string;
  steps: number;
  migrationName: string | null;
}

interface KnexfileConfig extends Knex.Config {
  migrations?: {
    directory?: string;
    tableName?: string;
    schemaName?: string;
    extension?: string;
  };
}

function showHelp(): void {
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
    "  --env <environment>    - Specify environment (default: development)",
  );
  console.log(
    "  --knexfile <file>      - Specify knexfile path (default: ./knexfile.js)",
  );
  console.log("                         - Supports both .js and .ts knexfiles");
  console.log(
    "  -x <extension>         - File extension for new migrations (js|ts)",
  );
  console.log(
    "  --steps <number>       - Number of migration batches to rollback",
  );
  console.log("  --help                 - Show this help message");
  console.log("");
  console.log("Examples:");
  console.log("  ibmi-migrations migrate:latest");
  console.log("  ibmi-migrations migrate:rollback");
  console.log("  ibmi-migrations migrate:rollback --steps 2");
  console.log("  ibmi-migrations migrate:status --env production");
  console.log("  ibmi-migrations migrate:latest --knexfile knexfile.ts");
  console.log("  ibmi-migrations migrate:make create_users_table");
  console.log("  ibmi-migrations migrate:make add_email_to_users -x ts");
  console.log("  ibmi-migrations latest --knexfile ./config/knexfile.js");
}

function parseArgs(): ParsedArgs {
  const args = process.argv.slice(2);
  const parsed: ParsedArgs = {
    command: null,
    env: process.env.NODE_ENV || "development",
    knexfile: "./knexfile.js",
    help: false,
    extension: "js",
    steps: 1,
    migrationName: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
    } else if (arg === "--env" && args[i + 1]) {
      parsed.env = args[i + 1];
      i++; // Skip next arg
    } else if (arg === "--knexfile" && args[i + 1]) {
      parsed.knexfile = args[i + 1];
      i++; // Skip next arg
    } else if (arg === "-x" && args[i + 1]) {
      parsed.extension = args[i + 1];
      i++; // Skip next arg
    } else if ((arg === "--steps" || arg === "-s") && args[i + 1]) {
      const parsedSteps = Number.parseInt(args[i + 1], 10);
      if (!Number.isNaN(parsedSteps) && parsedSteps > 0) {
        parsed.steps = parsedSteps;
      }
      i++; // Skip next arg
    } else if (!parsed.command) {
      parsed.command = arg;
    } else if (
      parsed.command === "migrate:rollback" &&
      /^\d+$/.test(arg) &&
      parsed.steps === 1
    ) {
      // Backward-compatible positional rollback steps: `migrate:rollback 2`
      parsed.steps = Number.parseInt(arg, 10);
    } else if (parsed.command === "migrate:make" && !parsed.migrationName) {
      parsed.migrationName = arg;
    }
  }

  return parsed;
}

function formatDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

function getJsMigrationTemplate(_migrationName: string): string {
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

function getTsMigrationTemplate(_migrationName: string): string {
  return `import type { Knex } from "knex";

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

function createMigrationFile(
  migrationName: string,
  directory: string,
  extension: string,
): string {
  // Ensure migrations directory exists
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }

  const timestamp = formatDate();
  const fileName = `${timestamp}_${migrationName}.${extension}`;
  const filePath = join(directory, fileName);

  const template =
    extension === "ts"
      ? getTsMigrationTemplate(migrationName)
      : getJsMigrationTemplate(migrationName);

  writeFileSync(filePath, template);

  return filePath;
}

async function loadKnexfile(
  knexfilePath: string,
  environment: string,
): Promise<KnexfileConfig> {
  try {
    const fullPath = resolve(process.cwd(), knexfilePath);
    const fileUrl = pathToFileURL(fullPath).href;

    // Add timestamp to bypass import cache
    const knexfile = await import(`${fileUrl}?t=${Date.now()}`);
    const config = knexfile.default || knexfile;

    if (!config || typeof config !== "object") {
      throw new Error("Invalid knexfile format");
    }

    // Handle both object-style and function-style knexfiles
    const envConfig =
      typeof config === "function" ? config() : config[environment];

    if (!envConfig) {
      throw new Error(`No configuration found for environment: ${environment}`);
    }

    return envConfig as KnexfileConfig;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const tsFile = knexfilePath.toLowerCase().endsWith(".ts");
    if (
      tsFile &&
      (message.includes("Unknown file extension") ||
        message.includes("Cannot use import statement") ||
        message.includes("Unexpected token"))
    ) {
      console.error("❌ Failed to load TypeScript knexfile:", knexfilePath);
      console.error(
        "Run with a TS-capable runtime loader (for example: `node --import tsx`) or use a compiled JavaScript knexfile.",
      );
      process.exit(1);
    }

    console.error("❌ Failed to load knexfile:", message);
    console.error(`Make sure you have a valid knexfile at: ${knexfilePath}`);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const args = parseArgs();

  if (args.help) {
    showHelp();
    return;
  }

  if (!args.command) {
    console.error("❌ No command specified");
    showHelp();
    process.exit(1);
  }

  // Normalize command (handle legacy aliases)
  let command = args.command;
  const legacyCommands: Record<string, string> = {
    latest: "migrate:latest",
    rollback: "migrate:rollback",
    status: "migrate:status",
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
    "migrate:make",
  ];

  if (!validCommands.includes(command)) {
    console.error(`❌ Unknown command: ${args.command}`);
    showHelp();
    process.exit(1);
  }

  // Handle migrate:make command separately (doesn't need database connection)
  if (command === "migrate:make") {
    if (!args.migrationName) {
      console.error("❌ Migration name is required for migrate:make command");
      console.error("Usage: ibmi-migrations migrate:make <migration_name>");
      process.exit(1);
    }

    // Validate extension
    if (!["js", "ts"].includes(args.extension)) {
      console.error("❌ Invalid extension. Use 'js' or 'ts'");
      process.exit(1);
    }

    try {
      const config = await loadKnexfile(args.knexfile, args.env);
      const migrationDir = config.migrations?.directory || "./migrations";

      const filePath = createMigrationFile(
        args.migrationName,
        migrationDir,
        args.extension,
      );

      console.log(`✅ Created migration file: ${filePath}`);
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("❌ Failed to create migration:", message);
      process.exit(1);
    }
  }

  const config = await loadKnexfile(args.knexfile, args.env);
  const db = knex(config);

  try {
    // Create migration runner with configuration from knexfile
    const migrationConfig: Partial<IBMiMigrationConfig> = {
      directory: config.migrations?.directory || "./migrations",
      tableName: config.migrations?.tableName || "KNEX_MIGRATIONS",
      schemaName: config.migrations?.schemaName,
      extension: config.migrations?.extension || "js",
    };

    const migrationRunner = createIBMiMigrationRunner(db, migrationConfig);

    switch (command) {
      case "migrate:latest":
        console.log("🚀 Running pending migrations...");
        await migrationRunner.latest();
        break;

      case "migrate:rollback":
        console.log(`🔄 Rolling back ${args.steps} migration batch(es)...`);
        await migrationRunner.rollback(args.steps);
        break;

      case "migrate:status":
        console.log("📋 Migration Status Report");
        console.log("========================");

        const currentVersion = await migrationRunner.currentVersion();
        console.log("📌 Current version:", currentVersion || "None");

        const executed = await migrationRunner.listExecuted();
        console.log(`✅ Executed migrations (${executed.length}):`);
        if (executed.length > 0) {
          executed.forEach((migration, index) => {
            console.log(`   ${index + 1}. ${migration}`);
          });
        } else {
          console.log("   (none)");
        }

        const pending = await migrationRunner.listPending();
        console.log(`⏳ Pending migrations (${pending.length}):`);
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
        console.log("📌 Current migration version:", version || "None");
        break;

      case "migrate:list":
        console.log("📋 All Migrations");
        console.log("=================");

        const allExecuted = await migrationRunner.listExecuted();
        const allPending = await migrationRunner.listPending();

        if (allExecuted.length > 0) {
          console.log("✅ Executed:");
          allExecuted.forEach((migration, index) => {
            console.log(`   ${index + 1}. ${migration}`);
          });
        }

        if (allPending.length > 0) {
          console.log("⏳ Pending:");
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
    console.error(`❌ Command '${command}' failed:`, message);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

main().catch((error) => {
  console.error(
    "❌ CLI failed:",
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
});
