import { type Context, Hono, type MiddlewareHandler } from "hono";
import { RouterLoggerMiddleware } from "./RouterMiddleware";
import type {
  ApiResourceMethod,
  Controller,
  HttpMethod,
  RouteHandler,
} from "./types";

export class RouterService {
  private router: Hono;
  private routeNames: Map<string, string>;
  private globalMiddleware: MiddlewareHandler[];

  constructor(router: Hono) {
    this.router = router;
    this.routeNames = new Map<string, string>();
    this.globalMiddleware = [];
  }

  private handleResponse(c: Context, response: any): Response {
    try {
      // If the response is already a Response object, return it directly
      if (response instanceof Response) {
        return response;
      }

      // Handle undefined, null, or empty responses (204 No Content)
      if (response == null) {
        return new Response(null, { status: 204 });
      }

      // Return plain text response
      if (typeof response === "string") {
        return c.text(response);
      }

      // Return JSON response
      if (typeof response === "object") {
        return c.json(response);
      }

      // Handle unsupported response types
      console.error(`Unsupported response type: ${typeof response}`);
      return new Response("Internal Server Error", { status: 500 });
    } catch (error) {
      // Handle errors during response processing
      console.error("Error handling response:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }

  private use(middlewares: MiddlewareHandler[]): this {
    for (const middleware of middlewares) {
      this.globalMiddleware.push(middleware);
    }
    return this;
  }

  private addRoute(
    method: HttpMethod,
    path: string,
    handler: RouteHandler,
    middlewares: MiddlewareHandler[] = []
  ): void {
    const isProd = Bun.env.APP_ENV === "production";

    const finalMiddlewares = [
      ...this.globalMiddleware,
      ...middlewares,
      ...(isProd ? [] : [RouterLoggerMiddleware]),
    ];
    this.router[method](path, ...finalMiddlewares, async (c: Context) => {
      const response = await handler(c);
      return this.handleResponse(c, response);
    });
  }

  // HTTP method shortcuts
  public get(
    path: string,
    handler: RouteHandler,
    middlewares: MiddlewareHandler[] = []
  ): this {
    this.addRoute("get", path, handler, middlewares);
    return this;
  }

  public post(
    path: string,
    handler: RouteHandler,
    middlewares: MiddlewareHandler[] = []
  ): this {
    this.addRoute("post", path, handler, middlewares);
    return this;
  }

  public put(
    path: string,
    handler: RouteHandler,
    middlewares: MiddlewareHandler[] = []
  ): this {
    this.addRoute("put", path, handler, middlewares);
    return this;
  }

  public patch(
    path: string,
    handler: RouteHandler,
    middlewares: MiddlewareHandler[] = []
  ): this {
    this.addRoute("patch", path, handler, middlewares);
    return this;
  }

  public delete(
    path: string,
    handler: RouteHandler,
    middlewares: MiddlewareHandler[] = []
  ): this {
    this.addRoute("delete", path, handler, middlewares);
    return this;
  }

  public options(
    path: string,
    handler: RouteHandler,
    middlewares: MiddlewareHandler[] = []
  ): this {
    this.addRoute("options", path, handler, middlewares);
    return this;
  }

  public url(
    name: string,
    params: { [key: string]: any } = {}
  ): string | undefined {
    const path = this.routeNames.get(name);
    if (!path) return undefined;
    return path.replace(/:([a-zA-Z]+)/g, (_, key) => params[key]);
  }

  public apiResource(
    path: string,
    controller: Controller,
    options: { only?: ApiResourceMethod[]; except?: ApiResourceMethod[] } = {},
    middlewares: MiddlewareHandler[] = []
  ): this {
    const methods: [HttpMethod, string, ApiResourceMethod][] = [
      ["get", "", "index"],
      ["post", "", "store"],
      ["get", "/:id", "show"],
      ["put", "/:id", "update"],
      ["delete", "/:id", "destroy"],
    ];

    this.addControllerRoutes(path, controller, methods, options, middlewares);
    return this;
  }

  private addControllerRoutes(
    path: string,
    controller: Controller,
    methods: [HttpMethod, string, ApiResourceMethod][],
    options: { only?: ApiResourceMethod[]; except?: ApiResourceMethod[] },
    middlewares: MiddlewareHandler[] = []
  ): void {
    methods.forEach(([method, suffix, action]) => {
      if (
        typeof controller[action] === "function" &&
        (!options.only || new Set(options.only).has(action)) &&
        (!options.except || !new Set(options.except).has(action))
      ) {
        this.addRoute(
          method,
          `${path}${suffix}`,
          controller[action],
          middlewares
        );
      }
    });
  }

  public group(
    options: { prefix?: string; middleware?: MiddlewareHandler[] },
    callback: (router: RouterService) => void
  ): void {
    const groupRouter = new RouterService(new Hono());

    // Apply middleware and prefix
    if (options.middleware) {
      groupRouter.use(options.middleware);
    }
    if (options.prefix) {
      groupRouter.prefix(options.prefix);
    }

    // Execute the callback to define the routes
    callback(groupRouter);

    // Mount the group router
    this.router.route("*", groupRouter.getRouter());
  }

  private prefix(prefix: string): this {
    this.router.routes.forEach((route) => {
      route.path = `${prefix}${route.path}`;
    });
    return this;
  }

  public middleware(...middlewares: MiddlewareHandler[]): this {
    this.use(middlewares);
    return this;
  }

  public getRouter(): Hono {
    return this.router;
  }
}
