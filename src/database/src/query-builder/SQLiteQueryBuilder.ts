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

  table(tableName: string): QueryBuilder {
    this.tableName = tableName;
    return this;
  }

  select(columns: string[]): QueryBuilder {
    if (!this.tableName) throw new Error("Table name not set");
    const cols = columns.length ? columns.join(", ") : "*";
    this.query = `SELECT ${cols} FROM ${this.tableName}`;
    return this;
  }

  where(column: string, operator: string, value: any): QueryBuilder {
    const clause = this.whereUsed ? " AND" : " WHERE";
    this.query += `${clause} ${column} ${operator} ?`;
    this.params.push(value);
    this.whereUsed = true;
    return this;
  }

  andWhere(column: string, operator: string, value: any): QueryBuilder {
    return this.where(column, operator, value);
  }

  orWhere(column: string, operator: string, value: any): QueryBuilder {
    this.query += ` OR ${column} ${operator} ?`;
    this.params.push(value);
    return this;
  }

  join(
    tableName: string,
    column1: string,
    operator: string,
    column2: string
  ): QueryBuilder {
    this.query += ` JOIN ${tableName} ON ${column1} ${operator} ${column2}`;
    return this;
  }

  leftJoin(
    tableName: string,
    column1: string,
    operator: string,
    column2: string
  ): QueryBuilder {
    this.query += ` LEFT JOIN ${tableName} ON ${column1} ${operator} ${column2}`;
    return this;
  }

  groupBy(columns: string[]): QueryBuilder {
    this.query += ` GROUP BY ${columns.join(", ")}`;
    return this;
  }

  having(column: string, operator: string, value: any): QueryBuilder {
    this.query += ` HAVING ${column} ${operator} ?`;
    this.params.push(value);
    return this;
  }

  orderBy(column: string, direction: "asc" | "desc"): QueryBuilder {
    this.query += ` ORDER BY ${column} ${direction}`;
    return this;
  }

  limit(limit: number): QueryBuilder {
    this.query += ` LIMIT ${limit}`;
    return this;
  }

  offset(offset: number): QueryBuilder {
    this.query += ` OFFSET ${offset}`;
    return this;
  }

  async get(): Promise<any> {
    if (!this.tableName) throw new Error("Table name not set");
    return await this.adapter.query(this.query, this.params);
  }

  async first(): Promise<any> {
    this.limit(1);
    const results = await this.get();
    return results[0] || null;
  }

  async insert(data: object): Promise<void> {
    if (!this.tableName) throw new Error("Table name not set");
    const columns = Object.keys(data).join(", ");
    const values = Object.values(data)
      .map(() => "?")
      .join(", ");
    this.query = `INSERT INTO ${this.tableName} (${columns}) VALUES (${values})`;
    this.params = Object.values(data);
    await this.adapter.execute(this.query, this.params);
  }

  async update(data: object): Promise<void> {
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
}
