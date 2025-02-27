import Str from "@bunvel/support/Str";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { Logger } from "../../../support";
import { Command } from "../command";
import MakeControllerCommand from "./MakeControllerCommand";
import MakeMigrationCommand from "./MakeMigrationCommand";

class MakeModelCommand extends Command {
  constructor() {
    super("make:model", "Create a new model");
    this.option(
      "resource",
      "Generate a resource controller for the model",
      "r"
    );
    this.option("api", "Generate an API controller for the model");
    this.option("migration", "Generate a migration file for the model", "m");
  }

  async handle(args: any = {}): Promise<void> {
    const { positionals = [], options = {} } = args;

    if (positionals.length === 0) {
      Logger.error("Please provide a model name.");
      return;
    }

    const modelName = this.formatName(positionals[0]);
    const tableName = this.formatTableName(positionals[0]);

    const shouldCreateModel = true;
    const shouldCreateMigration = options["migration"] || options["m"];
    const isResource = options["resource"] || options["r"] || !options["api"];
    const isApi = options["api"];

    const modelsDir = join(process.cwd(), "app", "models");
    const modelFilePath = join(modelsDir, `${modelName}.ts`);

    // Ensure models directory exists
    if (!existsSync(modelsDir)) {
      mkdirSync(modelsDir, { recursive: true });
    }

    // Check if model already exists
    if (existsSync(modelFilePath) && shouldCreateModel) {
      Logger.error(`Model already exists: ${modelName}`);
      return;
    }

    // Create the model file
    if (shouldCreateModel) {
      const modelContent = this.getStubContent(
        "model.stub",
        modelName,
        tableName
      );
      this.createFile(modelFilePath, modelContent);
    }

    // Create migration if requested
    if (shouldCreateMigration) {
      await this.createMigration(modelName);
    }

    // Create controller if requested
    if (isResource || isApi) {
      await this.createController(modelName, isResource, isApi);
    }
  }

  // Format the model name (capitalize the first letter)
  private formatName(name: string): string {
    return Str.pascalCase(name);
  }

  // Format the table name using snake_case and pluralize it
  private formatTableName(name: string): string {
    const snakeCaseName = Str.snakeCase(name)
      .toLowerCase();
    return Str.plural(snakeCaseName);
  }

  // Get the content of the stub file
  private getStubContent(
    stubFileName: string,
    name: string,
    tableName: string
  ): string {
    const stubPath = join(__dirname, "..", "stubs", stubFileName);
    try {
      let content = readFileSync(stubPath, "utf8");
      content = content.replace(/{{name}}/g, name);
      content = content.replace(/{{tableName}}/g, tableName);
      return content;
    } catch (error: any) {
      Logger.error(`Error reading the stub file: ${stubFileName}`, error);
      return "";
    }
  }

  // Create the model file with content
  private createFile(filePath: string, content: string): void {
    try {
      writeFileSync(filePath, content);
      Logger.info(`Model created successfully: [${filePath}]`);
    } catch (error: any) {
      Logger.error("Error creating model:", error);
    }
  }

  // Create a controller if requested with --resource or --api options
  private async createController(
    modelName: string,
    isResource: boolean,
    isApi: boolean
  ): Promise<void> {
    const controllerCommand = new MakeControllerCommand();
    const args = [modelName]; // Base argument

    if (isResource) {
      args.push("-r");
    }

    if (isApi) {
      args.push("-api");
    }

    // Call the controller command to generate the controller
    await controllerCommand.handle({ positionals: args, options: {} });
  }

  // Create a migration file if requested with --migration or -m option
  private async createMigration(modelName: string): Promise<void> {
    const migrationCommand = new MakeMigrationCommand();
    const args = [modelName];

    await migrationCommand.handle({ positionals: args, options: {} });
  }
}

export default MakeModelCommand;
