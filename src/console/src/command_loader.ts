import { appPath } from "@bunvel/support/helpers";
import { existsSync, readdirSync } from "fs";
import { join } from "path";
import type { Command } from "./command";

export class CommandLoader {
  static async loadCommands(
    frameworkPath: string
  ): Promise<Map<string, Command>> {
    const commands = new Map<string, Command>();

    await this.loadCommandsFromDirectory(
      join(frameworkPath, "commands"),
      commands
    );

    const userCommandPath = appPath("commands");
    if (existsSync(userCommandPath)) {
      await this.loadCommandsFromDirectory(userCommandPath, commands);
    }

    return commands;
  }

  private static async loadCommandsFromDirectory(
    directory: string,
    commands: Map<string, Command>
  ) {
    if (!existsSync(directory)) return;

    const commandFiles = readdirSync(directory).filter(
      (file) => file.endsWith(".ts") || file.endsWith(".js")
    );

    for (const file of commandFiles) {
      const module = await import(join(directory, file));
      const CommandClass = module.default || Object.values(module)[0];
      if (typeof CommandClass === "function") {
        const command = new CommandClass();
        commands.set(command.getSignature(), command);
      }
    }
  }
}
