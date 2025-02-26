import { ConfigurationService } from "@bunvel/config";

export class Config {
  private static configService: ConfigurationService;

  // Initialize the ConfigurationService and load configs
  private static async initialize(): Promise<void> {
    if (!Config.configService) {
      Config.configService = new ConfigurationService();
      await Config.configService.loadConfigs();
    }
  }

  // Retrieve configuration value
  static async get<T = any>(
    key: string,
    defaultValue: T | null = null
  ): Promise<T> {
    await Config.initialize();
    return Config.configService.get<T>(key, defaultValue);
  }

  // Retrieve string value
  static async string(key: string, defaultValue: number = 0): Promise<string> {
    await Config.initialize();
    return Config.configService.string(key, defaultValue);
  }

  // Retrieve integer value
  static async integer(key: string, defaultValue: number = 0): Promise<number> {
    await Config.initialize();
    return Config.configService.integer(key, defaultValue);
  }

  // Retrieve float value
  static async float(key: string, defaultValue: number = 0): Promise<number> {
    await Config.initialize();
    return Config.configService.float(key, defaultValue);
  }

  // Retrieve boolean value
  static async boolean(
    key: string,
    defaultValue: boolean = false
  ): Promise<boolean> {
    await Config.initialize();
    return Config.configService.boolean(key, defaultValue);
  }

  // Check if a key exists
  static async has(key: string): Promise<boolean> {
    await Config.initialize();
    return Config.configService.has(key);
  }

  // Set configuration value
  static async set(key: string, value: any): Promise<void> {
    await Config.initialize();
    Config.configService.set(key, value);
  }

  // Retrieve object value
  static async object<T extends object = object>(
    key: string,
    defaultValue: T = {} as T
  ): Promise<T> {
    await Config.initialize();
    return Config.configService.object<T>(key, defaultValue);
  }

  // Retrieve map value
  static async map<K = any, V = any>(
    key: string,
    defaultValue: Map<K, V> = new Map()
  ): Promise<Map<K, V>> {
    await Config.initialize();
    return Config.configService.map<K, V>(key, defaultValue);
  }

  // Retrieve array value
  static async array<T = any>(
    key: string,
    defaultValue: T[] = []
  ): Promise<T[]> {
    await Config.initialize();
    return Config.configService.array<T>(key, defaultValue);
  }

  // Reload configuration files
  static async reload(): Promise<void> {
    await Config.initialize();
    await Config.configService.reload();
  }
}
