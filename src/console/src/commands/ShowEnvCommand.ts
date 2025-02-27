import { Logger } from "@bunvel/support";
import { Config } from "../../../core";
import { Command } from "../command";

class ShowEnvCommand extends Command {
  constructor() {
    super("env", "Show current environment");
  }

  async handle(): Promise<void> {
    try {
      const env = await Config.get("app.env");
      if (env) {
        Logger.info(env);
      } else {
        Logger.error("Environment not found in config file.");
      }
    } catch (error) {}
  }
}

export default ShowEnvCommand;
