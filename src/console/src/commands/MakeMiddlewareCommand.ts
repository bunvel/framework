import { existsSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";
import { Logger } from "../../../log";
import { appPath } from "../../../support";
import Str from "../../../support/Str";
import { Command, type CommandArgs } from "../command";
import { createFile } from "../utils/file_helper";

class MakeMiddlewareCommand extends Command {
  constructor() {
    super("make:middleware", "Create a new middleware");
  }

  // Handle arguments and middleware creation
  async handle(args: CommandArgs): Promise<void> {
    const { positionals } = args;

    // Check if middleware name is provided
    if (positionals.length === 0) {
      Logger.error("Please provide a middleware name.");
      console.info(this.getHelp()); // Show help if no name is provided
      return;
    }

    const middlewareName = Str.pascalCase(positionals[0]);
    const middlewaresDir = appPath("middlewares");
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
      await createFile("Middleware", filePath, middlewareContent);
    }
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
}

export default MakeMiddlewareCommand;
