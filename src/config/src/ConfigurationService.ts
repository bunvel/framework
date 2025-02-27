import { configPath } from "@bunvel/support/helpers";
import { readdir } from "node:fs/promises";

import * as path from "path";

type ConfigData = { [key: string]: any };

export class ConfigurationService {
  private configs: ConfigData = {};
  private cache: ConfigData = {};
  private path = configPath();

  // Load all configuration files
  async loadConfigs(): Promise<void> {
    if (Object.keys(this.cache).length > 0) {
      return; // Skip loading if cache is not empty
    }

    try {
        const files = await readdir(this.path);
        const configFiles = files.filter(
        (file) => file.endsWith(".ts") || file.endsWith(".js")
      );

      await Promise.all(
        configFiles.map(async (file) => {
          const name = path.basename(file, path.extname(file));
          const filePath = path.join(this.path, file);
          const module = await import(filePath);

          // Check if default export is a function
          this.configs[name] =
            module.default && typeof module.default === "function"
              ? await module.default()
              : module.default;
        })
      );
      this.cache = { ...this.configs }; // Cache loaded configurations
    } catch (error) {
      console.error("Error loading configuration files:", error);
      throw new Error("Failed to load configuration files.");
    }
  }

  // Retrieve configuration value
  get<T = any>(key: string, defaultValue: T | null = null): T {
    const [file, ...parts] = key.split(".");
    const config = this.cache[file];
    if (!config) return defaultValue as T;

    const value = parts.reduce(
      (o, i) => (o !== undefined ? o[i] : undefined),
      config
    );
    return (value !== undefined ? value : defaultValue) as T;
  }

  // Retrieve string value
  string(key: string, defaultValue: number = 0): string {
    const value = this.get(key, defaultValue);
    return value.toString();
  }

  // Retrieve integer value
  integer(key: string, defaultValue: number = 0): number {
    const value = this.get(key, defaultValue);
    return parseInt(value.toString(), 10);
  }

  // Retrieve float value
  float(key: string, defaultValue: number = 0): number {
    const value = this.get(key, defaultValue);
    return parseFloat(value.toString());
  }

  // Retrieve boolean value
  boolean(key: string, defaultValue: boolean = false): boolean {
    const value = this.get(key, defaultValue);
    return Boolean(value);
  }

  // Check if a key exists
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  // Set configuration value
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

    // Update cache after setting new value
    this.cache[file] = this.configs[file];
  }

  // Retrieve object value
  object<T extends object = object>(key: string, defaultValue: T = {} as T): T {
    const value = this.get(key, defaultValue);
    return typeof value === "object" && value !== null ? value : defaultValue;
  }

  // Retrieve map value
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

  // Retrieve array value
  array<T = any>(key: string, defaultValue: T[] = []): T[] {
    const value = this.get(key, defaultValue);
    return Array.isArray(value) ? value : defaultValue;
  }

  // Reload configuration files
  async reload(): Promise<void> {
    await this.loadConfigs();
  }
}
