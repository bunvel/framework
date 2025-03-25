/**
 * Represents the parsed command arguments, including positional arguments and options.
 */
export interface CommandArgs {
  positionals: string[];
  options: Record<string, any>;
}

/**
 * Abstract base class for creating CLI commands.
 * Provides functionality for defining command options, parsing arguments, and executing commands.
 */
export abstract class Command {
  /**
   * Stores command options with their descriptions and optional aliases.
   */
  protected options: Record<string, { description: string; alias?: string }> =
    {};

  /**
   * @param signature The command name or identifier.
   * @param description A brief description of the command's purpose.
   * @param aliases Alternative names for the command.
   */
  constructor(
    protected signature: string,
    protected description: string,
    protected aliases: string[] = []
  ) {}

  /**
   * Defines a new option for the command.
   *
   * @param name The option name (e.g., `"verbose"` for `--verbose`).
   * @param description A brief explanation of what the option does.
   * @param alias (Optional) A short alias (e.g., `"v"` for `-v`).
   * @returns The current instance to allow method chaining.
   */
  option(name: string, description: string, alias?: string): this {
    this.options[name] = { description, alias };
    return this;
  }

  /**
   * Abstract method to be implemented by subclasses.
   * Defines the command execution logic.
   *
   * @param args Parsed command arguments.
   */
  abstract handle(args: CommandArgs): Promise<void>;

  /**
   * Gets the command signature (name).
   * @returns The command signature.
   */
  getSignature(): string {
    return this.signature;
  }

  /**
   * Gets the command description.
   * @returns The command description.
   */
  getDescription(): string {
    return this.description;
  }

  /**
   * Gets the list of command aliases.
   * @returns An array of alias names.
   */
  getAliases(): string[] {
    return this.aliases;
  }

  /**
   * Retrieves the available command options along with their descriptions.
   * @returns A record of option names and their metadata.
   */
  getOptions(): Record<string, { description: string; alias?: string }> {
    return this.options;
  }

  /**
   * Generates and returns a help message for the command.
   *
   * @returns A formatted string containing command usage details.
   */
  getHelp(): string {
    const optionDescriptions = Object.entries(this.options)
      .map(([name, { description, alias }]) => {
        const aliasText = alias ? ` (-${alias})` : "";
        return `--${name}${aliasText}: ${description}`;
      })
      .join("\n");

    return `
    Command: ${this.getSignature()}
    Description: ${this.getDescription()}
    Aliases: ${this.getAliases().join(", ") || "None"}
    
    Options:
    ${optionDescriptions || "No options available."}
    `;
  }

  /**
   * Parses raw command-line arguments into positional arguments and options.
   *
   * @param rawArgs An array of command-line arguments.
   * @returns An object containing `positionals` (non-option arguments) and `options` (key-value pairs).
   */
  protected parseArgs(rawArgs: string[]): CommandArgs {
    const positionals: string[] = [];
    const options: Record<string, any> = {};

    let i = 0;
    while (i < rawArgs.length) {
      const arg = rawArgs[i];

      if (arg.startsWith("--")) {
        // Handle long options (e.g., --verbose or --name=value)
        const optionName = arg.slice(2);
        if (optionName.includes("=")) {
          const [name, value] = optionName.split("=");
          options[name] = value;
        } else {
          options[optionName] = true;
          // Check if the next argument is a value for this option
          if (i + 1 < rawArgs.length && !rawArgs[i + 1].startsWith("-")) {
            options[optionName] = rawArgs[++i];
          }
        }
      } else if (arg.startsWith("-")) {
        // Handle short options (e.g., -v or -n value)
        const aliases = arg.slice(1);
        for (const alias of aliases) {
          const optionName = this.getOptionNameFromAlias(alias);
          if (optionName) {
            options[optionName] = true;
            // Check if the next argument is a value for this option
            if (i + 1 < rawArgs.length && !rawArgs[i + 1].startsWith("-")) {
              options[optionName] = rawArgs[++i];
            }
          }
        }
      } else {
        // Positional arguments
        positionals.push(arg);
      }

      i++;
    }

    return { positionals, options };
  }

  /**
   * Retrieves the option name associated with a given alias.
   *
   * @param alias The alias character to lookup.
   * @returns The corresponding option name or `undefined` if not found.
   */
  private getOptionNameFromAlias(alias: string): string | undefined {
    for (const [option, data] of Object.entries(this.options)) {
      if (data.alias === alias) {
        return option;
      }
    }
    return undefined;
  }

  /**
   * Executes the command with the provided arguments.
   *
   * @param rawArgs Raw command-line arguments.
   */
  async run(rawArgs: string[]): Promise<void> {
    const args = this.parseArgs(rawArgs);
    await this.handle(args);
  }
}
