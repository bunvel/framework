export class CLIFormatter {
  /**
   * Applies ANSI color and style to text.
   * @param text - The text to be colored.
   * @param color - The color name.
   * @param style - The optional style (bold, underline, etc.).
   * @returns The formatted string with ANSI escape codes.
   */
  static colorize(text: string, color: string, style?: string): string {
    const colors: Record<string, string> = {
      reset: "\x1b[0m",
      red: "\x1b[31m",
      green: "\x1b[32m",
      yellow: "\x1b[33m",
      blue: "\x1b[34m",
      magenta: "\x1b[35m",
      cyan: "\x1b[36m",
      white: "\x1b[37m",
      gray: "\x1b[90m",
    };

    const styles: Record<string, string> = {
      bold: "\x1b[1m",
      dim: "\x1b[2m",
      italic: "\x1b[3m",
      underline: "\x1b[4m",
    };

    const styleCode = style ? styles[style] : "";
    return `${styleCode}${colors[color] || ""}${text}${colors.reset}`;
  }

  /**
   * Prints a formatted header.
   * @param text - The header text.
   */
  static printHeader(text: string): void {
    console.log("\n" + this.colorize(text, "magenta", "bold"));
  }

  /**
   * Prints an error message in red.
   * @param message - The error message.
   */
  static printError(message: string): void {
    console.error(this.colorize("Error: ", "red", "bold") + message);
  }

  /**
   * Formats structured data into a CLI-friendly output.
   * Supports nested key formatting.
   * @param sections - The structured data to format.
   * @param colors - Whether to use colors.
   * @param space - The padding space for alignment.
   * @param parentKey - The parent key for nested structures.
   * @returns A formatted string.
   */
  static formatOutput(
    sections: Record<string, unknown>,
    colors = true,
    space = 80,
    parentKey = ""
  ): string {
    const colorCodes = {
      green: colors ? "\x1b[32m" : "",
      yellow: colors ? "\x1b[33m" : "",
      red: colors ? "\x1b[31m" : "",
      gray: colors ? "\x1b[90m" : "",
      reset: colors ? "\x1b[0m" : "",
    };

    const output: string[] = [];

    Object.entries(sections).forEach(([key, value]) => {
      const fullKey = parentKey ? `${parentKey}-> ${key}` : key; // Concatenate parent and child keys

      if (typeof value === "object" && value !== null) {
        // Recursively format nested objects
        output.push(
          this.formatOutput(
            value as Record<string, unknown>,
            colors,
            space,
            fullKey
          )
        );
      } else {
        // Format value based on type
        const formattedValue =
          typeof value === "boolean"
            ? value
              ? `${colorCodes.green}true${colorCodes.reset}`
              : `${colorCodes.red}false${colorCodes.reset}`
            : typeof value === "number"
            ? `${colorCodes.yellow}${value}${colorCodes.reset}`
            : String(value);

        // Align output properly
        output.push(`${fullKey.padEnd(space, ".")} ${formattedValue}`);
      }
    });

    return output.join("\n");
  }
}
