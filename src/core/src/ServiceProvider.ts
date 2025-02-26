import type { Application } from "../../core";

export abstract class ServiceProvider {
  protected app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  /**
   * Register any application services.
   */
  abstract register(): void | Promise<void>;

  /**
   * Bootstrap any application services.
   */
  abstract boot(): void | Promise<void>;
}
