import { Logger } from "@bunvel/log";

import type { ConnectionConfig, Database } from "../interfaces";

export class PostgreSQLAdapter implements Database {
  driver = "postgresql" as const;
  private client: any = null;

  checkDependencies(): void {
    try {
      require.resolve("pg");
    } catch {
      throw new Error("pg package is missing. Run: 'bun add pg'");
    }
  }

  async connect(config: ConnectionConfig): Promise<void> {
    if (this.client) {
      Logger.warning("Already connected to PostgreSQL.");
      return;
    }
    try {
      const { Client }: any = await this.loadPG();
      const { type, ...pgConfig } = config;
      this.client = new Client(pgConfig);
      await this.client.connect();
    } catch (error: any) {
      Logger.error(`PostgreSQL connection failed: ${error.message}`);
      throw new Error("Failed to establish a PostgreSQL connection.");
    }
  }

  async disconnect(): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.end();
    } catch (error) {
      Logger.error(`Error disconnecting from PostgreSQL: ${error}`);
    } finally {
      this.client = null;
    }
  }

  private async ensureConnected(): Promise<void> {
    if (!this.client) {
      throw new Error("Database not connected. Call 'connect()' first.");
    }
  }

  async query(sql: string, params: any[] = []): Promise<any> {
    await this.ensureConnected();

    try {
      const result = await this.client.query(sql, params);
      return result.rows;
    } catch (error: any) {
      Logger.error(`Query failed: ${sql} -> ${error}`);
      throw new Error("Database query execution failed.");
    }
  }

  async execute(sql: string, params: any[] = []): Promise<any> {
    await this.ensureConnected();

    try {
      console.log(sql, params);
      const result = await this.client.query(sql, params);
      return result.rows;
    } catch (error: any) {
      Logger.error(`Execution failed: ${sql} -> ${error}`);
      throw new Error("Database execution failed.");
    }
  }

  private async loadPG() {
    try {
      const pgPath = await Bun.resolve("pg", "node_modules");

      return await import(pgPath);
    } catch (error) {
      throw new Error(
        "pg package is not installed. Please install it using 'bun add pg'."
      );
    }
  }
}
