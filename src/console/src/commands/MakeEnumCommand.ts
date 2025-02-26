import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { Logger } from "../../../support";
import { Command } from "../command";

class MakeEnumCommand extends Command {
  constructor() {
    super("make:enum", "Create a new enum");
  }

  async handle(args: any = {}): Promise<void> {
    let enumName: string;

    if (Array.isArray(args) && args.length > 0) {
      enumName = this.formatName(args[0]);
    } else if (typeof args === "object" && args !== null) {
      const { positionals = [], options = {} } = args;

      if (positionals.length === 0) {
        Logger.error("Please provide an enum name.");
        return;
      }
      enumName = this.formatName(positionals[0]);
    } else {
      Logger.error("Invalid arguments provided. Please provide an enum name.");
      return;
    }

    const enumsDir = join(process.cwd(), "app", "enums");
    const filePath = join(enumsDir, `${enumName}.ts`);

    if (!existsSync(enumsDir)) {
      mkdirSync(enumsDir, { recursive: true });
    }

    if (existsSync(filePath)) {
      Logger.error(`Enum already exists: ${enumName}`);
      return;
    }

    const enumContent = this.getStubContent("enum.stub", enumName);
    this.createFile(filePath, enumContent);
  }

  private formatName(name: string): string {
    return `${name.charAt(0).toUpperCase() + name.slice(1)}`;
  }

  private getStubContent(stubFileName: string, enumName: string): string {
    const stubPath = join(__dirname, "..", "stubs", stubFileName);
    try {
      let content = readFileSync(stubPath, "utf8");
      content = content.replace(/{{enumName}}/g, enumName);
      return content;
    } catch (error: any) {
      Logger.error(`Error reading stub file: ${stubFileName}`, error);
      return `export enum ${enumName} {\n  // Add enum values here\n}`;
    }
  }

  private createFile(filePath: string, content: string): void {
    try {
      writeFileSync(filePath, content);
      Logger.error(`Enum created successfully: [${filePath}]`);
    } catch (error: any) {
      Logger.error("Error creating enum:", error);
    }
  }
}

export default MakeEnumCommand;
