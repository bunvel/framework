import { Logger } from "@bunvel/support";
import Table from "cli-table3";
import { Application } from "../../../core";
import { DatabaseServiceProvider, type Database } from "../../../database";
import { Command } from "../command";

class DbTablesCommand extends Command {
  constructor() {
    super("db:tables", "List all tables in the database with their details");
  }

  async handle(): Promise<void> {
    const connection = await this.connectToDatabase();
    if (!connection) {
      Logger.error("Failed to connect to the database.");
      return;
    }

    try {
      const tables = await this.getTables(connection);
      const tableDetails = await Promise.all(
        tables.map(async (table) => {
          const [count, size] = await Promise.all([
            this.getTableRowCount(connection, table),
            this.getTableSize(connection, table),
          ]);
          return { table, count, size };
        })
      );

      this.printTableDetails(tableDetails);
    } catch (error: any) {
      Logger.error("Error fetching table details:", error);
    }
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

  private async getTables(connection: Database): Promise<string[]> {
    const result = await connection.query("SHOW TABLES");
    return result.map((row: any) => Object.values(row)[0]);
  }

  private async getTableRowCount(
    connection: Database,
    tableName: string
  ): Promise<number> {
    const result = await connection.query(
      `SELECT COUNT(*) AS count FROM \`${tableName}\``
    );
    return parseInt(result[0]?.count || "0", 10);
  }

  private async getTableSize(
    connection: Database,
    tableName: string
  ): Promise<string> {
    const result = await connection.query(`
      SELECT 
        ROUND(((data_length + index_length) / 1024 / 1024), 2) AS sizeMB 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
        AND table_name = '${tableName}'
    `);
    return `${result[0]?.sizeMB || "0"} MB`;
  }

  private printTableDetails(
    tableDetails: { table: string; count: number; size: string }[]
  ): void {
    const table = new Table({
      head: ["Table Name", "Row Count", "Size (MB)"],
      colWidths: [30, 15, 15],
    });

    tableDetails.forEach(({ table: tableName, count, size }) => {
      table.push([tableName, count.toString(), size]);
    });

    console.log(table.toString());
    process.exit(0);
  }
}

export default DbTablesCommand;
