import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { Logger } from "../../../log";
import Str from "../../../support/Str";
import { Command, type CommandArgs } from "../command";

class MakeProviderCommand extends Command {
  constructor() {
    super("make:provider", "Create a new service provider");
  }

  async handle({ positionals }: CommandArgs): Promise<void> {
    if (positionals.length === 0) {
      Logger.error("Please provide a provider name.");
      return;
    }

    const providerName = Str.pascalCase(positionals[0]);
    const providersDir = join(process.cwd(), "app", "providers");
    const filePath = join(providersDir, `${providerName}ServiceProvider.ts`);

    if (!existsSync(providersDir)) {
      mkdirSync(providersDir, { recursive: true });
    }

    if (existsSync(filePath)) {
      Logger.error(`Provider already exists: ${providerName}`);
      return;
    }

    const providerContent = this.getStubContent("provider.stub", providerName);
    this.createFile(filePath, providerContent);
  }

  private getStubContent(stubFileName: string, providerName: string): string {
    const stubPath = join(__dirname, "..", "stubs", stubFileName);
    let content = readFileSync(stubPath, "utf8");
    content = content.replace(/{{providerName}}/g, providerName);
    return content;
  }

  private createFile(filePath: string, content: string): void {
    try {
      writeFileSync(filePath, content);
      Logger.info(`Provider created successfully: [${filePath}]`);
    } catch (error: any) {
      Logger.error("Error creating provider:", error);
    }
  }
}

export default MakeProviderCommand;
