import Str from "@bunvel/support/Str";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { Logger } from "../../../support";
import { Command } from "../command";

class MakeInterfaceCommand extends Command {
  constructor() {
    super("make:interface", "Create a new interface");
  }

  async handle(args: any = {}): Promise<void> {
    let interfaceName: string;

    if (Array.isArray(args) && args.length > 0) {
      // Handle case where args is an array (direct command line arguments)
      interfaceName = this.formatName(args[0]);
    } else if (typeof args === "object" && args !== null) {
      // Handle case where args is an object (parsed arguments)
      const { positionals = [], options = {} } = args;

      if (positionals.length === 0) {
        Logger.error("Please provide an interface name.");
        return;
      }
      interfaceName = this.formatName(positionals[0]);
    } else {
      Logger.error(
        "Invalid arguments provided. Please provide an interface name."
      );
      return;
    }

    const interfacesDir = join(process.cwd(), "app", "interfaces");
    const filePath = join(interfacesDir, `${interfaceName}.ts`);

    if (!existsSync(interfacesDir)) {
      mkdirSync(interfacesDir, { recursive: true });
    }

    if (existsSync(filePath)) {
      Logger.error(`Interface already exists: ${interfaceName}`);
      return;
    }

    const interfaceContent = this.getStubContent(
      "interface.stub",
      interfaceName
    );
    this.createFile(filePath, interfaceContent);
  }

  private formatName(name: string): string {
    return Str.pascalCase(name);
  }

  private getStubContent(stubFileName: string, interfaceName: string): string {
    const stubPath = join(__dirname, "..", "stubs", stubFileName);
    try {
      let content = readFileSync(stubPath, "utf8");
      content = content.replace(/{{interfaceName}}/g, interfaceName);
      return content;
    } catch (error: any) {
      Logger.error(`Error reading stub file: ${stubFileName}`, error);
      return `export interface ${interfaceName} {\n  // Add interface properties here\n}`;
    }
  }

  private createFile(filePath: string, content: string): void {
    try {
      writeFileSync(filePath, content);
      console.log(`Interface created successfully: ${filePath}`);
    } catch (error: any) {
      Logger.error("Error creating interface:", error);
    }
  }
}

export default MakeInterfaceCommand;
