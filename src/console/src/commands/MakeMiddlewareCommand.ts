import { Logger } from "@bunvel/log";
import Str from "@bunvel/support/Str";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { Command } from "../command";

class MakeMiddlewareCommand extends Command {
  constructor() {
    super("make:middleware", "Create a new middleware");
  }

  // Handle arguments and middleware creation
  async handle(args: {
    positionals: string[];
    options: Record<string, any>;
  }): Promise<void> {
    const { positionals } = args;

    // Check if middleware name is provided
    if (positionals.length === 0) {
      Logger.error("Please provide a middleware name.");
      console.info(this.getHelp()); // Show help if no name is provided
      return;
    }

    const middlewareName = this.formatName(positionals[0]);
    const middlewaresDir = join(process.cwd(), "app", "middlewares");
    const filePath = join(middlewaresDir, `${middlewareName}Middleware.ts`);

    // Ensure middleware directory exists
    if (!existsSync(middlewaresDir)) {
      mkdirSync(middlewaresDir, { recursive: true });
    }

    // Generate content from stub and create the middleware file
    const middlewareContent = this.getStubContent(
      "middleware.stub",
      middlewareName
    );
    if (middlewareContent) {
      this.createFile(filePath, middlewareContent);
    }
  }

  // Format the middleware name properly (capitalize first letter)
  private formatName(name: string): string {
    return Str.pascalCase(name);
  }

  // Get the content of the stub and replace placeholders
  private getStubContent(
    stubFileName: string,
    middlewareName: string
  ): string | null {
    try {
      const stubPath = join(__dirname, "..", "stubs", stubFileName);
      let content = readFileSync(stubPath, "utf8");
      content = content.replace(/{{middlewareName}}/g, middlewareName);
      return content;
    } catch (error: any) {
      Logger.error("Error reading the stub file:", error);
      return null;
    }
  }

  // Create the middleware file
  private createFile(filePath: string, content: string): void {
    try {
      writeFileSync(filePath, content);
      Logger.info(`Middleware created successfully: [${filePath}]`);
    } catch (error: any) {
      Logger.error("Error creating middleware:", error);
    }
  }
}

export default MakeMiddlewareCommand;
