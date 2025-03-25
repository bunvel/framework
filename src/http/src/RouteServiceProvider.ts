import { readdir } from "fs/promises";
import { ServiceProvider } from "../../core";
import { Route } from "../../facade";
import { routesPath } from "../../support";

export class RouteServiceProvider extends ServiceProvider {
  public async register(): Promise<void> {
    this.app.singleton("router", () => Route.getRouter());
  }

  async boot(): Promise<void> {
    await this.loadRoutes();
  }

  protected async loadRoutes(): Promise<void> {
    try {
      const files = await readdir(routesPath());

      // Filter only `api.ts` and `web.ts`
      const routeFiles = files.filter(
        (file) => file === "api.ts" || file === "web.ts"
      );

      for (const file of routeFiles) {
        const bunFile = Bun.file(routesPath(file));
        // Check if file exists
        if (await bunFile.exists()) {
          const { default: route } = await import(routesPath(file));
          route(Route);
        } else {
          console.warn(`File ${routesPath(file)} does not exist.`);
        }
      }
    } catch (error) {
      console.error("Error loading routes:", error);
    }
  }
}
