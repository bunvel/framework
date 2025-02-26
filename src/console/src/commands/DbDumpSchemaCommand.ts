import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { Application, Config } from "../../../core";
import { type Database, DatabaseServiceProvider } from "../../../database";
import { Command } from "../command";
import { generateTimestampedFilename } from "../get_timestamp";

class DbDumpSchemaCommand extends Command {
  constructor() {
    super("db:dump", "Dump the database schema to a file");
  }

  async handle(): Promise<void> {
    const connection = await this.connectToDatabase();
    if (!connection) {
      console.error("Failed to connect to the database.");
      return;
    }

    try {
      const dbType = await Config.string("database.default");
      let schemaDump = "";

      switch (dbType) {
        case "mysql":
        case "mariadb":
          schemaDump = await this.dumpMySQLSchema(connection);
          break;
        case "pgsql":
          schemaDump = await this.dumpPostgresSchema(connection);
          break;
        case "sqlite":
          schemaDump = await this.dumpSQLiteSchema(connection);
          break;
        default:
          throw new Error(`Unsupported database type: ${dbType}`);
      }

      // Add INSERT statements for the migrations table at the end
      const migrationsInsert = await this.dumpMigrationsTable(connection);
      schemaDump += migrationsInsert;

      const databaseDir = join(process.cwd(), "database");

      if (!existsSync(databaseDir)) {
        mkdirSync(databaseDir, { recursive: true });
      }

      const dumpPath = join(
        databaseDir,
        generateTimestampedFilename("backup", "sql")
      );
      writeFileSync(dumpPath, schemaDump);
      console.log(`Schema dumped to ${dumpPath}`);
      process.exit(0);
    } catch (error) {
      console.error("Error dumping schema:", error);
    }
  }

  private async dumpMySQLSchema(connection: Database): Promise<string> {
    const result = await connection.query("SHOW TABLES");
    const tables = result.map((row: any) => Object.values(row)[0]);
    let schemaDump = "";

    for (const table of tables) {
      const createTableStmt = await connection.query(
        `SHOW CREATE TABLE ${table}`
      );
      schemaDump += createTableStmt[0]["Create Table"] + ";\n\n";
    }

    return schemaDump;
  }

  private async dumpPostgresSchema(connection: Database): Promise<string> {
    const result = await connection.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const tables = result.rows.map((row: any) => row.table_name);
    let schemaDump = "";

    for (const table of tables) {
      const createTableStmt = await connection.query(
        `SELECT pg_get_tabledef('${table}')`
      );
      schemaDump += createTableStmt.rows[0].pg_get_tabledef + ";\n\n";
    }

    return schemaDump;
  }

  private async dumpSQLiteSchema(connection: Database): Promise<string> {
    const result = await connection.query(
      "SELECT name FROM sqlite_master WHERE type='table'"
    );
    const tables = result.map((row: any) => row.name);
    let schemaDump = "";

    for (const table of tables) {
      const createTableStmt = await connection.query(
        `PRAGMA table_info(${table})`
      );
      schemaDump += `CREATE TABLE ${table} (\n`;

      createTableStmt.forEach((column: any) => {
        schemaDump += `${column.name} ${column.type},\n`;
      });

      schemaDump += ");\n\n";
    }

    return schemaDump;
  }

  // New method to dump the INSERT statements for the migrations table
  private async dumpMigrationsTable(connection: Database): Promise<string> {
    try {
      const migrations = await connection.query(
        "SELECT migration, batch FROM migrations ORDER BY id"
      );

      let insertStatements = `\n-- Insert migration data\n`;
      insertStatements += `INSERT INTO migrations (migration, batch) VALUES \n`;

      const values = migrations
        .map(
          (migration: any) => `('${migration.migration}', ${migration.batch})`
        )
        .join(",\n");

      insertStatements += values + ";\n";

      return insertStatements;
    } catch (error) {
      console.error("Error fetching migrations:", error);
      return "";
    }
  }

  private async connectToDatabase() {
    try {
      const app = Application.getInstance();
      await app.register([DatabaseServiceProvider]);
      await app.boot();

      const connection: Database = await app.make("database");
      return connection;
    } catch (error) {
      console.error("Database connection failed:", error);
      return null;
    }
  }
}

export default DbDumpSchemaCommand;
