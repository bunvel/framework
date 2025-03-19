import { databasePath } from "@bunvel/support";
import { Logger } from "../../../log";
import type { ConnectionConfig, Database } from "../interfaces";

export class SQLiteAdapter implements Database {
  driver = "sqlite" as const;
  private db: any = null;

  async connect(config: ConnectionConfig): Promise<void> {
    if (this.db) {
      Logger.warning("Already connected to SQLite.");
      return;
    }

    try {
      const { Database } = await import("bun:sqlite");
      this.db = new Database(`${databasePath()}/${config.database}.sqlite`);
    } catch (error: any) {
      Logger.error(`SQLite connection failed: ${error.message}`);
      throw new Error("Failed to establish a SQLite connection.");
    }
  }

  async disconnect(): Promise<void> {
    if (!this.db) return;
    try {
      await this.db.close();
    } catch (error) {
      Logger.error(`Error disconnecting from SQLite: ${error}`);
    } finally {
      this.db = null;
    }
  }

  private async ensureConnected(): Promise<void> {
    if (!this.db) {
      throw new Error("Database not connected. Call 'connect()' first.");
    }
  }

  async query(sql: string, params: any[] = []): Promise<any> {
    await this.ensureConnected();

    try {
      return this.db.query(sql).all(...params);
    } catch (error: any) {
      Logger.error(`Query failed: ${error.message}`);
      throw new Error("Database query execution failed.");
    }
  }

  async execute(sql: string, params: any[] = []): Promise<any> {
    await this.ensureConnected();

    try {
      return this.db.query(sql).run(...params);
    } catch (error: any) {
      Logger.error(`Execution failed: ${error.message}`);
      throw new Error("Database execution failed.");
    }
  }
}
