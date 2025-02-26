import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { Logger } from "../../../support";
import { Command } from "../command";

class MakeTypeCommand extends Command {
  constructor() {
    super("make:type", "Create a new type");
  }

  async handle(args: any = {}): Promise<void> {
    let typeName: string;

    if (Array.isArray(args) && args.length > 0) {
      typeName = this.formatName(args[0]);
    } else if (typeof args === "object" && args !== null) {
      const { positionals = [], options = {} } = args;

      if (positionals.length === 0) {
        Logger.error("Please provide a type name.");
        return;
      }
      typeName = this.formatName(positionals[0]);
    } else {
      Logger.error("Invalid arguments provided. Please provide a type name.");
      return;
    }

    const typesDir = join(process.cwd(), "app", "types");
    const filePath = join(typesDir, `${typeName}.ts`);

    if (!existsSync(typesDir)) {
      mkdirSync(typesDir, { recursive: true });
    }

    if (existsSync(filePath)) {
      Logger.error(`Type already exists: ${typeName}`);
      return;
    }

    const typeContent = this.getStubContent("type.stub", typeName);
    this.createFile(filePath, typeContent);
  }

  private formatName(name: string): string {
    return `${name.charAt(0).toUpperCase() + name.slice(1)}`;
  }

  private getStubContent(stubFileName: string, typeName: string): string {
    const stubPath = join(__dirname, "..", "stubs", stubFileName);
    try {
      let content = readFileSync(stubPath, "utf8");
      content = content.replace(/{{typeName}}/g, typeName);
      return content;
    } catch (error: any) {
      Logger.error(`Error reading stub file: ${stubFileName}`, error);
      return `export type ${typeName} = {\n  // Add type properties here\n};`;
    }
  }

  private createFile(filePath: string, content: string): void {
    try {
      writeFileSync(filePath, content);
      Logger.info(`Type created successfully: [${filePath}]`);
    } catch (error: any) {
      Logger.error("Error creating type:", error);
    }
  }
}

export default MakeTypeCommand;
