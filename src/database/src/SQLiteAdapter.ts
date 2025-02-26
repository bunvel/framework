import type { ConnectionConfig, Database } from "./interfaces";

export class SQLiteAdapter implements Database {
  checkDependencies(): void {
    throw new Error("Method not implemented.");
  }
  private db: any = null;

  async connect(config: ConnectionConfig): Promise<void> {
    const { Database } = await import("bun:sqlite");
    this.db = new Database(config.database);
  }

  async disconnect(): Promise<void> {
    this.db?.close();
  }

  async query(sql: string, params: any[] = []): Promise<any> {
    if (!this.db) throw new Error("Database not connected");
    return this.db.query(sql).all(...params);
  }

  async execute(sql: string, params: any[] = []): Promise<any> {
    if (!this.db) throw new Error("Database not connected");
    return this.db.query(sql).run(...params);
  }
}
