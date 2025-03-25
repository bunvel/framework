import { CLIFormatter } from "./cli_formatter";
import type { Command } from "./command";
import { CommandLoader } from "./command_loader";

/**
 * CLI class to manage and execute registered commands.
 */
export class CLI {
  private commands: Map<string, Command> = new Map();
  private aliases: Map<string, string> = new Map();

  /**
   * Initializes the CLI by loading commands and registering their aliases.
   */
  private async initialize(): Promise<void> {
    this.commands = await CommandLoader.loadCommands(__dirname);
    this.registerAliases();
  }

  /**
   * Registers aliases for commands to allow alternative command names.
   */
  private registerAliases(): void {
    this.commands.forEach((command) => {
      command.getAliases().forEach((alias) => {
        this.aliases.set(alias, command.getSignature());
      });
    });
  }

  /**
   * Runs the CLI, executing the appropriate command based on user input.
   * @param args - Command-line arguments passed by the user.
   */
  async run(args: string[]): Promise<void> {
    try {
      await this.initialize();

      if (args.length === 0 || ["list", "help"].includes(args[0])) {
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
    } catch (error) {
      CLIFormatter.printError(`Initialization failed: ${String(error)}`);
    }
  }

  /**
   * Displays a list of available commands grouped by category.
   */
  private listCommands(): void {
    CLIFormatter.printHeader("Available Commands");

    const groupedCommands = this.groupCommands();

    // Display general commands first
    if (groupedCommands.has("general")) {
      this.displayCommandGroup("General", groupedCommands.get("general")!);
    }

    // Display other grouped commands
    for (const [group, commands] of groupedCommands) {
      if (group !== "general") {
        this.displayCommandGroup(group, commands);
      }
    }
  }

  /**
   * Displays a formatted group of commands in the CLI.
   * @param group - The category name of the commands.
   * @param commands - Array of commands within the category.
   */
  private displayCommandGroup(group: string, commands: Command[]): void {
    console.log(CLIFormatter.colorize(`\n${group}`, "yellow", "bold"));

    const COMMAND_WIDTH = 30; // Fixed width for alignment

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

  /**
   * Groups commands based on their signature prefix (e.g., `group:command`).
   * @returns A map where the key is the group name and the value is an array of commands.
   */
  private groupCommands(): Map<string, Command[]> {
    const groups = new Map<string, Command[]>();

    for (const command of this.commands.values()) {
      const [group] = command.getSignature().split(":") ?? ["general"];

      if (!groups.has(group)) {
        groups.set(group, []);
      }
      groups.get(group)!.push(command);
    }

    return groups;
  }
}
