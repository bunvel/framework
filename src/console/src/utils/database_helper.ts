import { ConfigServiceProvider } from "../../../config";
import { Application } from "../../../core";
import type { Database } from "../../../database";
import { DatabaseServiceProvider } from "../../../database";
import { Logger } from "../../../log";

/**
 * Create the migrations table in the database.
 *
 * @param adapter - The database adapter to use.
 */
export async function createMigrationTable(adapter: Database): Promise<void> {
  const createTableQuery = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        migration VARCHAR(255) NOT NULL UNIQUE,
        batch INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

  await adapter.query(createTableQuery);
}

/**
 * Connect to the database and return the database adapter.
 *
 * @returns The database adapter instance.
 */
export async function connectToDatabase(): Promise<Database | null> {
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
