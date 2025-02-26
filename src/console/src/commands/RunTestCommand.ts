import { execSync } from "child_process";
import { Command } from "../command";

class RunTestCommand extends Command {
  constructor() {
    super("test", "Run tests", ["t"]);
  }

  async handle(): Promise<void> {
    try {
      execSync("bun test", { stdio: "inherit" });
    } catch (error) {}
  }
}

export default RunTestCommand;
