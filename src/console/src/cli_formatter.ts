export class CLIFormatter {
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

    return `${style ? styles[style] : ""}${colors[color]}${text}${
      colors.reset
    }`;
  }

  static printHeader(text: string) {
    console.log("\n" + this.colorize(text, "magenta", "bold"));
  }

  static printError(message: string) {
    console.error(this.colorize("Error: ", "red", "bold") + message);
  }

  // Recursive formatter with nested key handling
  static formatOutput = (
    sections: { [key: string]: any },
    colors = true,
    space = 80,
    parentKey = ""
  ): string => {
    const green = colors ? "\x1b[32m" : "";
    const yellow = colors ? "\x1b[33m" : "";
    const red = colors ? "\x1b[31m" : "";
    const gray = colors ? "\x1b[90m" : "";
    const reset = colors ? "\x1b[0m" : "";

    let output = "";

    Object.entries(sections).forEach(([key, value]) => {
      const fullKey = parentKey ? `${parentKey}-> ${key} ` : `${key} `; // Concatenate parent and child keys

      if (typeof value === "object" && value !== null) {
        // Recursive call for nested objects
        output += this.formatOutput(value, colors, space, fullKey);
      } else {
        // Format value based on its type (boolean, integer, etc.)
        const formattedValue =
          typeof value === "boolean"
            ? value
              ? `${green}true${reset}`
              : `${red}false${reset}`
            : typeof value === "number"
            ? value
              ? `${yellow}${value}${reset}`
              : value
            : value;

        // Add the formatted output
        output += `${fullKey.padEnd(space, ".")} ${formattedValue}\n`;
      }
    });

    return output;
  };
}
