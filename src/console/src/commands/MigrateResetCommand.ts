import { join, resolve } from "path";
import { Application } from "../../../core";

import { ConfigServiceProvider } from "../../../config";
import {
  type Database,
  DatabaseServiceProvider,
  Migration,
  Schema,
} from "../../../database";
import { Logger } from "../../../log";
import { Command } from "../command";

class MigrateResetCommand extends Command {
  private connection: Database | null = null;

  constructor() {
    super("migrate:reset", "Rollback all migrations");
  }

  async handle(): Promise<void> {
    this.connection = await this.connectToDatabase();
    if (!this.connection) {
      Logger.error("Failed to connect to the database.");
      return;
    }

    // Rollback all migrations
    await this.rollbackAll();
  }

  private async rollbackAll(): Promise<void> {
    const lastBatchNumber = await this.getLastBatchNumber();
    if (lastBatchNumber === null) {
      Logger.info("No migrations to rollback.");
      return;
    }

    // Get all migrations in reverse order
    for (let batch = lastBatchNumber; batch >= 1; batch--) {
      const migrations = await this.getMigrationsInBatch(batch);
      for (const migration of migrations) {
        await this.rollbackMigration(migration.migration);
      }
    }
    Logger.info("All migrations rolled back successfully.");
  }

  private async getLastBatchNumber(): Promise<number | null> {
    const result = await this.connection!.query(
      "SELECT MAX(batch) AS maxBatch FROM migrations"
    );
    return result[0]?.maxBatch || null;
  }

  private async getMigrationsInBatch(batch: number): Promise<any[]> {
    return await this.connection!.query(
      "SELECT migration FROM migrations WHERE batch = ?",
      [batch]
    );
  }

  private async rollbackMigration(migrationFile: string): Promise<void> {
    const migrationClass = await this.loadMigrationClass(migrationFile);
    if (!migrationClass) return;

    try {
      if (!this.connection) {
        Logger.error("Failed to connect to the database.");
        return;
      }

      const schema = new Schema(this.connection);
      const migrationInstance: Migration = new migrationClass(schema);
      await migrationInstance.down();
      await this.removeMigrationRecord(migrationFile);
      Logger.info(`Rolled back migration: [${migrationFile}]`);
    } catch (error: any) {
      Logger.error(`Error rolling back migration ${migrationFile}:`, error);
    }
  }

  private async loadMigrationClass(file: string): Promise<any> {
    const migrationsDir = join(process.cwd(), "database", "migrations");
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

  private async removeMigrationRecord(migrationFile: string): Promise<void> {
    await this.connection!.query("DELETE FROM migrations WHERE migration = ?", [
      migrationFile,
    ]);
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

export default MigrateResetCommand;
