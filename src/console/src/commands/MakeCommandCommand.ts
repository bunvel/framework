import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { Logger } from "../../../log";
import Str from "../../../support/Str";
import { Command, type CommandArgs } from "../command";

class MakeCommandCommand extends Command {
  constructor() {
    super("make:command", "Create a new command");
  }

  async handle(args: CommandArgs): Promise<void> {
    if (args.positionals.length === 0) {
      Logger.error("Please provide a command name.");
      return;
    }

    const commandName = this.formatName(args.positionals[0]);
    const commandsDir = join(process.cwd(), "app", "commands");
    const filePath = join(commandsDir, `${commandName}Command.ts`);

    if (!existsSync(commandsDir)) {
      mkdirSync(commandsDir, { recursive: true });
    }

    if (existsSync(filePath)) {
      Logger.error(`Command already exists: ${commandName}`);
      return;
    }

    const commandContent = this.getStubContent("command.stub", commandName);
    this.createFile(filePath, commandContent);
  }

  private formatName(name: string): string {
    return Str.pascalCase(name);
  }

  private getStubContent(stubFileName: string, commandName: string): string {
    const stubPath = join(__dirname, "..", "stubs", stubFileName);
    let content = readFileSync(stubPath, "utf8");
    content = content.replace(/{{commandName}}/g, commandName);
    return content;
  }

  private createFile(filePath: string, content: string): void {
    try {
      writeFileSync(filePath, content);
      Logger.info(`Command created successfully: [${filePath}]`);
    } catch (error) {
      Logger.error(`Error creating command: ${error}`);
    }
  }
}

export default MakeCommandCommand;
