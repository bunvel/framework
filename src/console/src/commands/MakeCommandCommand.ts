import { existsSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";
import { Logger } from "../../../log";
import { appPath } from "../../../support";
import Str from "../../../support/Str";
import { Command, type CommandArgs } from "../command";
import { createFile } from "../utils/file_helper";

class MakeCommandCommand extends Command {
  constructor() {
    super("make:command", "Create a new command");
  }

  async handle(args: CommandArgs): Promise<void> {
    if (args.positionals.length === 0) {
      Logger.error("Please provide a command name.");
      return;
    }

    const commandName = Str.pascalCase(args.positionals[0]);
    const commandsDir = appPath("commands");
    const filePath = join(commandsDir, `${commandName}Command.ts`);

    if (!existsSync(commandsDir)) {
      mkdirSync(commandsDir, { recursive: true });
    }

    if (existsSync(filePath)) {
      Logger.error(`Command already exists: ${commandName}`);
      return;
    }

    const commandContent = this.getStubContent("command.stub", commandName);
    await createFile("Command", filePath, commandContent);
  }

  private getStubContent(stubFileName: string, commandName: string): string {
    const stubPath = join(__dirname, "..", "stubs", stubFileName);
    let content = readFileSync(stubPath, "utf8");
    content = content.replace(/{{commandName}}/g, commandName);
    return content;
  }
}

export default MakeCommandCommand;
