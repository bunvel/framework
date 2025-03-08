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

  async dropIfExists(tableName: string): Promise<void> {
    const sql = `DROP TABLE IF EXISTS \`${tableName}\``;
    await this.adapter.query(sql);
  }

  async hasTable(tableName: string): Promise<boolean> {
    let sql: string;
    if (this.adapter.driver === "postgresql") {
      sql = `SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = $1
             )`;
      const result = await this.adapter.query(sql, [tableName]);
      return result[0].exists;
    }
    if (this.adapter.driver === "sqlite") {
      sql = `SELECT name FROM sqlite_master WHERE type='table' AND name=?`;
    } else {
      sql = `SHOW TABLES LIKE ?`;
    }
    const result = await this.adapter.query(sql, [tableName]);
    return result.length > 0;
  }

  async hasColumn(tableName: string, columnName: string): Promise<boolean> {
    if (this.adapter.driver === "sqlite") {
      const sql = `PRAGMA table_info(${tableName})`;
      const columns = await this.adapter.query(sql);
      return columns.some((column: any) => column.name === columnName);
    } else if (this.adapter.driver === "postgresql") {
      const sql = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $2
      `;
      const result = await this.adapter.query(sql, [tableName, columnName]);
      return result.length > 0;
    } else {
      const sql = `SHOW COLUMNS FROM \`${tableName}\` LIKE ?`;
      const result = await this.adapter.query(sql, [columnName]);
      return result.length > 0;
    }
  }

  async dropColumn(tableName: string, columnName: string): Promise<void> {
    // SQLite workaround: Recreate table without the column
    if (this.adapter.driver === "sqlite") {
      throw new Error("SQLite does not support DROP COLUMN directly.");
    }
    const sql = `ALTER TABLE \`${tableName}\` DROP COLUMN \`${columnName}\``;
    await this.adapter.query(sql);
  }

  async renameTable(oldTableName: string, newTableName: string): Promise<void> {
    const sql = `ALTER TABLE \`${oldTableName}\` RENAME TO \`${newTableName}\``;
    await this.adapter.query(sql);
  }

  async renameColumn(
    tableName: string,
    oldColumnName: string,
    newColumnName: string
  ): Promise<void> {
    if (this.adapter.driver === "sqlite") {
      throw new Error("SQLite does not support RENAME COLUMN directly.");
    }
    const sql = `ALTER TABLE \`${tableName}\` RENAME COLUMN \`${oldColumnName}\` TO \`${newColumnName}\``;
    await this.adapter.query(sql);
  }

  async changeColumnType(
    tableName: string,
    columnName: string,
    newType: string
  ): Promise<void> {
    if (this.adapter.driver === "sqlite") {
      throw new Error("SQLite does not support ALTER COLUMN TYPE.");
    }
    if (this.adapter.driver === "postgresql") {
      throw new Error("PostgreSQL does not support ALTER COLUMN TYPE.");
    }
    const sql = `ALTER TABLE \`${tableName}\` MODIFY \`${columnName}\` ${newType}`;
    await this.adapter.query(sql);
  }

  async addConstraint(
    tableName: string,
    constraintName: string,
    constraintDefinition: string
  ): Promise<void> {
    const sql = `ALTER TABLE \`${tableName}\` ADD CONSTRAINT \`${constraintName}\` ${constraintDefinition}`;
    await this.adapter.query(sql);
  }

  async dropConstraint(
    tableName: string,
    constraintName: string
  ): Promise<void> {
    if (this.adapter.driver === "sqlite") {
      throw new Error("SQLite does not support DROP CONSTRAINT directly.");
    }
    const sql = `ALTER TABLE \`${tableName}\` DROP CONSTRAINT \`${constraintName}\``;
    await this.adapter.query(sql);
  }

  async createIndex(
    tableName: string,
    indexName: string,
    columns: string[],
    unique: boolean = false
  ): Promise<void> {
    const uniqueStr = unique ? "UNIQUE" : "";
    const sql = `CREATE ${uniqueStr} INDEX \`${indexName}\` ON \`${tableName}\` (${columns
      .map((col) => `\`${col}\``)
      .join(", ")})`;
    await this.adapter.query(sql);
  }

  async dropIndex(indexName: string): Promise<void> {
    const sql = `DROP INDEX IF EXISTS \`${indexName}\``;
    await this.adapter.query(sql);
  }
}
