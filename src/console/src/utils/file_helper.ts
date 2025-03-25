import { Logger } from "../../../log";

/**
 * Create a file with the given name, path and content.
 * @param fileName The name of the file to be created.
 * @param filePath The path where the file should be created.
 * @param content The content of the file.
 */
export async function createFile(
  fileName: string,
  filePath: string,
  content: string
): Promise<void> {
  try {
    await Bun.write(filePath, content);
    Logger.info(`${fileName} created successfully: [${filePath}]`);
  } catch (error: any) {
    Logger.error(`Error creating ${fileName}:`, error);
  }
}
