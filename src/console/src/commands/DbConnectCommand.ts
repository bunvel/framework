import chalk from "chalk";
import readline from "readline";
import { Application } from "../../../core";

import { ConfigServiceProvider } from "../../../config";
import { type Database, DatabaseServiceProvider } from "../../../database";
import { Command } from "../command";

class ForgeCommand extends Command {
  private connection: Database | null = null;
  private commandHistory: string[] = [];
  private historyIndex: number = -1;
  private currentPage: number = 1;
  private resultsPerPage: number = 10;
  private totalPages: number = 1;
  private currentResults: any[] = [];

  constructor() {
    super("velvet", "Interact with your database in real-time");
  }

  async handle(): Promise<void> {
    this.connection = await this.connectToDatabase();
    if (!this.connection) {
      console.error(chalk.red("Failed to connect to the database."));
      return;
    }
    this.startInteractiveSession();
  }

  private async connectToDatabase() {
    try {
      const app = Application.getInstance();
      await app.register([ConfigServiceProvider, DatabaseServiceProvider]);
      await app.boot();

      const connection: Database = await app.make("database");
      return connection;
    } catch (error) {
      console.error(chalk.red("Database connection failed:"), error);
      return null;
    }
  }

  private startInteractiveSession(): void {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.blue("Velvet> "),
      historySize: 50,
    });

    // Start listening for keypress events
    process.stdin.on("keypress", (char, key) => {
      if (key.name === "up") {
        this.historyIndex = Math.max(this.historyIndex - 1, 0);
        if (this.commandHistory[this.historyIndex]) {
          rl.write(null, { ctrl: true, name: "u" }); // Clear current line
          rl.write(this.commandHistory[this.historyIndex]);
        }
      } else if (key.name === "down") {
        this.historyIndex = Math.min(
          this.historyIndex + 1,
          this.commandHistory.length
        );
        rl.write(null, { ctrl: true, name: "u" });
        rl.write(this.commandHistory[this.historyIndex] || "");
      } else if (key.name === "n" && key.ctrl) {
        // Ctrl+n for next page
        this.nextPage();
      } else if (key.name === "p" && key.ctrl) {
        // Ctrl+p for previous page
        this.prevPage();
      }
    });

    rl.prompt();

    rl.on("line", async (line) => {
      const input = line.trim();

      if (input.toLowerCase() === "exit") {
        rl.close();
        return;
      }

      if (input.toLowerCase() === "clear") {
        console.clear();
        rl.prompt();
        return;
      }

      if (input) {
        await this.runQuery(input);
        this.commandHistory.push(input);
        this.historyIndex = this.commandHistory.length;
      }

      rl.prompt();
    }).on("close", () => {
      console.log(chalk.yellow("Bye Bye. 👋"));
      process.exit(0);
    });
  }

  private async runQuery(query: string): Promise<void> {
    try {
      const result = await this.connection?.query(query);
      if (Array.isArray(result)) {
        this.currentResults = result;
        this.totalPages = Math.ceil(result.length / this.resultsPerPage);
        this.currentPage = 1;
        this.displayPage();
      } else {
        console.log(chalk.green("Query executed successfully."));
      }
    } catch (error: any) {
      if (
        error.code === "ER_NO_SUCH_TABLE" ||
        error.message.includes("Table")
      ) {
        console.error(chalk.red("Error: Table does not exist."));
      } else {
        console.error(chalk.red("Error executing query:"), error);
      }
    }
  }

  private displayPage(): void {
    if (this.currentResults.length === 0) {
      console.log(chalk.yellow("No data found."));
      return;
    }

    const start = (this.currentPage - 1) * this.resultsPerPage;
    const end = start + this.resultsPerPage;
    const pageResults = this.currentResults.slice(start, end);

    console.log(pageResults);

    console.log(`Page ${this.currentPage} of ${this.totalPages}`);
    console.log("Press Ctrl+n for next page, Ctrl+p for previous page.");
  }

  private nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.displayPage();
    } else {
      console.log(chalk.yellow("You are already on the last page."));
      return;
    }
  }

  private prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.displayPage();
    } else {
      console.log(chalk.yellow("You are already on the first page."));
      return;
    }
  }
}

export default ForgeCommand;
