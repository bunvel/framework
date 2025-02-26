import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { Logger } from "../../../support";
import { Command } from "../command";

class MakeTestCommand extends Command {
  constructor() {
    super("make:test", "Create a new test");
  }

  async handle({ positionals }: { positionals: string[] }): Promise<void> {
    if (positionals.length === 0) {
      Logger.error("Please provide a test name.");
      return;
    }

    const testName = this.formatName(positionals[0]);
    const testsDir = join(process.cwd(), "tests");
    const filePath = join(testsDir, `${testName}.test.ts`);

    if (!existsSync(testsDir)) {
      mkdirSync(testsDir, { recursive: true });
    }

    if (existsSync(filePath)) {
      Logger.error(`Test already exists: ${testName}`);
      return;
    }

    const testContent = this.getStubContent("test.stub", testName);
    this.createFile(filePath, testContent);
  }

  private formatName(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  private getStubContent(stubFileName: string, testName: string): string {
    const stubPath = join(__dirname, "..", "stubs", stubFileName);
    let content = readFileSync(stubPath, "utf8");
    content = content.replace(/{{testName}}/g, testName);
    return content;
  }

  private createFile(filePath: string, content: string): void {
    try {
      writeFileSync(filePath, content);
      Logger.info(`Test file created successfully: [${filePath}]`);
    } catch (error: any) {
      Logger.error("Error creating test file:", error);
    }
  }
}

export default MakeTestCommand;
