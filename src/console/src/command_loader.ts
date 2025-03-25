import { existsSync, readdirSync } from "fs";
import { join } from "path";
import { appPath } from "../../support";
import type { Command } from "./command";

export class CommandLoader {
  private static commandCache: Map<string, Command> | null = null;

  static async loadCommands(
    frameworkPath: string
  ): Promise<Map<string, Command>> {
    if (this.commandCache) return this.commandCache;

    const commands = new Map<string, Command>();

    await this.loadCommandsFromDirectory(
      join(frameworkPath, "commands"),
      commands
    );

    const userCommandPath = appPath("commands");
    if (existsSync(userCommandPath)) {
      await this.loadCommandsFromDirectory(userCommandPath, commands);
    }

    this.commandCache = commands; // Cache the loaded commands

    return commands;
  }

  static clearCache() {
    this.commandCache = null; // Allow cache invalidation
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
