import { Logger } from "@bunvel/support";
import { ConfigServiceProvider } from "../../../config";
import { Application } from "../../../core";
import { type Database, DatabaseServiceProvider } from "../../../database";
import { Command } from "../command";

class InstallMigrationCommand extends Command {
  private connection: Database | null = null;

  constructor() {
    super("migrate:install", "Install the migration tracking table");
  }

  async handle(): Promise<void> {
    this.connection = await this.connectToDatabase();
    if (!this.connection) {
      Logger.error("Failed to connect to the database.");
      return;
    }

    try {
      await this.createMigrationTable(this.connection);
      Logger.info("Migration tracking table created successfully.");
    } catch (error) {
      Logger.error(`Error creating migration tracking table: ${error}`);
    }
  }

  private async createMigrationTable(adapter: Database): Promise<void> {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        migration VARCHAR(255) NOT NULL UNIQUE,
        batch INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await adapter.query(createTableQuery);
  }

  private async connectToDatabase() {
    try {
      const app = Application.getInstance();
      await app.register([ConfigServiceProvider, DatabaseServiceProvider]);
      await app.boot();

      const connection: Database = await app.make("database");
      return connection;
    } catch (error) {
      Logger.error("Database connection failed:");
      return null;
    }
  }
}

export default InstallMigrationCommand;
