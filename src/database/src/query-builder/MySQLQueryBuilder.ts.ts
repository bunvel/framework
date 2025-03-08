import { MySQLAdapter } from "../adapter/MySQLAdapter";
import type { QueryBuilder } from "./QueryBuilder";

export class MySQLQueryBuilder implements QueryBuilder {
  private adapter: MySQLAdapter;
  private tableName: string | null = null;
  private query: string = "";
  private params: any[] = [];
  private hasWhere: boolean = false;

  constructor(adapter: MySQLAdapter) {
    this.adapter = adapter;
  }

  // Table selection
  table(tableName: string): this {
    this.tableName = tableName;
    return this;
  }

  // Select columns
  select(columns: string[]): this {
    if (!this.tableName) throw new Error("Table name not set");
    this.query = `SELECT ${columns.join(", ")} FROM ${this.tableName}`;
    return this;
  }

  // Distinct selection
  distinct(columns: string[]): this {
    if (!this.tableName) throw new Error("Table name not set");
    this.query = `SELECT DISTINCT ${columns.join(", ")} FROM ${this.tableName}`;
    return this;
  }

  // Add WHERE clause
  where(column: string, operator: string, value: any): this {
    if (!this.hasWhere) {
      this.query += ` WHERE ${column} ${operator} ?`;
      this.hasWhere = true;
    } else {
      this.query += ` AND ${column} ${operator} ?`;
    }
    this.params.push(value);
    return this;
  }

  // Add OR WHERE clause
  orWhere(column: string, operator: string, value: any): this {
    if (!this.hasWhere) {
      throw new Error("Cannot use 'orWhere' without 'where'");
    }
    this.query += ` OR ${column} ${operator} ?`;
    this.params.push(value);
    return this;
  }

  // Join another table
  join(
    tableName: string,
    column1: string,
    operator: string,
    column2: string
  ): this {
    this.query += ` JOIN ${tableName} ON ${column1} ${operator} ${column2}`;
    return this;
  }

  // Left Join
  leftJoin(
    tableName: string,
    column1: string,
    operator: string,
    column2: string
  ): this {
    this.query += ` LEFT JOIN ${tableName} ON ${column1} ${operator} ${column2}`;
    return this;
  }

  // Right Join
  rightJoin(
    tableName: string,
    column1: string,
    operator: string,
    column2: string
  ): this {
    this.query += ` RIGHT JOIN ${tableName} ON ${column1} ${operator} ${column2}`;
    return this;
  }

  // Group By
  groupBy(columns: string[]): this {
    this.query += ` GROUP BY ${columns.join(", ")}`;
    return this;
  }

  // HAVING clause
  having(column: string, operator: string, value: any): this {
    this.query += ` HAVING ${column} ${operator} ?`;
    this.params.push(value);
    return this;
  }

  // Order By
  orderBy(column: string, direction: "asc" | "desc" = "asc"): this {
    this.query += ` ORDER BY ${column} ${direction}`;
    return this;
  }

  // Limit
  limit(limit: number): this {
    this.query += ` LIMIT ${limit}`;
    return this;
  }

  // Offset
  offset(offset: number): this {
    this.query += ` OFFSET ${offset}`;
    return this;
  }

  // Count rows
  count(column: string = "*"): this {
    if (!this.tableName) throw new Error("Table name not set");
    this.query = `SELECT COUNT(${column}) FROM ${this.tableName}`;
    return this;
  }

  // Execute and get results
  async get(): Promise<any> {
    if (!this.tableName) throw new Error("Table name not set");
    const result = await this.adapter.query(this.query, this.params);
    this.clear();
    return result;
  }

  // Get first result
  async first(): Promise<any> {
    this.limit(1);
    const result = await this.get();
    return result[0] || null;
  }

  // Insert record
  async insert(data: object | object[]): Promise<void> {
    if (!this.tableName) throw new Error("Table name not set");
    if (Array.isArray(data)) {
      const columns = Object.keys(data[0]).join(", ");
      const placeholders = data
        .map(() => "?")
        .join(", ")
        .split(",")
        .map((v, i) => `?${i + 1}`)
        .join(", ");
      this.query = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
      this.params = data.flatMap(Object.values);
    } else {
      const columns = Object.keys(data).join(", ");
      const placeholders = Object.values(data)
        .map(() => "?")
        .join(", ");
      this.query = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
      this.params = Object.values(data);
    }
    await this.adapter.execute(this.query, this.params);
    this.clear();
  }

  // Update record
  async update(data: object): Promise<void> {
    if (!this.tableName) throw new Error("Table name not set");
    if (!this.hasWhere) throw new Error("Update requires a WHERE clause");
    const setClause = Object.keys(data)
      .map((key) => `${key} = ?`)
      .join(", ");
    this.query = `UPDATE ${this.tableName} SET ${setClause}`;
    this.params = [...Object.values(data), ...this.params];
    await this.adapter.execute(this.query, this.params);
    this.clear();
  }

  // Delete record
  async delete(): Promise<void> {
    if (!this.tableName) throw new Error("Table name not set");
    if (!this.hasWhere) throw new Error("Delete requires a WHERE clause");
    this.query = `DELETE FROM ${this.tableName}`;
    await this.adapter.execute(this.query, this.params);
    this.clear();
  }

  // Truncate table
  async truncate(): Promise<void> {
    if (!this.tableName) throw new Error("Table name not set");
    this.query = `TRUNCATE TABLE ${this.tableName}`;
    await this.adapter.execute(this.query);
    this.clear();
  }

  // Clear internal state
  private clear(): void {
    this.query = "";
    this.params = [];
    this.hasWhere = false;
  }
}
