import { ServiceProvider } from "../../core";
import { ConfigRepository } from "./ConfigRepository";

/**
 * Service provider for the configuration.
 */
export class ConfigServiceProvider extends ServiceProvider {
  /**
   * Register the service provider.
   */
  async register(): Promise<void> {
    const configInstance = new ConfigRepository();

    this.app.singleton("config", async () => {
      await configInstance.load();
      return configInstance;
    });
  }

  /**
   * Bootstrap the service provider.
   */
  async boot(): Promise<void> {
    await this.app.make<ConfigRepository>("config");
  }
}
