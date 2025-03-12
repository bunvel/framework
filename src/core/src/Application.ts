import type { Hono } from "hono";
import { ConfigServiceProvider } from "../../config";
import { type ServiceProvider } from "../../core";
import { DatabaseServiceProvider } from "../../database";
import { Config } from "../../facade";
import { RouteServiceProvider } from "../../http";
import { Logger } from "../../log";

type ServiceConstructor<T> = () => T;

export class Application {
  private static instance: Application;
  private serviceProviders: ServiceProvider[] = [];
  private instances: Map<string, any> = new Map();
  private bindings: Map<string, ServiceConstructor<any>> = new Map();
  private singletons: Map<string, ServiceConstructor<any>> = new Map();
  private booted: boolean = false;

  static getInstance(): Application {
    if (!Application.instance) {
      Application.instance = new Application();
    }
    return Application.instance;
  }

  /**
   * Register a service provider with the application.
   */
  public async register(
    providerClasses: Array<new (app: Application) => ServiceProvider>
  ): Promise<void> {
    // Iterate over the array of provider classes
    for (const providerClass of providerClasses) {
      const provider = new providerClass(this);
      this.serviceProviders.push(provider);
      await provider.register();
    }
  }

  /**
   * Bootstrap all of the service providers.
   */
  public async boot(): Promise<void> {
    if (this.booted) return;

    for (const provider of this.serviceProviders) {
      await provider.boot();
    }
    this.booted = true;
  }

  /**
   * Bind a service into the container.
   */
  public bind<T>(key: string, value: () => T): void {
    this.bindings.set(key, value);
  }

  /**
   * Bind a singleton service into the container.
   */
  public singleton<T>(key: string, value: () => T): void {
    this.singletons.set(key, value);
  }

  /**
   * Resolve a service from the container.
   */
  public make<T>(key: string): T | Promise<T> {
    if (this.instances.has(key)) {
      return this.instances.get(key) as T;
    }

    if (this.singletons.has(key)) {
      const instance = this.singletons.get(key)!();
      this.instances.set(key, instance); // Cache the instance
      return instance as T;
    }

    if (this.bindings.has(key)) {
      const instance = this.bindings.get(key)!();
      this.instances.set(key, instance);
      return instance as T;
    }

    throw new Error(`Service ${key} not found`);
  }

  static async start() {
    const app = Application.getInstance();

    await app.register([
      ConfigServiceProvider,
      DatabaseServiceProvider,
      RouteServiceProvider,
    ]);

    await app.boot();

    const router: Hono = await app.make("router");

    const port = await Config.integer("app.port");
    const url = await Config.string("app.url");

    Bun.serve({
      fetch: router.fetch,
      port: port,
      hostname: url.split("//")[1],
    });

    Logger.info(`Server running at ${url}:${port}`);
  }
}
