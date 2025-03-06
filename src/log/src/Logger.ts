import chalk from "chalk";
import type { LogLevel } from "./type";

export class Logger {
  private static log(level: LogLevel, message: string, context: any = {}) {
    console.log(this.formatConsoleMessage(level, message, context));
  }

  private static formatConsoleMessage(
    level: LogLevel,
    message: string,
    context: Record<string, unknown>
  ): string {
    const levelLabel = this.getLevelLabel(level);
    const contextStr =
      Object.keys(context).length > 0
        ? chalk.gray(JSON.stringify(context))
        : "";
    return `\n${levelLabel} ${message} ${contextStr}\n`;
  }

  private static getLevelLabel(level: LogLevel): string {
    switch (level) {
      case "emergency":
        return chalk.bgRed.white.bold(" EMERGENCY ");
      case "alert":
        return chalk.bgRed.white.bold(" ALERT ");
      case "critical":
        return chalk.bgRed.white.bold(" CRITICAL ");
      case "error":
        return chalk.bgRed.white.bold(" ERROR ");
      case "warning":
        return chalk.bgYellow.black.bold(" WARNING ");
      case "notice":
        return chalk.bgCyan.black.bold(" NOTICE ");
      case "info":
        return chalk.bgBlue.white.bold(" INFO ");
      case "debug":
        return chalk.bgGreen.black.bold(" DEBUG ");
      case "success":
        return chalk.bgGreen.white.bold(" SUCCESS ");
      default:
        return chalk.bgWhite.black.bold(` ${level} `);
    }
  }

  // Static logger methods
  public static emergency(message: string, context: any = {}) {
    this.log("emergency", message, context);
  }
  public static success(message: string, context: any = {}) {
    this.log("success", message, context);
  }
  public static alert(message: string, context: any = {}) {
    this.log("alert", message, context);
  }
  public static critical(message: string, context: any = {}) {
    this.log("critical", message, context);
  }
  public static error(message: string, context: any = {}) {
    this.log("error", message, context);
  }
  public static warning(message: string, context: any = {}) {
    this.log("warning", message, context);
  }
  public static notice(message: string, context: any = {}) {
    this.log("notice", message, context);
  }
  public static info(message: string, context: any = {}) {
    this.log("info", message, context);
  }
  public static debug(message: string, context: any = {}) {
    this.log("debug", message, context);
  }
}
