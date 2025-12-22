import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { Knex } from "knex";

export interface IBMiMigrationConfig {
  directory: string;
  tableName: string;
  schemaName?: string;
  extension?: string;
}

export class IBMiMigrationRunner {
  private knex: Knex;
  private config: IBMiMigrationConfig;

  constructor(knex: Knex, config?: Partial<IBMiMigrationConfig>) {
    this.knex = knex;

    // Default configuration
    this.config = {
      directory: "./migrations",
      tableName: "KNEX_MIGRATIONS",
      schemaName: undefined,
      extension: "js",
      ...config,
    };
  }

  private getFullTableName(): string {
    return this.config.schemaName
      ? `${this.config.schemaName}.${this.config.tableName}`
      : this.config.tableName;
  }

  async latest(): Promise<void> {
    try {
      console.log(
        "🚀 IBM i DB2 Migration Runner - bypassing Knex locking system",
      );

      // Ensure the migration table exists
      const tableName = this.getFullTableName();

      const migrationTableExists = await (this.knex as any).schema.hasTable(
        tableName,
      );
      if (!migrationTableExists) {
        console.log(`📝 Creating migration table: ${tableName}`);
        await (this.knex as any).schema.createTable(tableName, (table: any) => {
          table.increments("id").primary();
          table.string("name").unique(); // Prevent duplicate migration names
          table.integer("batch");
          table.timestamp("migration_time");
        });
        console.log("✅ Migration table created");
      }

      // Get completed migrations (IBM i uses uppercase column names)
      const completed = await this.knex(tableName).select("NAME").orderBy("ID");
      const completedNames = completed.map((c: any) => c.NAME);
      console.log(`📋 Found ${completedNames.length} completed migrations`);

      // Get migration files
      const migrationFiles = this.getMigrationFiles();
      console.log(`📁 Found ${migrationFiles.length} migration files`);

      // Find new migrations to run
      const newMigrations = migrationFiles.filter(
        (file) => !completedNames.includes(file),
      );

      if (newMigrations.length === 0) {
        console.log("✅ No new migrations to run");
        return;
      }

      console.log(`🎯 Running ${newMigrations.length} new migrations:`);
      newMigrations.forEach((file) => console.log(`  - ${file}`));

      // Get next batch number (IBM i uses uppercase column names)
      const batchResult = await this.knex(tableName).max("BATCH as max_batch");
      const nextBatch = (batchResult[0]?.max_batch || 0) + 1;
      console.log(`📊 Using batch number: ${nextBatch}`);

      // Run each migration
      for (const migrationFile of newMigrations) {
        console.log(`\n🔄 Running migration: ${migrationFile}`);

        try {
          // Import the migration with cache busting to ensure fresh imports
          const migrationPath = this.getMigrationPath(migrationFile);
          const fileUrl = pathToFileURL(migrationPath).href;
          const migration = await import(`${fileUrl}?t=${Date.now()}`);

          if (!migration.up || typeof migration.up !== "function") {
            throw new Error(`Migration ${migrationFile} has no 'up' function`);
          }

          // Execute the migration
          console.log(`  ⚡ Executing migration...`);
          await migration.up(this.knex);

          // Record the migration
          await this.knex(tableName).insert({
            name: migrationFile,
            batch: nextBatch,
            migration_time: new Date(),
          });

          console.log(`  ✅ Migration ${migrationFile} completed successfully`);
        } catch (error: any) {
          console.error(
            `  ❌ Migration ${migrationFile} failed:`,
            error.message,
          );
          throw error;
        }
      }

      console.log(`\n🎉 All migrations completed successfully!`);
    } catch (error: any) {
      console.error("❌ Migration runner failed:", error.message);
      throw error;
    }
  }

  async rollback(steps: number = 1): Promise<void> {
    try {
      console.log(`🔄 Rolling back ${steps} migration batch(es)...`);

      const tableName = this.getFullTableName();

      // Get the last batch(es) to rollback
      const batchesToRollback = await this.knex(tableName)
        .distinct("BATCH")
        .orderBy("BATCH", "desc")
        .limit(steps);

      if (batchesToRollback.length === 0) {
        console.log("✅ No migrations to rollback");
        return;
      }

      const batchNumbers = batchesToRollback.map((b: any) => b.BATCH);
      console.log(`📊 Rolling back batches: ${batchNumbers.join(", ")}`);

      // Get migrations to rollback
      const migrationsToRollback = await this.knex(tableName)
        .select("NAME")
        .whereIn("BATCH", batchNumbers)
        .orderBy("ID", "desc");

      console.log(`🎯 Rolling back ${migrationsToRollback.length} migrations:`);
      migrationsToRollback.forEach((m: any) => console.log(`  - ${m.NAME}`));

      // Rollback each migration
      for (const migrationRecord of migrationsToRollback) {
        const migrationFile = migrationRecord.NAME;
        console.log(`\n🔄 Rolling back migration: ${migrationFile}`);

        try {
          // Import the migration with cache busting to ensure fresh imports
          const migrationPath = this.getMigrationPath(migrationFile);
          const fileUrl = pathToFileURL(migrationPath).href;
          const migration = await import(`${fileUrl}?t=${Date.now()}`);

          if (migration.down && typeof migration.down === "function") {
            console.log(`  ⚡ Executing rollback...`);
            await migration.down(this.knex);
          } else {
            console.log(
              `  ⚠️ Migration ${migrationFile} has no 'down' function, skipping rollback`,
            );
          }

          // Remove the migration record
          await this.knex(tableName).where("NAME", migrationFile).del();

          console.log(
            `  ✅ Migration ${migrationFile} rolled back successfully`,
          );
        } catch (error: any) {
          console.error(
            `  ❌ Migration ${migrationFile} rollback failed:`,
            error.message,
          );
          throw error;
        }
      }

      console.log(`\n🎉 Rollback completed successfully!`);
    } catch (error: any) {
      console.error("❌ Rollback failed:", error.message);
      throw error;
    }
  }

  async currentVersion(): Promise<string | null> {
    try {
      const tableName = this.getFullTableName();

      const migrationTableExists = await (this.knex as any).schema.hasTable(
        tableName,
      );
      if (!migrationTableExists) {
        return null;
      }

      const result = await this.knex(tableName)
        .select("NAME")
        .orderBy("ID", "desc")
        .first();

      return result?.NAME || null;
    } catch (error: any) {
      console.error("❌ Error getting current version:", error.message);
      return null;
    }
  }

  async listExecuted(): Promise<string[]> {
    try {
      const tableName = this.getFullTableName();

      const migrationTableExists = await (this.knex as any).schema.hasTable(
        tableName,
      );
      if (!migrationTableExists) {
        return [];
      }

      const completed = await this.knex(tableName).select("NAME").orderBy("ID");
      return completed.map((c: any) => c.NAME);
    } catch (error: any) {
      console.error("❌ Error listing executed migrations:", error.message);
      return [];
    }
  }

  async listPending(): Promise<string[]> {
    try {
      const allFiles = this.getMigrationFiles();
      const executed = await this.listExecuted();
      return allFiles.filter((file) => !executed.includes(file));
    } catch (error: any) {
      console.error("❌ Error listing pending migrations:", error.message);
      return [];
    }
  }

  private getMigrationFiles(): string[] {
    const { directory, extension } = this.config;

    if (!fs.existsSync(directory)) {
      throw new Error(`Migration directory does not exist: ${directory}`);
    }

    // Support multiple extensions by checking for common migration file extensions
    const validExtensions = ["js", "ts", "mjs", "cjs"];
    return fs
      .readdirSync(directory)
      .filter((file) => {
        // If a specific extension is configured, use only that
        if (extension && extension !== "js") {
          return file.endsWith(`.${extension}`);
        }
        // Otherwise, check for any valid migration extension
        return validExtensions.some((ext) => file.endsWith(`.${ext}`));
      })
      .sort();
  }

  private getMigrationPath(filename: string): string {
    return path.resolve(this.config.directory, filename);
  }
}

// Export a factory function for easy instantiation
export function createIBMiMigrationRunner(
  knex: Knex,
  config?: Partial<IBMiMigrationConfig>,
): IBMiMigrationRunner {
  return new IBMiMigrationRunner(knex, config);
}
