import { Command } from "../command";

class RunTestCommand extends Command {
  constructor() {
    super("test", "Run tests", ["t"]);
  }

  async handle(): Promise<void> {
    try {
      Bun.spawn(["bun", "test"]);
    } catch (error) {}
  }
}

export default RunTestCommand;
