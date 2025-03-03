import { ServiceProvider } from "@bunvel/core";
import { Config } from "@bunvel/facade";
import { DatabaseAdapterFactory } from "./DatabaseFactory";
import type { ConnectionConfig } from "./interfaces";
import { isValidDatabaseType } from "./types";

export class DatabaseServiceProvider extends ServiceProvider {
  async register(): Promise<void> {
    this.app.singleton("database", async () => {
      const dbType = await Config.string("database.default");

      if (!isValidDatabaseType(dbType)) {
        throw new Error(`Unsupported database type: ${dbType}`);
      }

      const dbConfig = await Config.get<Omit<ConnectionConfig, "type">>(
        `database.connections.${dbType}`
      );

      if (!dbConfig) {
        throw new Error("Database configuration not found");
      }

      const fullConfig: ConnectionConfig = {
        ...dbConfig,
        type: dbType,
      };

      const adapter = DatabaseAdapterFactory.createAdapter(fullConfig);
      await adapter.connect(fullConfig);

      return adapter;
    });
  }

  async boot(): Promise<void> {
    await this.app.make("database");
  }
}
