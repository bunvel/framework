import fs from "fs";
import path from "path";
import { Logger } from "../../../support";
import { CLIFormatter } from "../cli_formatter";
import { Command, type CommandArgs } from "../command";

class CountLinesCommand extends Command {
  constructor() {
    super(
      "file:lines",
      "Count the number of lines in each file in the project directory",
      []
    );
  }

  async handle(args: CommandArgs): Promise<void> {
    try {
      // Get directory from positional argument or use current directory
      const dir =
        args?.positionals.length > 0 ? args.positionals[0] : process.cwd();
      const files = this.getFiles(dir);

      const fileLineCounts = files.map((file) => ({
        path: path.relative(dir, file.path),
        lines: this.countLines(file.path),
      }));

      // Sort and slice top 10 files by line count
      const sortedFiles = fileLineCounts
        .sort((a, b) => b.lines - a.lines)
        .slice(0, 10);

      // Create output sections for formatting
      const sections = {
        "File Line Counts": sortedFiles.reduce((acc, file) => {
          acc[file.path] = `${file.lines} lines`;
          return acc;
        }, {} as { [key: string]: string }),
      };

      // Output formatted results
      console.log(CLIFormatter.formatOutput(sections));
    } catch (error) {
      Logger.error(`Error counting lines: ${error}`);
    }
  }

  private getFiles(dir: string): { path: string }[] {
    const results: { path: string }[] = [];
    const list = fs.readdirSync(dir);
  
    list.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
  
      // Ignore node_modules and other directories if needed
      if (stat.isDirectory()) {
        if (file === "node_modules" || file === ".git") return; // Skip node_modules
        results.push(...this.getFiles(filePath));
      } else {
        results.push({ path: filePath });
      }
    });
  
    return results;
  }
  

  private countLines(filePath: string): number {
    const data = fs.readFileSync(filePath, "utf8");
    return data.split("\n").length;
  }
}

export default CountLinesCommand;
