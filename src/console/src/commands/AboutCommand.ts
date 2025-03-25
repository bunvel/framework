import { Logger } from "../../../log";
import { basePath } from "../../../support";
import { CLIFormatter } from "../cli_formatter";
import { Command } from "../command";

class AboutCommand extends Command {
  constructor() {
    super("about", "Show application information and environment details");
  }

  async handle(): Promise<void> {
    const runtimeInfo = this.getRuntimeInfo();
    const packageVersion = await this.getPackageVersion();

    const appInfo = {
      "Application Name": Bun.env.APP_NAME,
      "Application Version": packageVersion,
      Runtime: runtimeInfo.runtime,
      Version: runtimeInfo.version,
      Environment: Bun.env.APP_ENV || "local",
      "Debug Mode": Bun.env.APP_DEBUG == "true" ? "ENABLED" : "DISABLED",
      URL: Bun.env.APP_URL || "http://localhost",
      Timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      Locale: "en",
    };

    console.log(
      CLIFormatter.formatOutput({
        Environment: appInfo,
      })
    );
  }
  // Method to detect the current runtime environment
  getRuntimeInfo(): { runtime: string; version: string } {
    if (typeof Bun !== "undefined") {
      return { runtime: "Bun", version: Bun.version };
    } else {
      return { runtime: "Node.js", version: process.version };
    }
  }

  async getPackageVersion(): Promise<string> {
    try {
      const packageJsonPath = basePath("package.json");
      const packageJson = await Bun.file(packageJsonPath).json();
      return packageJson.version || "Unknown";
    } catch (error) {
      Logger.error("Error reading package.json:", error);
      return "Unknown";
    }
  }
}

export default AboutCommand;
