import { Logger } from "../../../log";
import type { ConnectionConfig, Database } from "../interfaces";

export class MySQLAdapter implements Database {
  driver = "mysql" as const;
  private connection: any = null;

  checkDependencies(): void {
    try {
      Bun.resolveSync("mysql2/promise", import.meta.dir);
    } catch {
      throw new Error("mysql2 package is missing. Run: 'bun add mysql2'");
    }
  }

  async connect(config: ConnectionConfig): Promise<void> {
    if (this.connection) {
      Logger.warning("Already connected to MySQL.");
      return;
    }

    try {
      const mysql = await this.loadMySQL2();
      const { type, ...mysqlConfig } = config;

      this.connection = await mysql.createConnection(mysqlConfig);
    } catch (error: any) {
      Logger.error(`MySQL connection failed: ${error.message}`);
      throw new Error("Failed to establish a MySQL connection.");
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connection) return;
    try {
      await this.connection.end();
    } catch (error) {
      Logger.error(`Error disconnecting from MySQL: ${error}`);
    } finally {
      this.connection = null;
    }
  }

  private async ensureConnected(): Promise<void> {
    if (!this.connection) {
      throw new Error("Database not connected. Call 'connect()' first.");
    }
  }

  async query(sql: string, params: any[] = []): Promise<any> {
    await this.ensureConnected();

    try {
      const [results] = await this.connection.query(sql, params);
      return results;
    } catch (error: any) {
      Logger.error(`Query failed: ${error.message}`);
      throw new Error("Database query execution failed.");
    }
  }

  async execute(sql: string, params: any[] = []): Promise<any> {
    await this.ensureConnected();

    try {
      const [result] = await this.connection.execute(sql, params);
      return result;
    } catch (error: any) {
      Logger.error(`Execution failed: ${error.message}`);
      throw new Error("Database execution failed.");
    }
  }

  private async loadMySQL2() {
    try {
      const mysqlPath = await Bun.resolve("mysql2/promise", "node_modules");
      return await import(mysqlPath);
    } catch (error) {
      throw new Error(
        "mysql2 package is not installed. Please install it using 'bun add mysql2'."
      );
    }
  }
}
