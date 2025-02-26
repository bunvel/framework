import Table from "cli-table3";
import { readdirSync } from "fs";
import { join } from "path";
import { Application } from "../../../core";

import { Logger } from "@bunvel/support";
import { ConfigServiceProvider } from "../../../config";
import { type Database, DatabaseServiceProvider } from "../../../database";
import { Command } from "../command";

class MigrateStatusCommand extends Command {
  constructor() {
    super("migrate:status", "Show the status of migrations");
  }

  async handle(): Promise<void> {
    const connection = await this.connectToDatabase();
    if (!connection) {
      Logger.error("Failed to connect to the database.");
      return;
    }

    try {
      const migrationsDir = join(process.cwd(), "database", "migrations");
      const migrationFiles = this.getMigrationFiles(migrationsDir);
      const executedMigrations = await this.getExecutedMigrations(connection);

      const migrationStatus = this.getMigrationStatus(
        migrationFiles,
        executedMigrations
      );

      // Sort by batch number in descending order
      migrationStatus.sort((a, b) => b.batchNo - a.batchNo);

      this.printMigrationStatus(migrationStatus);
    } catch (error: any) {
      Logger.error("Error fetching migration status:", error);
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

  private getMigrationFiles(migrationsDir: string): string[] {
    return readdirSync(migrationsDir).filter(
      (file) => file.endsWith(".ts") || file.endsWith(".js")
    );
  }

  private async getExecutedMigrations(
    connection: Database
  ): Promise<{ [key: string]: number }> {
    const result = await connection.query(
      "SELECT migration, batch FROM migrations"
    );
    return result.reduce((acc: { [key: string]: number }, row: any) => {
      acc[row.migration] = row.batch;
      return acc;
    }, {});
  }

  private getMigrationStatus(
    files: string[],
    executedMigrations: { [key: string]: number }
  ): { no: number; batchNo: number; filename: string; status: string }[] {
    return files.map((file, index) => {
      const batchNo = executedMigrations[file] || 0;
      const status = batchNo === 0 ? "Pending" : "Migrated";
      return {
        no: index + 1,
        batchNo,
        filename: file,
        status,
      };
    });
  }

  private printMigrationStatus(
    status: { no: number; batchNo: number; filename: string; status: string }[]
  ): void {
    const table = new Table({
      head: ["No", "Batch No", "Filename", "Status"],
      colWidths: [5, 10, 50, 15],
    });

    status.forEach(({ no, batchNo, filename, status }) => {
      table.push([
        no,
        batchNo === 0 ? "-" : batchNo.toString(),
        filename,
        status,
      ]);
    });

    console.log(table.toString());
    process.exit(0);
  }
}

export default MigrateStatusCommand;
