/**
 * Base QueryBuilder interface (common methods).
 */
export interface QueryBuilder {
  /**
   * Set the table to query.
   */
  table(tableName: string): this;

  /**
   * Select specific columns from the table.
   */
  select(columns: string[]): this;

  /**
   * Add WHERE clause to the query.
   */
  where(column: string, operator: string, value: any): this;

  /**
   * Add OR WHERE clause to the query.
   */
  orWhere(column: string, operator: string, value: any): this;

  /**
   * Add ORDER BY clause.
   */
  orderBy(column: string, direction?: "asc" | "desc"): this;

  /**
   * Set result limit.
   */
  limit(limit: number): this;

  /**
   * Set offset for paginated results.
   */
  offset(offset: number): this;

  /**
   * Execute query and return multiple rows.
   */
  get<T = any>(): Promise<T[]>;

  /**
   * Execute query and return the first row.
   */
  first<T = any>(): Promise<T | null>;

  /**
   * Insert data into the database.
   */
  insert(data: Record<string, any> | Record<string, any>[]): Promise<void>;

  /**
   * Update records in the database.
   */
  update(data: Record<string, any>): Promise<void>;

  /**
   * Delete records from the database.
   */
  delete(): Promise<void>;
}
