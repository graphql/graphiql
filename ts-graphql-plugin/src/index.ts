import * as ts from "typescript/lib/tsserverlibrary";
import { decorateWithTemplateLanguageService } from "typescript-template-language-service-decorator";
import GraphQLLanguageServiceProxy from "./graphql-language-service-proxy";

export = (mod: { typescript: typeof ts }) => {
  return {
    create(info: ts.server.PluginCreateInfo): ts.LanguageService {
      const logger = (msg: string) =>
        info.project.projectService.logger.info(
          `[ts-graphql-plugin] ${msg}`
        );
      logger(`create function called`);
      return decorateWithTemplateLanguageService(
        mod.typescript,
        info.languageService,
        new GraphQLLanguageServiceProxy(info, logger),
        {
          tags: ["gql"],
          enableForStringWithSubstitutions: false
        }
      );
    }
  };
};
