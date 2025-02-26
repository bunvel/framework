export class Env {
  private static instance: Env;
  private envCache: Map<string, string | undefined> = new Map();

  private constructor() {
    // Cache all environment variables
    Object.entries(process.env).forEach(([key, value]) =>
      this.envCache.set(key, value)
    );
  }

  static getInstance(): Env {
    if (!Env.instance) {
      Env.instance = new Env();
    }
    return Env.instance;
  }

  static get<T>(key: string, defaultValue: T | null = null): T {
    const value = Env.getInstance().envCache.get(key);

    // Handle casting to the expected type if necessary
    if (value !== undefined) {
      return Env.castValue<T>(value) as T;
    }

    if (defaultValue !== null) {
      return defaultValue;
    }

    throw new Error(
      `Environment variable "${key}" is not defined and no default value was provided.`
    );
  }

  static castValue<T>(value: string): T {
    // Convert strings to appropriate types
    if (value === "true" || value === "false") {
      return (value === "true") as unknown as T;
    }

    const numberValue = Number(value);
    if (!isNaN(numberValue)) {
      return numberValue as unknown as T;
    }

    return value as unknown as T;
  }

  static getOrFail(key: string): string {
    const value = Env.getInstance().envCache.get(key);

    if (value === undefined) {
      throw new Error(`Environment variable "${key}" is not defined.`);
    }

    return value;
  }

  static has(key: string): boolean {
    return Env.getInstance().envCache.has(key);
  }

  static all(): Record<string, string | undefined> {
    return Object.fromEntries(Env.getInstance().envCache.entries());
  }
}
