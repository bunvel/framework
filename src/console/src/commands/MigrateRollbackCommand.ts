import { join, resolve } from "path";

import { type Database, Migration, Schema } from "../../../database";
import { Logger } from "../../../log";
import { databasePath } from "../../../support";
import { Command } from "../command";
import { connectToDatabase } from "../utils/database_helper";

class MigrateRollbackCommand extends Command {
  private connection: Database | null = null;

  constructor() {
    super("migrate:rollback", "Rollback the last migration batch");
  }

  async handle(): Promise<void> {
    this.connection = await connectToDatabase();
    if (!this.connection) {
      Logger.error("Failed to connect to the database.");
      return;
    }

    const lastBatch = await this.getLastBatchMigrations();
    if (lastBatch.length === 0) {
      Logger.info("No migrations to rollback.");
      return;
    }

    for (const migration of lastBatch) {
      const { migration: file } = migration;
      const migrationClass = await this.loadMigrationClass(file);

      if (!migrationClass) continue;

      try {
        const schema = new Schema(this.connection);
        const migrationInstance: Migration = new migrationClass(schema);
        await migrationInstance.down();
        await this.removeMigrationRecord(file);
        Logger.info(`Rolled back migration: [${file}]`);
        process.exit(0);
      } catch (error: any) {
        Logger.error(`Error rolling back migration ${file}:`, error);
        break;
      }
    }
  }

  private async getLastBatchMigrations(): Promise<any[]> {
    return await this.connection!.query(
      "SELECT migration FROM migrations WHERE batch = (SELECT MAX(batch) FROM migrations)"
    );
  }

  private async removeMigrationRecord(migrationFile: string): Promise<void> {
    await this.connection!.query("DELETE FROM migrations WHERE migration = ?", [
      migrationFile,
    ]);
  }

  private async loadMigrationClass(file: string): Promise<any> {
    const filePath = resolve(join(databasePath("migrations"), file));

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
}

export default MigrateRollbackCommand;
