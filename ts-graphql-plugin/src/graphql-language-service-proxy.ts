import * as ts from "typescript/lib/tsserverlibrary";
import {
  TemplateLanguageService,
  TemplateContext
} from "typescript-template-language-service-decorator";
import { GraphQLCache } from "graphql-language-service-types";
import {
  getAutocompleteSuggestions,
  getDiagnostics
} from "graphql-language-service-interface";
import { getGraphQLConfig } from "graphql-config";

export default class GraphQLLanguageServiceProxy
  implements TemplateLanguageService {
  _source: ts.SourceFileLike;
  _info?: ts.server.PluginCreateInfo;
  _logger?: (msg: string) => void;
  _graphQLCache: GraphQLCache;

  constructor(
    info: ts.server.PluginCreateInfo,
    logger?: (msg: string) => void
  ) {
    this._info = info;
    this._logger = logger;
  }

  getCompletionsAtPosition(
    context: TemplateContext,
    position: ts.LineAndCharacter
  ): ts.CompletionInfo {
    const config = getGraphQLConfig();
    const schema = config.getConfigForFile(context.fileName).getSchema();
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
  }

  getSemanticDiagnostics?(context: TemplateContext): ts.Diagnostic[] {
    const config = getGraphQLConfig();
    const schema = config.getConfigForFile(context.fileName).getSchema();
    const diagnostics = getDiagnostics(context.text, schema);
    this._logger(`diagnostics: ${JSON.stringify(diagnostics)}`);
    const transformedDiagnostics = diagnostics.map(diagnostic => {
      const code = typeof diagnostic.code === "number" ? diagnostic.code : 9999;
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
    });
    this._logger(
      `transformedDiagnostics: ${JSON.stringify(transformedDiagnostics)}`
    );
    return transformedDiagnostics;
  }
}
