import { MySQLAdapter } from "./adapter/MySQLAdapter.ts";
import { PostgreSQLAdapter } from "./adapter/PostgreSQLAdapter.ts";
import { SQLiteAdapter } from "./adapter/SQLiteAdapter.ts";
import type { ConnectionConfig, Database } from "./interfaces.ts";
import { MySQLQueryBuilder } from "./query-builder/MySQLQueryBuilder.ts.ts";
import { PostgreSQLQueryBuilder } from "./query-builder/PostgreSQLQueryBuilder.ts";
import type { QueryBuilder } from "./query-builder/QueryBuilder.ts";
import { SQLiteQueryBuilder } from "./query-builder/SQLiteQueryBuilder.ts";

/**
 * DatabaseAdapterFactory
 *
 * This class provides a factory method to create database adapters and query
 * builders based on the given database type.
 *
 * @example
 * const adapter = DatabaseAdapterFactory.createAdapter({ type: "mysql", ... });
 * const queryBuilder = DatabaseAdapterFactory.createQueryBuilder(adapter);
 */
export class DatabaseAdapterFactory {
  /**
   * Create a database adapter based on the given configuration.
   *
   * @param config - The database configuration.
   * @returns The created database adapter.
   */
  static createAdapter(config: ConnectionConfig): Database {
    switch (config.type) {
      case "mysql":
        return new MySQLAdapter();
      case "sqlite":
        return new SQLiteAdapter();
      case "postgresql":
        return new PostgreSQLAdapter();
      default:
        throw new Error(`Unsupported database: ${config.type}`);
    }
  }

  /**
   * Create a query builder based on the given database adapter.
   *
   * @param adapter - The database adapter.
   * @returns The created query builder.
   */
  static createQueryBuilder<T extends Database>(adapter: T): QueryBuilder {
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
