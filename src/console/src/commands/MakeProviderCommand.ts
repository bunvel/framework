import { appPath } from "@bunvel/support";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { Logger } from "../../../log";
import Str from "../../../support/Str";
import { Command, type CommandArgs } from "../command";
import { createFile } from "../utils/file_helper";

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
    const providersDir = appPath("providers");
    const filePath = join(providersDir, `${providerName}ServiceProvider.ts`);

    if (!existsSync(providersDir)) {
      mkdirSync(providersDir, { recursive: true });
    }

    if (existsSync(filePath)) {
      Logger.error(`Provider already exists: ${providerName}`);
      return;
    }

    const providerContent = await this.getStubContent(
      "provider.stub",
      providerName
    );
    await createFile("Provider", filePath, providerContent);
  }

  private async getStubContent(
    stubFileName: string,
    providerName: string
  ): Promise<string> {
    const stubPath = join(__dirname, "..", "stubs", stubFileName);
    let content = await Bun.file(stubPath).text();
    content = content.replace(/{{providerName}}/g, providerName);
    return content;
  }
}

export default MakeProviderCommand;
