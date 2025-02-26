export interface CommandArgs {
  positionals: string[];
  options: Record<string, boolean>;
}

export abstract class Command {
  protected options: {
    [key: string]: { description: string; alias?: string };
  } = {};

  constructor(
    protected signature: string,
    protected description: string,
    protected aliases: string[] = []
  ) {}

  // Define command options with aliases and descriptions
  option(name: string, description: string, alias?: string): this {
    this.options[name] = { description, alias };
    return this; // allows chaining
  }

  // Abstract handle method to be implemented by concrete commands
  abstract handle(args: CommandArgs): Promise<void>;

  // Signature getter
  getSignature(): string {
    return this.signature;
  }

  // Description getter
  getDescription(): string {
    return this.description;
  }

  // Aliases getter
  getAliases(): string[] {
    return this.aliases;
  }

  // Get options with their descriptions
  getOptions(): { [key: string]: { description: string; alias?: string } } {
    return this.options;
  }

  // Default help output for each command
  getHelp(): string {
    const optionDescriptions = Object.keys(this.options)
      .map((option) => {
        const alias = this.options[option].alias
          ? ` (-${this.options[option].alias})`
          : "";
        return `--${option}${alias}: ${this.options[option].description}`;
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

  // Parses arguments into positionals and options
  protected parseArgs(rawArgs: string[]): {
    positionals: string[];
    options: Record<string, any>;
  } {
    const positionals: string[] = [];
    const options: Record<string, any> = {};

    let i = 0;
    while (i < rawArgs.length) {
      const arg = rawArgs[i];

      if (arg.startsWith("--")) {
        // Handle long options
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
        // Handle short options
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

  // Returns option name from alias
  private getOptionNameFromAlias(alias: string): string | undefined {
    for (const [option, data] of Object.entries(this.options)) {
      if (data.alias === alias) {
        return option;
      }
    }
    return undefined;
  }

  // Common hook before handling a command
  protected async beforeHandle(): Promise<void> {
    // To be overridden if needed
  }

  // Common hook after handling a command
  protected async afterHandle(): Promise<void> {
    // To be overridden if needed
  }

  // Execute the command
  async run(rawArgs: string[]): Promise<void> {
    await this.beforeHandle();
    const args = this.parseArgs(rawArgs);
    await this.handle(args);
    await this.afterHandle();
  }
}
