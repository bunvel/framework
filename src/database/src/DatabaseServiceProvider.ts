import { Config } from "../../core/src/Facades/Config";
import { ServiceProvider } from "../../core/src/ServiceProvider";
import { DatabaseAdapterFactory } from "./DatabaseFactory";
import type { ConnectionConfig } from "./interfaces";

type SupportedDatabaseTypes = "mysql" | "sqlite" | "pg";

function isValidDatabaseType(type: string): type is SupportedDatabaseTypes {
  return ["mysql", "sqlite", "pg"].includes(type);
}

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
