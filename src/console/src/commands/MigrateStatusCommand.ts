import Table from "cli-table3";
import { readdirSync } from "fs";

import { type Database } from "@bunvel/database";
import { Logger } from "@bunvel/log";
import { databasePath } from "@bunvel/support";
import { Command } from "../command";
import { connectToDatabase } from "../utils/database_helper";

class MigrateStatusCommand extends Command {
  constructor() {
    super("migrate:status", "Show the status of migrations");
  }

  async handle(): Promise<void> {
    const connection = await connectToDatabase();
    if (!connection) {
      Logger.error("Failed to connect to the database.");
      return;
    }

    try {
      const migrationFiles = this.getMigrationFiles(databasePath("migrations"));
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
