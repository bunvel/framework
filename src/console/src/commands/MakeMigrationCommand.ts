import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { Logger } from "../../../log";
import { databasePath } from "../../../support";
import Str from "../../../support/str";
import { Command, type CommandArgs } from "../command";

class MakeMigrationCommand extends Command {
  constructor() {
    super("make:migration", "Create a new migration");
  }

  async handle(args: CommandArgs): Promise<void> {
    const migrationName = this.getMigrationName(args);

    if (!migrationName) {
      Logger.error("Migration name is required.");
      return;
    }

    const migrationsDir = databasePath("migrations");

    if (!existsSync(migrationsDir)) {
      mkdirSync(migrationsDir, { recursive: true });
    }

    const timestamp = this.getTimestamp();
    const formattedName = this.formatMigrationName(migrationName);
    const fileName = `${timestamp}_${formattedName}.ts`;
    const filePath = join(migrationsDir, fileName);

    if (existsSync(filePath)) {
      Logger.error(`Migration file already exists: ${fileName}`);
      return;
    }

    const tableName = this.getTableName(formattedName);
    const stubFile = this.getStubFile();
    const content = await this.getMigrationContent(stubFile, tableName);

    try {
      await Bun.write(filePath, content.trim());
      Logger.info(`Migration file created: [${migrationsDir}/${fileName}]`);
    } catch (error: any) {
      Logger.error("Error creating migration file:", error);
    }
  }

  private getMigrationName({ positionals }: CommandArgs): string | null {
    if (Array.isArray(positionals) && positionals.length > 0) {
      return this.formatMigrationName(positionals[0]);
    } else {
      Logger.error(
        "Invalid arguments provided. Please provide a migration name."
      );
      return null;
    }
  }

  private getTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // Last 2 digits of the year
    const month = this.padNumber(now.getMonth() + 1);
    const day = this.padNumber(now.getDate());
    const hours = this.padNumber(now.getHours());
    const minutes = this.padNumber(now.getMinutes());
    const seconds = this.padNumber(now.getSeconds());

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  private padNumber(num: number): string {
    return num.toString().padStart(2, "0");
  }

  private formatMigrationName(name: string): string {
    // Remove unwanted characters and convert to lowercase
    name = Str.snakeCase(name).toLowerCase();

    // Check if the name starts with "create", "alter", or "add"
    const validPrefixes = ["create", "alter", "add", "modify"];
    const startsWithValidPrefix = validPrefixes.some((prefix) =>
      name.startsWith(prefix)
    );

    // Add "create_" prefix and "_table" suffix if it doesn't start with a valid prefix
    if (!startsWithValidPrefix) {
      name = `create_${name}_table`;
    }

    return name;
  }

  private getTableName(name: string): string {
    // Convert the name to lowercase
    name = Str.snakeCase(name).toLowerCase();

    // Check if the name ends with '_table'
    if (name.endsWith("_table")) {
      // Extract the word before '_table'
      const matches = name.match(/_([a-z0-9]+)_table$/);
      if (matches && matches[1]) {
        return Str.plural(matches[1]);
      }
    }

    // If it's just 'User' or 'user' or doesn't follow the pattern
    return Str.plural(name);
  }

  private getStubFile(): string {
    return join(__dirname, "..", "stubs", "migration.stub");
  }

  private async getMigrationContent(
    stubFile: string,
    tableName: string
  ): Promise<string> {
    const stubContent = await Bun.file(stubFile).text();
    return stubContent
      .replace(/{{className}}/g, Str.pascalCase(tableName))
      .replace(/{{tableName}}/g, tableName);
  }
}

export default MakeMigrationCommand;
