import { ConfigServiceProvider } from "../../../config";
import { Application } from "../../../core";
import { type Database, DatabaseServiceProvider } from "../../../database";
import { Config } from "../../../facade";
import { Logger } from "../../../log";
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
  }

  private async dropAllTables(): Promise<void> {
    try {
      const tables = await this.getAllTables();
      for (const table of tables) {
        await this.connection!.query(`DROP TABLE IF EXISTS ${table}`);
        Logger.info(`Dropped table: ${table}`);
      }
    } catch (error: any) {
      Logger.error("Error dropping tables:", error);
    }
  }

  private async getAllTables(): Promise<string[]> {
    let sql = "";

    const database = await Config.get("database.default");
    const databaseName = await Config.get(
      "database.connections." + database + ".database"
    );

    switch (database) {
      case "mysql":
        sql = `SHOW TABLES FROM \`${databaseName}\``;
        break;

      case "postgresql":
        sql = `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
        break;

      case "sqlite":
        sql = `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`;
        break;

      default:
        throw new Error("Unsupported database driver");
    }

    try {
      const result = await this.connection?.query(sql);
      if (!result) {
        throw new Error("Error getting tables: " + sql);
      }
      return result.map((row: any) => Object.values(row)[0]);
    } catch (error) {
      throw new Error("Error getting tables: " + error);
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

export default MigrateFreshCommand;
