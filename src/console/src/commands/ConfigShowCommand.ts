import { ConfigurationService } from "@bunvel/config";
import { Logger } from "@bunvel/log";
import { CLIFormatter } from "../cli_formatter";
import { Command } from "../command";

class ConfigShowCommand extends Command {
  private configService: ConfigurationService;

  constructor() {
    super("config:show", "Show the configuration for the specified file");
    this.configService = new ConfigurationService();
  }

  async handle(args: any = {}): Promise<void> {
    let fileName = "";
    try {
      if (args.positionals.length === 0) {
        Logger.error("Please provide a configuration file name.");
        return;
      }

      fileName = args.positionals[0];

      // Resolve the file path
      const filePath = Bun.file(process.cwd() + `config/${fileName}.ts`);

      // Check if the file exists

      if (await filePath.exists()) {
        Logger.error(`Configuration file '${fileName}' does not exist.`);
        return;
      }

      // Load the configuration file using the ConfigurationService
      await this.configService.loadConfigs();

      // Retrieve and display the configuration data
      const configData = this.configService.get(fileName);
      if (!configData) {
        Logger.error(`No data found for the configuration file '${fileName}'.`);
        return;
      }

      Logger.info(`Configuration for '${fileName}'`);
      console.log(CLIFormatter.formatOutput(configData));
    } catch (error: any) {
      Logger.error(`Error retrieving configuration for '${fileName}':`, error);
    }
  }
}

export default ConfigShowCommand;
