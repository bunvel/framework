import { ServiceProvider } from "../../core/src/ServiceProvider";
import { Config } from "../../facade/src/Config";
import { Logger } from "../../log";
import { DatabaseAdapterFactory } from "./DatabaseFactory";
import type { ConnectionConfig, Database } from "./interfaces";
import { isValidDatabase } from "./types";

export class DatabaseServiceProvider extends ServiceProvider {
  async register(): Promise<void> {
    this.app.singleton("database", async () => {
      try {
        const dbType = await Config.string("database.default");

        if (!isValidDatabase(dbType)) {
          Logger.error(`Unsupported database: ${dbType}`);
          return;
        }

        const dbConfig = await Config.get<Omit<ConnectionConfig, "type">>(
          `database.connections.${dbType}`
        );

        if (!dbConfig) {
          Logger.error(`Database configuration for "${dbType}" not found`);
          return;
        }

        const fullConfig: ConnectionConfig = {
          ...dbConfig,
          type: dbType,
        };

        const adapter = DatabaseAdapterFactory.createAdapter(fullConfig);
        await adapter.connect(fullConfig);

        return adapter;
      } catch (error) {
        Logger.error("[Database] Connection failed:", error);
        throw error;
      }
    });
  }

  async boot(): Promise<void> {
    try {
      await this.app.make<Database>("database");
    } catch (error) {
      Logger.error("[Database] Booting failed:", error);
      throw error;
    }
  }
}
