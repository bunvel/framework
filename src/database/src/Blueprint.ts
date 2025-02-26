class ForeignKeyBuilder implements ForeignKeyDefinition {
  private referencedColumn?: string;
  private referencedTable?: string;
  private onDeleteAction?: string;
  private onUpdateAction?: string;

  constructor(public column: string) {}

  referencesColumn(column: string): this {
    this.referencedColumn = column;
    return this;
  }

  onTable(table: string): this {
    this.referencedTable = table;
    return this;
  }

  onDeleteCascade(): this {
    this.onDeleteAction = "CASCADE";
    return this;
  }

  onDeleteSetNull(): this {
    this.onDeleteAction = "SET NULL";
    return this;
  }

  onDeleteRestrict(): this {
    this.onDeleteAction = "RESTRICT";
    return this;
  }

  onDeleteNoAction(): this {
    this.onDeleteAction = "NO ACTION";
    return this;
  }

  onUpdateCascade(): this {
    this.onUpdateAction = "CASCADE";
    return this;
  }

  onUpdateSetNull(): this {
    this.onUpdateAction = "SET NULL";
    return this;
  }

  onUpdateRestrict(): this {
    this.onUpdateAction = "RESTRICT";
    return this;
  }

  onUpdateNoAction(): this {
    this.onUpdateAction = "NO ACTION";
    return this;
  }

  toSQL(): string {
    if (!this.referencedColumn || !this.referencedTable) {
      throw new Error("Foreign key must specify referenced column and table");
    }

    let sql = `FOREIGN KEY (${this.column}) REFERENCES ${this.referencedTable}(${this.referencedColumn})`;
    if (this.onDeleteAction) {
      sql += `ON DELETE ${this.onDeleteAction}`;
    }
    if (this.onUpdateAction) {
      sql += `ON UPDATE ${this.onUpdateAction}`;
    }
    return sql;
  }
}

interface ColumnDefinition {
  name: string;
  type: string;
  length?: number;
  autoIncrement?: boolean;
  primary?: boolean;
  nullable?: boolean;
  default?: any;
  unsigned?: boolean;
}

interface IndexDefinition {
  type: "PRIMARY" | "UNIQUE" | "INDEX";
  columns: string[];
}

interface ForeignKeyDefinition {
  column: string;
  toSQL(): string;
}

export class Blueprint {
  private columns: ColumnDefinition[] = [];
  private indexes: IndexDefinition[] = [];
  private foreignKeys: ForeignKeyDefinition[] = [];
  private isAlter: boolean;

  constructor(private tableName: string, isAlter: boolean = false) {
    this.isAlter = isAlter;
  }

  increments(columnName: string): this {
    this.columns.push({
      name: columnName,
      type: "INTEGER",
      autoIncrement: true,
      primary: true,
    });
    return this;
  }

  integer(columnName: string): this {
    this.columns.push({ name: columnName, type: "INTEGER" });
    return this;
  }

  bigInteger(columnName: string): this {
    this.columns.push({ name: columnName, type: "BIGINT" });
    return this;
  }

  string(columnName: string, length: number = 255): this {
    this.columns.push({ name: columnName, type: "VARCHAR", length });
    return this;
  }

  text(columnName: string): this {
    this.columns.push({ name: columnName, type: "TEXT" });
    return this;
  }

  float(columnName: string, precision?: number, scale?: number): this {
    let type = "FLOAT";
    if (precision !== undefined && scale !== undefined) {
      type = `FLOAT(${precision},${scale})`;
    }
    this.columns.push({ name: columnName, type });
    return this;
  }

  decimal(columnName: string, precision: number, scale: number): this {
    this.columns.push({
      name: columnName,
      type: `DECIMAL(${precision},${scale})`,
    });
    return this;
  }

  boolean(columnName: string): this {
    this.columns.push({ name: columnName, type: "BOOLEAN" });
    return this;
  }

  date(columnName: string): this {
    this.columns.push({ name: columnName, type: "DATE" });
    return this;
  }

  dateTime(columnName: string): this {
    this.columns.push({ name: columnName, type: "DATETIME" });
    return this;
  }

  timestamp(columnName: string, defaultValue?: string): this {
    this.columns.push({
      name: columnName,
      type: "TIMESTAMP",
      default: defaultValue,
    });
    return this;
  }

  timestamps(): this {
    this.timestamp("created_at", "CURRENT_TIMESTAMP");
    this.timestamp("updated_at", "CURRENT_TIMESTAMP");
    return this;
  }

  softDeletes(): this {
    this.timestamp("deleted_at").nullable();
    return this;
  }

  primary(columnName: string | string[]): this {
    this.indexes.push({
      type: "PRIMARY",
      columns: Array.isArray(columnName) ? columnName : [columnName],
    });
    return this;
  }

  unique(columnName: string | string[]): this {
    this.indexes.push({
      type: "UNIQUE",
      columns: Array.isArray(columnName) ? columnName : [columnName],
    });
    return this;
  }

  index(columnName: string | string[]): this {
    this.indexes.push({
      type: "INDEX",
      columns: Array.isArray(columnName) ? columnName : [columnName],
    });
    return this;
  }

  foreign(column: string): ForeignKeyBuilder {
    const foreignKey = new ForeignKeyBuilder(column);
    this.foreignKeys.push(foreignKey);
    return foreignKey;
  }

  nullable(): this {
    const lastColumn = this.columns[this.columns.length - 1];
    if (lastColumn) {
      lastColumn.nullable = true;
    }
    return this;
  }

  default(value: any): this {
    const lastColumn = this.columns[this.columns.length - 1];
    if (lastColumn) {
      lastColumn.default = value;
    }
    return this;
  }

  unsigned(): this {
    const lastColumn = this.columns[this.columns.length - 1];
    if (lastColumn) {
      lastColumn.unsigned = true;
    }
    return this;
  }

  toSQL(): string {
    if (this.isAlter) {
      return this.toAlterTableSQL();
    }
    return this.toCreateTableSQL();
  }

  private toCreateTableSQL(): string {
    const columnDefinitions = this.columns
      .map((col) => this.columnToSQL(col))
      .join(", ");
    const indexDefinitions = this.indexes
      .map((idx) => this.indexToSQL(idx))
      .join(", ");
    const foreignKeyDefinitions = this.foreignKeys
      .map((fk) => fk.toSQL())
      .join(", ");

    let sql = `CREATE TABLE ${this.tableName} (${columnDefinitions}`;
    if (indexDefinitions) sql += `, ${indexDefinitions}`;
    if (foreignKeyDefinitions) sql += `, ${foreignKeyDefinitions}`;
    sql += ")";

    return sql;
  }

  private toAlterTableSQL(): string {
    const alterStatements = [
      ...this.columns.map(
        (col) =>
          `ALTER TABLE ${this.tableName} ADD COLUMN ${this.columnToSQL(col)}`
      ),
      ...this.indexes.map(
        (idx) => `ALTER TABLE ${this.tableName} ADD ${this.indexToSQL(idx)}`
      ),
      ...this.foreignKeys.map(
        (fk) => `ALTER TABLE ${this.tableName} ADD ${fk.toSQL()}`
      ),
    ];
    return alterStatements.join("; ");
  }

  private columnToSQL(column: ColumnDefinition): string {
    let sql = `${column.name} ${column.type}`;
    if (column.length) {
      sql += `(${column.length})`;
    }
    if (column.unsigned) {
      sql += " UNSIGNED";
    }
    if (column.autoIncrement) {
      sql += " AUTO_INCREMENT";
    }
    if (column.primary) {
      sql += " PRIMARY KEY";
    }
    if (column.nullable) {
      sql += " NULL";
    } else {
      sql += " NOT NULL";
    }
    if (column.default !== undefined) {
      if (column.type === "TIMESTAMP") {
        sql += ` DEFAULT ${
          column.default === "CURRENT_TIMESTAMP"
            ? "CURRENT_TIMESTAMP"
            : `'${column.default}'`
        }`;
      } else {
        sql += ` DEFAULT ${this.formatDefaultValue(column.default)}`;
      }
    }
    return sql;
  }

  private indexToSQL(index: IndexDefinition): string {
    const indexType = index.type === "PRIMARY" ? "PRIMARY KEY" : index.type;
    return `${indexType} (${index.columns.join(", ")})`;
  }

  private formatDefaultValue(value: any): string {
    if (typeof value === "string") {
      return `'${value}'`;
    }
    if (typeof value === "boolean") {
      return value ? "1" : "0";
    }
    return String(value);
  }
}
