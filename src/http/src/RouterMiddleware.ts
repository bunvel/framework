import { Logger } from "@bunvel/log";
import type { Context } from "hono";

const getConsoleWidth = (): number => {
  return process.stdout.columns + 5 || 120;
};

export const RouterLoggerMiddleware = async (
  c: Context,
  next: () => Promise<void>
) => {
  const start = Date.now();

  try {
    await next();
  } catch (error) {
    Logger.error("Middleware error:");
    throw error;
  } finally {
    const duration = Date.now() - start;
    const path = `[${c.req.method}] ${c.req.path}`;
    const consoleWidth = getConsoleWidth();
    const dots = ".".repeat(Math.max(consoleWidth - path.length - 20, 0));
    Logger.info(`${path} ${dots} ${duration}ms`);
  }
};
