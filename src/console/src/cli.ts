import { CLIFormatter } from "./cli_formatter";
import type { Command } from "./command";
import { CommandLoader } from "./command_loader";

export class CLI {
  private commands: Map<string, Command> = new Map();
  private aliases: Map<string, string> = new Map();

  constructor() {}

  async initialize() {
    this.commands = await CommandLoader.loadCommands(__dirname);
    this.registerAliases();
  }

  private registerAliases() {
    this.commands.forEach((command) => {
      command.getAliases().forEach((alias) => {
        this.aliases.set(alias, command.getSignature());
      });
    });
  }

  async run(args: string[]) {
    await this.initialize();

    if (args.length === 0 || args[0] === "list" || args[0] === "help") {
      this.listCommands();
      return;
    }

    const commandName = args[0];
    const resolvedCommandName = this.aliases.get(commandName) || commandName;
    const command = this.commands.get(resolvedCommandName);

    if (command) {
      try {
        await command.run(args.slice(1));
      } catch (error) {
        CLIFormatter.printError(
          `Error executing command: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    } else {
      CLIFormatter.printError(`Unknown command: ${commandName}`);
      this.listCommands();
    }
  }

  private listCommands() {
    CLIFormatter.printHeader("Available Commands");

    const groupedCommands = this.groupCommands();

    // First, display commands without colons
    if (groupedCommands.has("general")) {
      const generalCommands = groupedCommands.get("general")!;
      this.displayCommandGroup("General", generalCommands);
    }

    // Then, display grouped commands
    for (const [group, commands] of groupedCommands) {
      if (group !== "general") {
        this.displayCommandGroup(group, commands);
      }
    }
  }

  private displayCommandGroup(group: string, commands: Command[]) {
    console.log(CLIFormatter.colorize(`\n${group}`, "yellow", "bold"));

    const COMMAND_WIDTH = 30; // Set fixed width for command names

    commands.forEach((command) => {
      const paddedSignature = command.getSignature().padEnd(COMMAND_WIDTH, " ");
      console.log(
        `  ${CLIFormatter.colorize(
          paddedSignature,
          "cyan"
        )} : ${command.getDescription()}`
      );
    });
  }

  private groupCommands(): Map<string, Command[]> {
    const groups = new Map<string, Command[]>();

    for (const command of this.commands.values()) {
      const signature = command.getSignature();
      const [group] = signature.includes(":")
        ? signature.split(":")
        : ["general"];

      if (!groups.has(group)) {
        groups.set(group, []);
      }
      groups.get(group)!.push(command);
    }

    return groups;
  }
}
