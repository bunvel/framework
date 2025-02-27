import fs from "fs";
import path from "path";
import { Logger } from "../../../support";
import { CLIFormatter } from "../cli_formatter";
import { Command } from "../command";

class FindLargestFilesCommand extends Command {
  constructor() {
    super("file:sizes", "Find the largest files in the project directory", []);
  }

  async handle(args: any = {}): Promise<void> {
    try {
      // Default to current directory if no positional argument is provided
      const dir = args.length > 0 ? args[0] : process.cwd();
      const files = this.getFiles(dir);

      // Sort files by size in descending order and take top 10
      const sortedFiles = files.sort((a, b) => b.size - a.size).slice(0, 10);

      // Prepare sections for CLIFormatter
      const sections = {
        "Largest Files": sortedFiles.reduce((acc, file) => {
          const size =
            file.size > 1000
              ? (file.size / 1000).toFixed(2) + " KB"
              : file.size + " bytes";
          acc[path.relative(dir, file.path)] = size;
          return acc;
        }, {} as { [key: string]: string }),
      };

      // Output formatted results
      console.log(CLIFormatter.formatOutput(sections));
    } catch (error) {
      Logger.error(`Error finding largest files: ${error}`);
    }
  }

  private getFiles(dir: string): { path: string; size: number }[] {
    const results: { path: string; size: number }[] = [];
    const list = fs.readdirSync(dir);

    list.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        if (file === "node_modules" || file === ".git") return; // Skip node_modules
        results.push(...this.getFiles(filePath));
      } else {
        results.push({ path: filePath, size: stat.size });
      }
    });

    return results;
  }
}

export default FindLargestFilesCommand;
