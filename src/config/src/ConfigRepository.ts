import { readdir } from "node:fs/promises";
import * as path from "path";
import { configPath } from "../../support/helpers";

// Define a structure for the configuration data
type ConfigData = { [key: string]: any };

// Config repository to manage configuration loading and caching
export class ConfigRepository {
  private configs: ConfigData = {};
  private cache: ConfigData = {};
  private configPath = configPath(); // Directory where the config files are located

  // Load configuration files from the config directory
  async load(): Promise<void> {
    if (Object.keys(this.cache).length > 0) {
      return; // Skip loading if cache is not empty
    }

    try {
      const files = await readdir(this.configPath);
      const configFiles = files.filter(
        (file) => file.endsWith(".ts") || file.endsWith(".js")
      );

      // Dynamically import each configuration file
      await Promise.all(
        configFiles.map(async (file) => {
          const name = path.basename(file, path.extname(file)); // Use the filename (without extension) as the key
          const filePath = path.join(this.configPath, file);
          const module = await import(filePath);

          // Check if the module exports a default function or object
          this.configs[name] =
            module.default && typeof module.default === "function"
              ? await module.default()
              : module.default;
        })
      );

      // Cache the loaded configurations
      this.cache = { ...this.configs };
    } catch (error: any) {
      console.error("Error loading configuration files:", error);
      throw new Error(`Failed to load configuration files: ${error.message}`);
    }
  }

  // Retrieve a configuration value based on the key, supports nested keys
  get<T = any>(key: string, defaultValue: T | null = null): T {
    const [file, ...parts] = key.split("."); // Split by dot notation (file.key.subkey)
    const config = this.cache[file];

    if (!config) return defaultValue as T;

    const value = parts.reduce(
      (o, i) => (o !== undefined ? o[i] : undefined),
      config
    );
    return value !== undefined ? value : defaultValue;
  }

  // Retrieve a string value
  string(key: string, defaultValue: string = ""): string {
    const value = this.get(key, defaultValue);
    return value.toString();
  }

  // Retrieve an integer value
  integer(key: string, defaultValue: number = 0): number {
    const value = this.get(key, defaultValue);
    return parseInt(value.toString(), 10);
  }

  // Retrieve a float value
  float(key: string, defaultValue: number = 0): number {
    const value = this.get(key, defaultValue);
    return parseFloat(value.toString());
  }

  // Retrieve a boolean value
  boolean(key: string, defaultValue: boolean = false): boolean {
    const value = this.get(key, defaultValue);
    return Boolean(value);
  }

  // Check if a configuration key exists
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  // Set a configuration value
  set(key: string, value: any): void {
    const [file, ...parts] = key.split(".");
    if (!this.configs[file]) {
      this.configs[file] = {};
    }

    let current = this.configs[file];
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;

    // Update the cache after setting the new value
    this.cache[file] = this.configs[file];
  }

  // Retrieve an object configuration value
  object<T extends object = object>(key: string, defaultValue: T = {} as T): T {
    const value = this.get(key, defaultValue);
    return typeof value === "object" && value !== null ? value : defaultValue;
  }

  // Retrieve a Map configuration value
  map<K = any, V = any>(
    key: string,
    defaultValue: Map<K, V> = new Map()
  ): Map<K, V> {
    const value = this.get(key, defaultValue);
    if (value instanceof Map) {
      return value;
    } else if (typeof value === "object" && value !== null) {
      return new Map(Object.entries(value) as [K, V][]);
    }
    return defaultValue;
  }

  // Retrieve an array configuration value
  array<T = any>(key: string, defaultValue: T[] = []): T[] {
    const value = this.get(key, defaultValue);
    return Array.isArray(value) ? value : defaultValue;
  }

  // Reload configuration files
  async reload(): Promise<void> {
    await this.load();
  }

  // Clear the cache
  clearCache(): void {
    this.cache = {};
  }
}
