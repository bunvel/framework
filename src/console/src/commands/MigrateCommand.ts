import { ConfigServiceProvider } from "@bunvel/config";
import { Application } from "@bunvel/core";
import { Logger } from "@bunvel/log";
import { readdirSync } from "fs";
import { join, resolve } from "path";
import {
  type Database,
  DatabaseServiceProvider,
  Migration,
  Schema,
} from "../../../database";
import { Command } from "../command";

class MigrateCommand extends Command {
  private connection: Database | null = null;

  constructor() {
    super("migrate", "Run database migrations");
  }

  async handle(): Promise<void> {
    const migrationsDir = join(process.cwd(), "database", "migrations");
    const migrationFiles = this.getMigrationFiles(migrationsDir);

    if (migrationFiles.length === 0) {
      Logger.error("No migrations found.");
      return;
    }

    this.connection = await this.connectToDatabase();
    if (!this.connection) {
      Logger.error("Failed to connect to the database.");
      return;
    }

    const executedMigrations = await this.getExecutedMigrations();
    const currentBatch = await this.getCurrentBatchNumber();

    for (const file of migrationFiles) {
      if (executedMigrations.includes(file)) {
        continue;
      }

      const migrationClass = await this.loadMigrationClass(migrationsDir, file);

      if (!migrationClass) continue;

      try {
        const schema = new Schema(this.connection);
        const migration: Migration = new migrationClass(schema);
        await migration.up();
        await this.recordMigration(file, currentBatch + 1);
        Logger.info(`Migration completed: [${file}]`);
      } catch (error: any) {
        Logger.error(`Error running migration ${file}:`, error);
        break;
      }
    }
  }

  private getMigrationFiles(migrationsDir: string): string[] {
    return readdirSync(migrationsDir).filter(
      (file) => file.endsWith(".ts") || file.endsWith(".js")
    );
  }

  private async getExecutedMigrations(): Promise<string[]> {
    const result = await this.connection!.query(
      "SELECT migration FROM migrations"
    );
    return result.map((row: any) => row.migration);
  }

  private async getCurrentBatchNumber(): Promise<number> {
    const result = await this.connection!.query(
      "SELECT MAX(batch) AS maxBatch FROM migrations"
    );
    const maxBatch = result[0]?.maxBatch;
    return maxBatch ? maxBatch : 0;
  }

  private async recordMigration(
    migrationFile: string,
    batchNumber: number
  ): Promise<void> {
    const query = `
      INSERT INTO migrations (migration, batch) 
      VALUES (?, ?) 
      ON DUPLICATE KEY UPDATE batch = VALUES(batch)
    `;
    await this.connection!.query(query, [migrationFile, batchNumber]);
  }

  private async loadMigrationClass(
    migrationsDir: string,
    file: string
  ): Promise<any> {
    const filePath = resolve(join(migrationsDir, file));

    try {
      const module = await import(filePath);
      const migrationClass = Object.values(module).find(
        (value) =>
          typeof value === "function" && value.prototype instanceof Migration
      );
      if (!migrationClass) {
        Logger.error(`No migration class found in ${file}`);
        return null;
      }
      return migrationClass;
    } catch (error: any) {
      Logger.error(`Failed to load migration ${file}:`, error);
      return null;
    }
  }

  private async connectToDatabase(): Promise<Database | null> {
    try {
      const app = Application.getInstance();
      await app.register([ConfigServiceProvider, DatabaseServiceProvider]);
      await app.boot();
      return await app.make<Database>("database");
    } catch (error: any) {
      Logger.error("Database connection failed:", error);
      return null;
    }
  }
}

export default MigrateCommand;
