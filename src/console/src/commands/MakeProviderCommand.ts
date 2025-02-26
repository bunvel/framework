import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { Logger } from "../../../support";
import { Command } from "../command";

class MakeProviderCommand extends Command {
  constructor() {
    super("make:provider", "Create a new service provider");
  }

  async handle({ positionals }: { positionals: string[] }): Promise<void> {
    if (positionals.length === 0) {
      console.log("Please provide a provider name.");
      return;
    }

    const providerName = this.formatName(positionals[0]);
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

  private formatName(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1);
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
