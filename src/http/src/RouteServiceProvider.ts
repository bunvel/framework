import * as fs from "fs/promises";
import * as path from "path";
import { ServiceProvider } from "../../core";
import { Route } from "../../facade";

export class RouteServiceProvider extends ServiceProvider {
  public async register(): Promise<void> {
    this.app.singleton("router", () => Route.getRouter());
  }

  async boot(): Promise<void> {
    await this.loadRoutes();
  }

  protected async loadRoutes(): Promise<void> {
    const routesPath = path.join(process.cwd(), "routes");

    try {
      const files = await fs.readdir(routesPath);
      const filteredFiles = files.filter(
        (file) => file === "api.ts" || file === "web.ts"
      );

      for (const file of filteredFiles) {
        if (file.endsWith(".ts")) {
          const { default: route } = await import(path.join(routesPath, file));
          route(Route);
        }
      }
    } catch (error) {
      console.error("Error loading routes:", error);
    }
  }
}
