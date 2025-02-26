import fs from "fs";
import os from "os";
import path from "path";
import { CLIFormatter } from "../cli_formatter";
import { Command } from "../command";

class AboutCommand extends Command {
  constructor() {
    super("about", "Show application information and environment details");
  }

  async handle(): Promise<void> {
    const runtimeInfo = this.getRuntimeInfo();
    const packageVersion = this.getPackageVersion();

    const appInfo = {
      "Application Name": Bun.env.APP_NAME,
      "Application Version": packageVersion,
      Runtime: runtimeInfo.runtime,
      Version: runtimeInfo.version,
      "OS Platform": os.platform(),
      Environment: Bun.env.APP_ENV || "local",
      "Debug Mode": Bun.env.APP_DEBUG == "true" ? "ENABLED" : "DISABLED",
      URL: Bun.env.APP_URL || "http://localhost",
      Timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      Locale: "en",
    };

    // const cacheStatus = {
    //   Config: this.isCached("config"),
    //   Routes: this.isCached("routes"),
    //   Views: this.isCached("views"),
    // };

    // const drivers = {
    //   Cache: process.env.CACHE_DRIVER || "file",
    //   Database: process.env.DB_CONNECTION || "sqlite",
    //   Queue: process.env.QUEUE_DRIVER || "sync",
    //   Session: process.env.SESSION_DRIVER || "file",
    // };

    console.log(
      CLIFormatter.formatOutput({
        Environment: appInfo,
        // Cache: cacheStatus,
        // Drivers: drivers,
      })
    );
  }

  // // Method to simulate checking cache status (modify according to your implementation)
  // isCached(type: string): string {
  //   // Here, you would typically check if the cache for "config", "routes", or "views" exists
  //   return "NOT CACHED";
  // }

  // Method to detect the current runtime environment
  getRuntimeInfo(): { runtime: string; version: string } {
    if (typeof Bun !== "undefined") {
      return { runtime: "Bun", version: Bun.version };
    } else {
      return { runtime: "Node.js", version: process.version };
    }
  }

  getPackageVersion(): string {
    try {
      const packageJsonPath = path.resolve(process.cwd(), "package.json");
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      return packageJson.version || "Unknown";
    } catch (error) {
      console.error("Error reading package.json:", error);
      return "Unknown";
    }
  }
}

export default AboutCommand;
