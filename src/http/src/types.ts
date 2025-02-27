import type { Context, Hono } from "hono";

export type HttpMethod = keyof Pick<Hono, "get" | "post" | "put" | "patch" | "delete" | "options">;
export type RouteHandler = (c: Context) => any | Promise<any>;
export interface Controller {
  [key: string]: RouteHandler | any;
}