import { Config } from "../../../core";
import { Command } from "../command";

class ShowEnvCommand extends Command {
  constructor() {
    super("env", "Show current envirnoment");
  }

  async handle(): Promise<void> {
    try {
      console.log(await Config.get("app.env"));
    } catch (error) {}
  }
}

export default ShowEnvCommand;
