// Blueprint ORM for multiple database support
// Supports MySQL, PostgreSQL, SQLite

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
  references: string;
  on: string;
  onDelete?: string;
  onUpdate?: string;
}

class ForeignKeyBuilder {
  private foreignKey: ForeignKeyDefinition;

  constructor(column: string) {
    this.foreignKey = { column, references: "", on: "" };
  }

  references(column: string): this {
    this.foreignKey.references = column;
    return this;
  }

  on(table: string): this {
    this.foreignKey.on = table;
    return this;
  }

  onDelete(action: string): this {
    this.foreignKey.onDelete = action;
    return this;
  }

  onUpdate(action: string): this {
    this.foreignKey.onUpdate = action;
    return this;
  }

  build(): ForeignKeyDefinition {
    return this.foreignKey;
  }
}

export class Blueprint {
  private columns: ColumnDefinition[] = [];
  private indexes: IndexDefinition[] = [];
  private foreignKeys: ForeignKeyDefinition[] = [];

  constructor(private tableName: string, private isAlter = false) {}

  private addColumn(column: ColumnDefinition): this {
    this.columns.push(column);
    return this;
  }

  increments(name: string): this {
    return this.addColumn({
      name,
      type: "INTEGER",
      autoIncrement: true,
      primary: true,
    });
  }

  integer(name: string): this {
    return this.addColumn({ name, type: "INTEGER" });
  }

  bigInteger(name: string): this {
    return this.addColumn({ name, type: "BIGINT" });
  }

  string(name: string, length = 255): this {
    return this.addColumn({ name, type: "VARCHAR", length });
  }

  text(name: string): this {
    return this.addColumn({ name, type: "TEXT" });
  }

  boolean(name: string): this {
    return this.addColumn({ name, type: "BOOLEAN" });
  }

  date(name: string): this {
    return this.addColumn({ name, type: "DATE" });
  }

  dateTime(name: string): this {
    return this.addColumn({ name, type: "DATETIME" });
  }

  timestamp(name: string, defaultValue?: string): this {
    return this.addColumn({ name, type: "TIMESTAMP", default: defaultValue });
  }

  timestamps(): this {
    this.timestamp("created_at");
    this.timestamp("updated_at");
    return this;
  }

  primary(columns: string | string[]): this {
    this.indexes.push({
      type: "PRIMARY",
      columns: Array.isArray(columns) ? columns : [columns],
    });
    return this;
  }

  unique(columns: string | string[]): this {
    this.indexes.push({
      type: "UNIQUE",
      columns: Array.isArray(columns) ? columns : [columns],
    });
    return this;
  }

  index(columns: string | string[]): this {
    this.indexes.push({
      type: "INDEX",
      columns: Array.isArray(columns) ? columns : [columns],
    });
    return this;
  }

  foreign(column: string): ForeignKeyBuilder {
    const builder = new ForeignKeyBuilder(column);
    this.foreignKeys.push(builder.build());
    return builder;
  }

  nullable(): this {
    if (this.columns.length)
      this.columns[this.columns.length - 1].nullable = true;
    return this;
  }

  default(value: any): this {
    if (this.columns.length)
      this.columns[this.columns.length - 1].default = value;
    return this;
  }

  toSQL(): string {
    return this.isAlter ? this.toAlterSQL() : this.toCreateSQL();
  }

  private toCreateSQL(): string {
    const columnDefs = this.columns
      .map((col) => this.columnToSQL(col))
      .join(", ");
    const indexDefs = this.indexes
      .map((idx) => this.indexToSQL(idx))
      .join(", ");
    const foreignDefs = this.foreignKeys
      .map((fk) => this.foreignKeyToSQL(fk))
      .join(", ");

    let sql = `CREATE TABLE ${this.tableName} (${columnDefs}`;
    if (indexDefs) sql += `, ${indexDefs}`;
    if (foreignDefs) sql += `, ${foreignDefs}`;
    sql += ")";

    return sql;
  }

  private toAlterSQL(): string {
    const alterColumns = this.columns
      .map((col) => `ADD ${this.columnToSQL(col)}`)
      .join(", ");
    const alterIndexes = this.indexes
      .map((idx) => `ADD ${this.indexToSQL(idx)}`)
      .join(", ");
    const alterForeigns = this.foreignKeys
      .map((fk) => `ADD ${this.foreignKeyToSQL(fk)}`)
      .join(", ");

    return `ALTER TABLE ${this.tableName} ${[
      alterColumns,
      alterIndexes,
      alterForeigns,
    ]
      .filter(Boolean)
      .join(", ")}`;
  }

  private columnToSQL(column: ColumnDefinition): string {
    const parts = [`${column.name} ${column.type}`];
    if (column.length) parts.push(`(${column.length})`);
    if (column.unsigned) parts.push("UNSIGNED");
    if (column.autoIncrement) parts.push("AUTO_INCREMENT");
    if (column.primary) parts.push("PRIMARY KEY");
    parts.push(column.nullable ? "NULL" : "NOT NULL");
    if (column.default !== undefined) parts.push(`DEFAULT '${column.default}'`);
    return parts.join(" ");
  }

  private indexToSQL(index: IndexDefinition): string {
    return `${
      index.type === "PRIMARY" ? "PRIMARY KEY" : `${index.type} INDEX`
    } (${index.columns.join(", ")})`;
  }

  private foreignKeyToSQL(fk: ForeignKeyDefinition): string {
    return (
      `FOREIGN KEY (${fk.column}) REFERENCES ${fk.on}(${fk.references})` +
      (fk.onDelete ? ` ON DELETE ${fk.onDelete}` : "") +
      (fk.onUpdate ? ` ON UPDATE ${fk.onUpdate}` : "")
    );
  }
}
