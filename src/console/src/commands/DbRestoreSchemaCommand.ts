import { readFileSync } from "fs";
import { join } from "path";
import readline from "readline";
import { Application, Config, Logger } from "../../../core";
import { DatabaseServiceProvider, type Database } from "../../../database";
import { Command } from "../command";

class DbRestoreSchemaCommand extends Command {
  constructor() {
    super("db:restore", "Restore the database schema from a file");
  }

  async handle(): Promise<void> {
    const fileName = this.getFileNameFromArgs();
    if (!fileName) {
      Logger.error("Please provide a file name for the restore.");
      return;
    }

    const filePath = join(process.cwd(), "database", fileName);

    const connection = await this.connectToDatabase();
    if (!connection) {
      Logger.error("Failed to connect to the database.");
      return;
    }

    try {
      const dbType = await Config.string("database.default");

      // Check for existing tables
      const existingTables = await this.getExistingTables(connection);
      if (existingTables.length > 0) {
        const userConfirmed = await this.confirmTableDeletion(existingTables);
        if (!userConfirmed) {
          Logger.error("Aborted schema restoration.");
          return;
        }

        // Drop existing tables
        await this.dropTables(connection, existingTables);
      }

      // Restore schema
      const schemaContent = readFileSync(filePath, "utf-8");
      switch (dbType) {
        case "mysql":
        case "mariadb":
        case "pgsql":
        case "sqlite":
          await this.restoreSchema(connection, schemaContent);
          break;
        default:
          throw new Error(`Unsupported database type: ${dbType}`);
      }

      Logger.info(`Schema restored from [${filePath}]`);
    } catch (error: any) {
      Logger.error("Error restoring schema:", error);
    } finally {
      process.exit(0);
    }
  }

  private getFileNameFromArgs(): string | null {
    const args = process.argv.slice(2);
    return args.length > 1 ? args[1] : null;
  }

  private async connectToDatabase() {
    try {
      const app = Application.getInstance();
      await app.register([DatabaseServiceProvider]);
      await app.boot();

      const connection: Database = await app.make("database");
      return connection;
    } catch (error: any) {
      Logger.error("Database connection failed:", error);
      return null;
    }
  }

  private async getExistingTables(connection: Database): Promise<string[]> {
    try {
      const result = await connection.query("SHOW TABLES");
      return result.map((row: any) => Object.values(row)[0]);
    } catch (error: any) {
      Logger.error("Error fetching existing tables:", error);
      return [];
    }
  }

  private async confirmTableDeletion(tables: string[]): Promise<boolean> {
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      Logger.warning("The following tables exist in the database:");
      tables.forEach((table) => console.log(`- ${table}`));
      rl.question(
        "Do you want to delete these tables and restore the schema? (yes/no): ",
        (answer) => {
          rl.close();
          resolve(answer.toLowerCase() === "yes");
        }
      );
    });
  }

  private async dropTables(
    connection: Database,
    tables: string[]
  ): Promise<void> {
    for (const table of tables) {
      try {
        await connection.query(`DROP TABLE ${table}`);
        Logger.info(`Dropped table ${table}`);
      } catch (error: any) {
        Logger.error(`Error dropping table ${table}:`, error);
        throw error;
      }
    }
  }

  private async restoreSchema(
    connection: Database,
    schemaContent: string
  ): Promise<void> {
    const statements = schemaContent.split(";").filter((stmt) => stmt.trim());

    for (const statement of statements) {
      try {
        await connection.query(statement + ";");
      } catch (error: any) {
        Logger.error("Error executing SQL statement:", { statement, error });
        throw error;
      }
    }
  }
}

export default DbRestoreSchemaCommand;
