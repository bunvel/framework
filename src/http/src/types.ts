import type { Context, Hono } from "hono";

/**
 * Represents the allowed HTTP methods for API routes in the Hono framework.
 */
export type HttpMethod = keyof Pick<
  Hono,
  "get" | "post" | "put" | "patch" | "delete" | "options"
>;

/**
 * Defines the standard method names for resource-based API controllers.
 */
export type ApiResourceMethod =
  | "index" // Retrieves a list of resources
  | "store" // Creates a new resource
  | "show" // Retrieves a single resource
  | "update" // Updates an existing resource
  | "destroy"; // Deletes a resource

/**
 * Represents a route handler function that takes a Hono `Context` object and returns a response.
 */
export type RouteHandler = (c: Context) => any | Promise<any>;

/**
 * Represents a generic controller interface where each method corresponds to a route handler.
 */
export interface Controller {
  [key: string]: RouteHandler | any;
}
