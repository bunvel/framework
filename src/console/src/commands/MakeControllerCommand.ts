import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { Logger } from "../../../log";
import { appPath } from "../../../support";
import Str from "../../../support/str";
import { Command, type CommandArgs } from "../command";
import { createFile } from "../utils/file_helper";

class MakeControllerCommand extends Command {
  constructor() {
    super("make:controller", "Create a new controller");
    this.option("resource", "Create a resource controller", "r").option(
      "api",
      "Create an API controller",
      "a"
    );
  }

  async handle(args: CommandArgs): Promise<void> {
    let controllerName: string;

    if (Array.isArray(args) && args.length > 0) {
      // Handle case where args is an array (direct command line arguments)
      controllerName = this.formatName(args[0]);
    } else if (typeof args === "object" && args !== null) {
      // Handle case where args is an object (parsed arguments)
      const { positionals = [], options = {} } = args;

      if (positionals.length === 0) {
        Logger.error("Please provide a controller name.");
        return;
      }
      controllerName = this.formatName(positionals[0]);
    } else {
      Logger.error(
        "Invalid arguments provided. Please provide a controller name."
      );
      return;
    }

    const controllersDir = appPath("controllers");
    const filePath = join(controllersDir, `${controllerName}.ts`);

    const { positionals = [], options = {} } = args;

    const isResourceController = options.resource || positionals[1] == "-r";
    const isApiController = options.api || positionals[1] == "-api";

    if (!existsSync(controllersDir)) {
      mkdirSync(controllersDir, { recursive: true });
    }

    if (existsSync(filePath)) {
      Logger.error(`Controller already exists: ${controllerName}`);
      return;
    }

    const stubFile = this.getStubFile(isResourceController, isApiController);
    const stubContent = await Bun.file(stubFile).text();
    const controllerContent = stubContent.replace(/{{name}}/g, controllerName);

    await createFile("Controller", filePath, controllerContent);
  }

  private formatName(name: string): string {
    return Str.pascalCase(name) + "Controller";
  }

  private getStubFile(isResource: boolean, isApi: boolean): string {
    if (isApi) {
      return join(__dirname, "..", "stubs", "api-controller.stub");
    } else if (isResource) {
      return join(__dirname, "..", "stubs", "resource-controller.stub");
    } else {
      return join(__dirname, "..", "stubs", "controller.stub");
    }
  }
}

export default MakeControllerCommand;
