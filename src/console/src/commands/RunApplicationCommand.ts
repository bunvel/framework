import { execSync } from "child_process";
import { Logger } from "../../../support";
import { Command } from "../command";

class RunApplicationCommand extends Command {
  constructor() {
    super("serve", "Run the application");
  }

  async handle(args: {
    positionals: string[];
    options: Record<string, any>;
  }): Promise<void> {
    try {
      execSync("bun run --watch ./index.ts", { stdio: "inherit" });
    } catch (error: any) {
      Logger.error("Error running application:", error);
    }
  }
}

export default RunApplicationCommand;
