import { SQLiteAdapter } from "../adapter/SQLiteAdapter";
import type { QueryBuilder } from "./QueryBuilder";

export class SQLiteQueryBuilder implements QueryBuilder {
  private adapter: SQLiteAdapter;
  private tableName: string | null = null;
  private query: string = "";
  private params: any[] = [];
  private whereUsed: boolean = false;

  constructor(adapter: SQLiteAdapter) {
    this.adapter = adapter;
  }

  table(tableName: string): this {
    this.tableName = tableName;
    return this;
  }

  select(columns: string[]): this {
    if (!this.tableName) throw new Error("Table name not set");
    const cols = columns.length ? columns.join(", ") : "*";
    this.query = `SELECT ${cols} FROM ${this.tableName}`;
    return this;
  }

  where(column: string, operator: string, value: any): this {
    const clause = this.whereUsed ? " AND" : " WHERE";
    this.query += `${clause} ${column} ${operator} ?`;
    this.params.push(value);
    this.whereUsed = true;
    return this;
  }

  andWhere(column: string, operator: string, value: any): this {
    return this.where(column, operator, value);
  }

  orWhere(column: string, operator: string, value: any): this {
    const clause = this.whereUsed ? " OR" : " WHERE";
    this.query += `${clause} ${column} ${operator} ?`;
    this.params.push(value);
    this.whereUsed = true;
    return this;
  }

  join(
    tableName: string,
    column1: string,
    operator: string,
    column2: string
  ): this {
    this.query += ` JOIN ${tableName} ON ${column1} ${operator} ${column2}`;
    return this;
  }

  leftJoin(
    tableName: string,
    column1: string,
    operator: string,
    column2: string
  ): this {
    this.query += ` LEFT JOIN ${tableName} ON ${column1} ${operator} ${column2}`;
    return this;
  }

  groupBy(columns: string[]): this {
    this.query += ` GROUP BY ${columns.join(", ")}`;
    return this;
  }

  having(column: string, operator: string, value: any): this {
    this.query += ` HAVING ${column} ${operator} ?`;
    this.params.push(value);
    return this;
  }

  orderBy(column: string, direction: "asc" | "desc"): this {
    this.query += ` ORDER BY ${column} ${direction}`;
    return this;
  }

  limit(limit: number): this {
    this.query += ` LIMIT ${limit}`;
    return this;
  }

  offset(offset: number): this {
    this.query += ` OFFSET ${offset}`;
    return this;
  }

  async get(): Promise<any[]> {
    if (!this.tableName) throw new Error("Table name not set");
    return await this.adapter.query(this.query, this.params);
  }

  async first(): Promise<any | null> {
    this.limit(1);
    const results = await this.get();
    return results[0] || null;
  }

  async insert(
    data: Record<string, any> | Record<string, any>[]
  ): Promise<void> {
    if (!this.tableName) throw new Error("Table name not set");
    if (!Array.isArray(data)) {
      const columns = Object.keys(data).join(", ");
      const values = Object.values(data)
        .map(() => "?")
        .join(", ");
      this.query = `INSERT INTO ${this.tableName} (${columns}) VALUES (${values})`;
      this.params = Object.values(data);
    } else {
      const columns = Object.keys(data[0]).join(", ");
      const values = data
        .map((row) =>
          Object.values(row)
            .map(() => "?")
            .join(", ")
        )
        .join("), (");
      this.query = `INSERT INTO ${this.tableName} (${columns}) VALUES (${values})`;
      this.params = data.flatMap(Object.values);
    }
    await this.adapter.execute(this.query, this.params);
  }

  async update(data: Record<string, any>): Promise<void> {
    if (!this.tableName) throw new Error("Table name not set");
    const setClause = Object.keys(data)
      .map((key) => `${key} = ?`)
      .join(", ");
    this.query = `UPDATE ${this.tableName} SET ${setClause}`;
    this.params = Object.values(data);
    await this.adapter.execute(this.query, this.params);
  }

  async delete(): Promise<void> {
    if (!this.tableName) throw new Error("Table name not set");
    this.query = `DELETE FROM ${this.tableName}`;
    await this.adapter.execute(this.query, this.params);
  }

  async truncate(): Promise<void> {
    if (!this.tableName) throw new Error("Table name not set");
    this.query = `DELETE FROM ${this.tableName}`;
    await this.adapter.execute(this.query);
  }

  raw(query: string, params: any[] = []): this {
    this.query = query;
    this.params = params;
    return this;
  }

  toSQL(): { query: string; params: any[] } {
    return { query: this.query, params: this.params };
  }
}
