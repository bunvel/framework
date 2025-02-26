import { MySQLAdapter } from "./MySQLAdapter";
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
  table(tableName: string): QueryBuilder {
    this.tableName = tableName;
    return this;
  }

  // Select columns
  select(columns: string[]): QueryBuilder {
    if (!this.tableName) throw new Error("Table name not set");
    this.query = `SELECT ${columns.join(", ")} FROM ${this.tableName}`;
    return this;
  }

  // Distinct selection
  distinct(columns: string[]): QueryBuilder {
    if (!this.tableName) throw new Error("Table name not set");
    this.query = `SELECT DISTINCT ${columns.join(", ")} FROM ${this.tableName}`;
    return this;
  }

  // Add where condition
  where(column: string, operator: string, value: any): QueryBuilder {
    if (!this.hasWhere) {
      this.query += ` WHERE ${column} ${operator} ?`;
      this.hasWhere = true;
    } else {
      this.query += ` AND ${column} ${operator} ?`;
    }
    this.params.push(value);
    return this;
  }

  // Add AND where condition
  andWhere(column: string, operator: string, value: any): QueryBuilder {
    return this.where(column, operator, value);
  }

  // Add OR where condition
  orWhere(column: string, operator: string, value: any): QueryBuilder {
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
  ): QueryBuilder {
    this.query += ` JOIN ${tableName} ON ${column1} ${operator} ${column2}`;
    return this;
  }

  // Left Join
  leftJoin(
    tableName: string,
    column1: string,
    operator: string,
    column2: string
  ): QueryBuilder {
    this.query += ` LEFT JOIN ${tableName} ON ${column1} ${operator} ${column2}`;
    return this;
  }

  // Right Join
  rightJoin(
    tableName: string,
    column1: string,
    operator: string,
    column2: string
  ): QueryBuilder {
    this.query += ` RIGHT JOIN ${tableName} ON ${column1} ${operator} ${column2}`;
    return this;
  }

  // Group by columns
  groupBy(columns: string[]): QueryBuilder {
    this.query += ` GROUP BY ${columns.join(", ")}`;
    return this;
  }

  // Add having clause
  having(column: string, operator: string, value: any): QueryBuilder {
    this.query += ` HAVING ${column} ${operator} ?`;
    this.params.push(value);
    return this;
  }

  // Order by columns
  orderBy(column: string, direction: "asc" | "desc" = "asc"): QueryBuilder {
    this.query += ` ORDER BY ${column} ${direction}`;
    return this;
  }

  // Limit the number of rows
  limit(limit: number): QueryBuilder {
    this.query += ` LIMIT ${limit}`;
    return this;
  }

  // Offset rows
  offset(offset: number): QueryBuilder {
    this.query += ` OFFSET ${offset}`;
    return this;
  }

  // Count rows
  count(column: string = "*"): QueryBuilder {
    this.query = `SELECT COUNT(${column}) FROM ${this.tableName}`;
    return this;
  }

  // Execute query and get results
  async get(): Promise<any> {
    const result = await this.adapter.query(this.query, this.params);
    this.clear(); // Clear query and params after execution
    return result;
  }

  // Execute query and get the first result
  async first(): Promise<any> {
    this.limit(1);
    const result = await this.get();
    return result[0] || null;
  }

  // Insert new record
  async insert(data: object): Promise<void> {
    if (!this.tableName) throw new Error("Table name not set");
    const columns = Object.keys(data).join(", ");
    const placeholders = Object.values(data)
      .map(() => "?")
      .join(", ");
    this.query = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
    this.params = Object.values(data);
    await this.adapter.execute(this.query, this.params);
    this.clear();
  }

  // Update existing records
  async update(data: object): Promise<void> {
    if (!this.tableName) throw new Error("Table name not set");
    const setClause = Object.keys(data)
      .map((key) => `${key} = ?`)
      .join(", ");
    this.query = `UPDATE ${this.tableName} SET ${setClause}`;
    if (!this.hasWhere) {
      throw new Error("Update operation requires a WHERE clause");
    }
    this.params = [...Object.values(data), ...this.params];
    await this.adapter.execute(this.query, this.params);
    this.clear();
  }

  // Delete records
  async delete(): Promise<void> {
    if (!this.tableName) throw new Error("Table name not set");
    if (!this.hasWhere) {
      throw new Error("Delete operation requires a WHERE clause");
    }
    this.query = `DELETE FROM ${this.tableName}`;
    await this.adapter.execute(this.query, this.params);
    this.clear();
  }

  // Truncate table
  async truncate(): Promise<void> {
    if (!this.tableName) throw new Error("Table name not set");
    this.query = `TRUNCATE TABLE ${this.tableName}`;
    await this.adapter.execute(this.query, this.params);
    this.clear();
  }

  // Clear query and params after execution
  private clear() {
    this.query = "";
    this.params = [];
    this.hasWhere = false;
  }
}
