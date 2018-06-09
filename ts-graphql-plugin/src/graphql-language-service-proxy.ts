import * as ts from "typescript/lib/tsserverlibrary";
import {
  TemplateLanguageService,
  TemplateContext
} from "typescript-template-language-service-decorator";
import {
  getAutocompleteSuggestions,
  getDiagnostics
} from "@divyenduz/graphql-language-service-interface";
import { getGraphQLConfig } from "graphql-config";

export default class GraphQLLanguageServiceProxy
  implements TemplateLanguageService {
  _info?: ts.server.PluginCreateInfo;
  _logger?: (msg: string) => void;

  constructor(
    info: ts.server.PluginCreateInfo,
    logger?: (msg: string) => void
  ) {
    this._info = info;
    this._logger = logger;
  }

  /*
    Use the configration of first project if heuristics failed 
    to find one.
  */
  patchProjectConfig(config) {
    if (!config.config.projects) {
      return config;
    }
    if (config.config.projects) {
      const projectKeys = Object.keys(config.config.projects);
      return config.getProjectConfig(projectKeys[0]);
    }
    return null;
  }

  getCompletionsAtPosition(
    context: TemplateContext,
    position: ts.LineAndCharacter
  ): ts.CompletionInfo {
    try {
      const config = getGraphQLConfig();
      let projectConfig = config.getConfigForFile(context.fileName);
      if (!projectConfig) {
        projectConfig = this.patchProjectConfig(config);
      }
      const schema = projectConfig.getSchema();
      const completions = getAutocompleteSuggestions(
        schema,
        context.text,
        position
      );
      const completionInfo = {
        isGlobalCompletion: false,
        isMemberCompletion: false,
        isNewIdentifierLocation: false,
        entries: completions.map(completion => {
          return {
            name: completion.label,
            kind: completion.kind
              ? completion.kind
              : ts.ScriptElementKind.unknown,
            kindModifiers: "gql",
            sortText: "gql"
          };
        })
      };
      this._logger(`completionInfo: ${JSON.stringify(completionInfo)}`);
      return completionInfo;
    } catch (e) {
      this._logger(`getCompletionsAtPosition: Unhandled exception: ${e}`);
      return {
        isGlobalCompletion: false,
        isMemberCompletion: false,
        isNewIdentifierLocation: false,
        entries: []
      };
    }
  }

  getSemanticDiagnostics?(context: TemplateContext): ts.Diagnostic[] {
    try {
      const config = getGraphQLConfig();
      let projectConfig = config.getConfigForFile(context.fileName);
      if (!projectConfig) {
        projectConfig = this.patchProjectConfig(config);
      }
      const schema = projectConfig.getSchema();
      const diagnostics = getDiagnostics(context.text, schema);
      this._logger(`diagnostics: ${JSON.stringify(diagnostics)}`);
      const transformedDiagnostics = diagnostics
        .map(diagnostic => {
          const code =
            typeof diagnostic.code === "number" ? diagnostic.code : 9999;
          const messageText = diagnostic.message.split("\n")[0];
          const transformedDiagnostic = {
            code,
            messageText,
            category: diagnostic.severity as ts.DiagnosticCategory,
            file: context.fileName,
            start: 0,
            length: 0
          };
          return transformedDiagnostic;
        })
        .filter(diagnostic => !diagnostic.messageText.includes("xxxxxxxxxxxx"));
      this._logger(
        `transformedDiagnostics: ${JSON.stringify(transformedDiagnostics)}`
      );
      return transformedDiagnostics;
    } catch (e) {
      this._logger(`getSemanticDiagnostics: Unhandled exception: ${e}`);
      return [];
    }
  }
}
