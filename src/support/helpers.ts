import { resolve } from 'path';

/**
 * Get the application's root directory.
 */
export function basePath(...paths: string[]): string {
  return resolve(process.cwd(), ...paths);
}

/**
 * Get the path to the `app` directory.
 */
export function appPath(...paths: string[]): string {
  return basePath('app', ...paths);
}

/**
 * Get the path to the `config` directory.
 */
export function configPath(...paths: string[]): string {
  return basePath('config', ...paths);
}

/**
 * Get the path to the `database` directory.
 */
export function databasePath(...paths: string[]): string {
  return basePath('database', ...paths);
}

/**
 * Get the path to the `storage` directory.
 */
export function storagePath(...paths: string[]): string {
  return basePath('storage', ...paths);
}

/**
 * Get the path to the `logs` directory.
 */
export function logPath(...paths: string[]): string {
  return storagePath('logs', ...paths);
}

/**
 * Get the path to the `resources` directory.
 */
export function resourcePath(...paths: string[]): string {
  return basePath('resources', ...paths);
}

/**
 * Get the path to the `tests` directory.
 */
export function testPath(...paths: string[]): string {
  return basePath('tests', ...paths);
}

/**
   * Get the base URL of the application from environment or fallback to localhost.
   */
export function baseUrl(): string {
  return Bun.env.APP_URL || 'http://localhost:8000';
}

/**
 * Generate a URL for static assets.
 * Automatically handles HTTP/HTTPS scheme.
 *
 * @example
 * asset('images/logo.png') => http://localhost:3000/images/logo.png
 */
export function asset(path: string): string {
  const _baseUrl = baseUrl().replace(/\/+$/, '');
  const _cleanPath = path.replace(/^\/+/, '');
  return `${_baseUrl}/${_cleanPath}`;
}