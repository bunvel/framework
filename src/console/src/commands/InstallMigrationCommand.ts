import { type Database } from "../../../database";
import { Logger } from "../../../log";
import { Command } from "../command";
import {
  connectToDatabase,
  createMigrationTable,
} from "../utils/database_helper";

class InstallMigrationCommand extends Command {
  private connection: Database | null = null;

  constructor() {
    super("migrate:install", "Install the migration tracking table");
  }

  async handle(): Promise<void> {
    this.connection = await connectToDatabase();
    if (!this.connection) {
      Logger.error("Failed to connect to the database.");
      return;
    }

    try {
      await createMigrationTable(this.connection);
      Logger.info("Migration table created successfully.");
    } catch (error) {
      Logger.error(`Error creating migration table: ${error}`);
    }
  }
}

export default InstallMigrationCommand;
