import { Logger } from "@bunvel/support";

import type { ConnectionConfig, Database } from "./interfaces";

export class MySQLAdapter implements Database {
  checkDependencies(): void {
    throw new Error("Method not implemented.");
  }
  private connection: any = null;

  async connect(config: ConnectionConfig): Promise<void> {
    try {
      const mysql = await this.loadMySQL2();
      const { type, ...mysqlConfig } = config;
      this.connection = await mysql.createConnection(mysqlConfig);
    } catch (error) {
      Logger.error(`Failed to connect to MySQL: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    await this.connection?.end();
  }

  async query(sql: string, params: any[] = []): Promise<any> {
    if (!this.connection) throw new Error("Database not connected");
    const [results] = await this.connection.query(sql, params);
    return results;
  }

  async execute(sql: string, params: any[] = []): Promise<any> {
    if (!this.connection) throw new Error("Database not connected");
    const [result] = await this.connection.execute(sql, params);
    return result;
  }

  private async loadMySQL2() {
    try {
      const mysqlPath = await Bun.resolve("mysql2/promise", "node_modules");

      return await import(mysqlPath);
    } catch {
      throw new Error(
        "mysql2 package is not installed. Please install it using 'bun add mysql2'."
      );
    }
  }
}
