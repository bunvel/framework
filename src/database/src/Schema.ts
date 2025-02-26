import { Blueprint } from "./Blueprint";
import type { Database } from "./interfaces";

export class Schema {
  constructor(private adapter: Database) {}

  async create(
    tableName: string,
    callback: (table: Blueprint) => void
  ): Promise<void> {
    const blueprint = new Blueprint(tableName);
    callback(blueprint);
    const sql = blueprint.toSQL();
    await this.adapter.query(sql);
  }

  async table(
    tableName: string,
    callback: (table: Blueprint) => void
  ): Promise<void> {
    const blueprint = new Blueprint(tableName, true);
    callback(blueprint);
    const sql = blueprint.toSQL();
    await this.adapter.query(sql);
  }

  async drop(tableName: string): Promise<void> {
    const sql = `DROP TABLE IF EXISTS ${tableName}`;
    await this.adapter.query(sql);
  }

  async dropIfExists(tableName: string): Promise<void> {
    await this.drop(tableName);
  }

  async hasTable(tableName: string): Promise<boolean> {
    const sql = `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`;
    const result = await this.adapter.query(sql);
    return result.length > 0;
  }

  async hasColumn(tableName: string, columnName: string): Promise<boolean> {
    const sql = `PRAGMA table_info(${tableName})`;
    const columns = await this.adapter.query(sql);
    return columns.some((column: any) => column.name === columnName);
  }

  async dropColumn(tableName: string, columnName: string): Promise<void> {
    // Note: SQLite doesn't support dropping columns directly
    // For SQLite, you'd need to create a new table, copy data, drop old table, and rename new table
    const sql = `ALTER TABLE ${tableName} DROP COLUMN ${columnName}`;
    await this.adapter.query(sql);
  }

  async renameTable(oldTableName: string, newTableName: string): Promise<void> {
    const sql = `ALTER TABLE ${oldTableName} RENAME TO ${newTableName}`;
    await this.adapter.query(sql);
  }

  async renameColumn(
    tableName: string,
    oldColumnName: string,
    newColumnName: string
  ): Promise<void> {
    // Note: SQLite doesn't support renaming columns directly in older versions
    // For SQLite < 3.25.0, you'd need to create a new table, copy data, drop old table, and rename new table
    const sql = `ALTER TABLE ${tableName} RENAME COLUMN ${oldColumnName} TO ${newColumnName}`;
    await this.adapter.query(sql);
  }

  async changeColumnType(
    tableName: string,
    columnName: string,
    newType: string
  ): Promise<void> {
    // Note: SQLite doesn't support changing column types directly
    // For SQLite, you'd need to create a new table, copy data, drop old table, and rename new table
    const sql = `ALTER TABLE ${tableName} ALTER COLUMN ${columnName} TYPE ${newType}`;
    await this.adapter.query(sql);
  }

  async addConstraint(
    tableName: string,
    constraintName: string,
    constraintDefinition: string
  ): Promise<void> {
    const sql = `ALTER TABLE ${tableName} ADD CONSTRAINT ${constraintName} ${constraintDefinition}`;
    await this.adapter.query(sql);
  }

  async dropConstraint(
    tableName: string,
    constraintName: string
  ): Promise<void> {
    // Note: SQLite doesn't support dropping constraints directly
    // For SQLite, you'd need to create a new table without the constraint, copy data, drop old table, and rename new table
    const sql = `ALTER TABLE ${tableName} DROP CONSTRAINT ${constraintName}`;
    await this.adapter.query(sql);
  }

  async createIndex(
    tableName: string,
    indexName: string,
    columns: string[],
    unique: boolean = false
  ): Promise<void> {
    const uniqueStr = unique ? "UNIQUE" : "";
    const sql = `CREATE ${uniqueStr} INDEX ${indexName} ON ${tableName} (${columns.join(
      ", "
    )})`;
    await this.adapter.query(sql);
  }

  async dropIndex(indexName: string): Promise<void> {
    const sql = `DROP INDEX IF EXISTS ${indexName}`;
    await this.adapter.query(sql);
  }
}
