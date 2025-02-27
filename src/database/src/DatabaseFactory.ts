// DatabaseAdapterFactory.ts
import type { ConnectionConfig, Database } from "./interfaces.ts";
import { MySQLAdapter } from "./MySQLAdapter";
import { MySQLQueryBuilder } from "./MySQLQueryBuilder.ts";
import { PostgreSQLAdapter } from "./PostgreSQLAdapter";
import { PostgreSQLQueryBuilder } from "./PostgreSQLQueryBuilder.ts";
import type { QueryBuilder } from "./QueryBuilder.ts";
import { SQLiteAdapter } from "./SQLiteAdapter";
import { SQLiteQueryBuilder } from "./SQLiteQueryBuilder.ts";

export class DatabaseAdapterFactory {
  static createAdapter(config: ConnectionConfig): Database {
    switch (config.type) {
      case "mysql":
        return new MySQLAdapter();
      case "sqlite":
        return new SQLiteAdapter();
      case "postgresql":
        return new PostgreSQLAdapter();
      default:
        throw new Error(`Unsupported database type: ${config.type}`);
    }
  }

  static createQueryBuilder(adapter: Database): QueryBuilder {
    if (adapter instanceof MySQLAdapter) {
      return new MySQLQueryBuilder(adapter);
    } else if (adapter instanceof PostgreSQLAdapter) {
      return new PostgreSQLQueryBuilder(adapter);
    } else if (adapter instanceof SQLiteAdapter) {
      return new SQLiteQueryBuilder(adapter);
    } else {
      throw new Error("Unsupported database adapter");
    }
  }
}
