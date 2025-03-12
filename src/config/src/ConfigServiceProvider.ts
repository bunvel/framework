import { ServiceProvider } from "../../core";
import { ConfigRepository } from "./ConfigRepository";

export class ConfigServiceProvider extends ServiceProvider {
  async register(): Promise<void> {
    const configInstance = new ConfigRepository();

    this.app.singleton("config", async () => {
      await configInstance.load();
      return configInstance;
    });
  }

  async boot(): Promise<void> {
    await this.app.make<ConfigRepository>("config");
  }
}
