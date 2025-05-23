import { join, resolve } from "path";

import { type Database, Migration, Schema } from "../../../database";
import { Logger } from "../../../log";
import { databasePath } from "../../../support";
import { Command } from "../command";
import { connectToDatabase } from "../utils/database_helper";
import MigrateCommand from "./MigrateCommand";

class MigrateRefreshCommand extends Command {
  private connection: Database | null = null;

  constructor() {
    super("migrate:refresh", "Rollback all migrations and re-run them");
  }

  async handle(): Promise<void> {
    this.connection = await connectToDatabase();
    if (!this.connection) {
      Logger.error("Failed to connect to the database.");
      return;
    }

    // Rollback all migrations
    await this.rollbackAll();

    // Re-run all migrations
    const migrateCommand = new MigrateCommand();
    await migrateCommand.handle();
    Logger.info("Migrations refreshed successfully.");
  }

  private async rollbackAll(): Promise<void> {
    const lastBatchNumber = await this.getLastBatchNumber();
    if (lastBatchNumber === null) {
      Logger.error("No migrations to rollback.");
      return;
    }

    // Get all migrations in reverse order
    for (let batch = lastBatchNumber; batch >= 1; batch--) {
      const migrations = await this.getMigrationsInBatch(batch);
      for (const migration of migrations) {
        await this.rollbackMigration(migration.migration);
      }
    }
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
    const migrationsDir = databasePath("migrations");
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
}

export default MigrateRefreshCommand;
