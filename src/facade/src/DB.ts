import { DatabaseAdapterFactory, type Database } from "@bunvel/database";
import type { QueryBuilder } from "@bunvel/database/src/query-builder/QueryBuilder";
import { Application } from "../../core/src/Application";

export class DB {
  /**
   * Get the database adapter instance.
   */
  private static async getAdapter(): Promise<Database> {
    const app = Application.getInstance();
    const adapter = await app.make<Database>("database");

    if (!adapter) {
      throw new Error(
        "Database adapter is not available. Ensure DatabaseServiceProvider is registered."
      );
    }

    return adapter;
  }

  /**
   * Get the database query builder instance.
   */
  private static async getQueryBuilder(): Promise<QueryBuilder> {
    const adapter = await this.getAdapter();

    return DatabaseAdapterFactory.createQueryBuilder(adapter);
  }

  /**
   * Perform a raw query on the database.
   */
  public static async query<T = any>(
    sql: string,
    params: any[] = []
  ): Promise<T[]> {
    const adapter = await this.getAdapter();
    return adapter?.query(sql, params);
  }

  /**
   * Get the database query builder instance.
   */
  public static get qb(): Promise<QueryBuilder> {
    return this.getQueryBuilder();
  }
}
