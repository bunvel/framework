import chalk from "chalk";
import { Application } from "../../../core";

import { ConfigServiceProvider } from "../../../config";
import { type Database, DatabaseServiceProvider } from "../../../database";
import { Command } from "../command";

class DBDescribeCommand extends Command {
  private connection: Database | null = null;

  constructor() {
    super("db:describe", "Display the structure of a specified database table");
  }

  async handle(args: any = {}): Promise<void> {
    this.connection = await this.connectToDatabase();
    if (!this.connection) {
      console.error(chalk.red("Failed to connect to the database."));
      return;
    }
    const result = await this.connection.query(
      `DESCRIBE ${args["positionals"][0]}`
    );
    console.table(result);
    process.exit(0);
  }

  private async connectToDatabase() {
    try {
      const app = Application.getInstance();
      await app.register([ConfigServiceProvider, DatabaseServiceProvider]);
      await app.boot();

      const connection: Database = await app.make("database");
      return connection;
    } catch (error) {
      console.error(chalk.red("Database connection failed:"), error);
      return null;
    }
  }
}

export default DBDescribeCommand;
