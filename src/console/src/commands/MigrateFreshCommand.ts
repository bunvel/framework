import { ConfigServiceProvider } from "@bunvel/config";
import { Application } from "@bunvel/core";
import { type Database, DatabaseServiceProvider } from "@bunvel/database";
import { Logger } from "@bunvel/log";
import { Command } from "../command";
import InstallMigrationCommand from "./InstallMigrationCommand";
import MigrateCommand from "./MigrateCommand";

class MigrateFreshCommand extends Command {
  private connection: Database | null = null;

  constructor() {
    super("migrate:fresh", "Drop all tables and re-run all migrations");
  }

  async handle(): Promise<void> {
    this.connection = await this.connectToDatabase();
    if (!this.connection) {
      Logger.error("Failed to connect to the database.");
      return;
    }

    // Drop all tables
    await this.dropAllTables();

    const migrateInstall = new InstallMigrationCommand();
    await migrateInstall.handle();

    // Re-run all migrations
    const migrateCommand = new MigrateCommand();
    await migrateCommand.handle();
    Logger.info("Database fresh and migrations re-applied successfully.");
  }

  private async dropAllTables(): Promise<void> {
    try {
      const tables = await this.getAllTables();
      for (const table of tables) {
        await this.connection!.query(`DROP TABLE IF EXISTS \`${table}\``);
        Logger.info(`Dropped table: ${table}`);
      }
    } catch (error: any) {
      Logger.error("Error dropping tables:", error);
    }
  }

  private async getAllTables(): Promise<string[]> {
    const result = await this.connection!.query("SHOW TABLES");
    return result.map((row: any) => Object.values(row)[0]);
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

export default MigrateFreshCommand;
