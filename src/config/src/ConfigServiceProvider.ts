import { ServiceProvider } from "@bunvel/core";
import { ConfigurationService } from "./ConfigurationService";

export class ConfigServiceProvider extends ServiceProvider {
  async register(): Promise<void> {
    const configInstance = new ConfigurationService();

    this.app.singleton("config", async () => {
      await configInstance.loadConfigs();
      return configInstance;
    });
  }

  async boot(): Promise<void> {
    await this.app.make("config");
  }
}
