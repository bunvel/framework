import * as fs from "fs/promises";
import { Hono } from "hono";
import * as path from "path";
import { ServiceProvider, type Application } from "../../core";

export class RouteServiceProvider extends ServiceProvider {
  private router: Hono;

  constructor(app: Application) {
    super(app);
    this.router = new Hono();
  }

  public async register(): Promise<void> {
    // Register any route bindings or middlewares if needed

    this.app.singleton("router", async () => {
      await this.loadRoutes();
      return this.router;
    });
  }

  async boot(): Promise<void> {
    await this.app.make("router");
  }

  protected async loadRoutes(): Promise<void> {
    const routesPath = path.join(process.cwd(), "routes");

    try {
      const files = await fs.readdir(routesPath);

      // Filter to only include api.ts and web.ts files
      const filteredFiles = files.filter(
        (file) => file === "api.ts" || file === "web.ts"
      );

      for (const file of filteredFiles) {
        if (file.endsWith(".ts")) {
          const { default: route } = await import(path.join(routesPath, file));
          route(this.router);
        }
      }
    } catch (error) {
      console.error("Error loading routes:", error);
    }
  }
}
