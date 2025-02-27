import { Logger } from "@bunvel/support";

import type { ConnectionConfig, Database } from "../interfaces";

export class PostgreSQLAdapter implements Database {
  checkDependencies(): void {
    throw new Error("Method not implemented.");
  }
  private client: any = null;

  async connect(config: ConnectionConfig): Promise<void> {
    try {
      const { Client }: any = await this.loadPG();
      const { type, ...pgConfig } = config;
      this.client = new Client(pgConfig);
      await this.client.connect();
    } catch (error) {
      Logger.error(`Failed to connect to PostgreSQL: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    await this.client?.end();
  }

  async query(sql: string, params: any[] = []): Promise<any> {
    if (!this.client) throw new Error("Database not connected");
    const result = await this.client.query(sql, params);
    return result.rows;
  }

  async execute(sql: string, params: any[] = []): Promise<any> {
    if (!this.client) throw new Error("Database not connected");
    const result = await this.client.query(sql, params);
    return result;
  }

  private async loadPG() {
    try {
      const pgPath = await Bun.resolve("pg", "node_modules");

      return await import(pgPath);
    } catch {
      throw new Error(
        "pg package is not installed. Please install it using 'bun add pg'."
      );
    }
  }
}
