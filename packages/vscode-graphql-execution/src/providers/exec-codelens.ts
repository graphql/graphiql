import {
  OutputChannel,
  CodeLensProvider,
  TextDocument,
  CancellationToken,
  CodeLens,
  Range,
  Position,
} from 'vscode';

import { SourceHelper, ExtractedTemplateLiteral } from '../helpers/source';
import capitalize from 'capitalize';
import { GraphQLContentProvider } from './exec-content';
import { ConfigHelper } from '../helpers/config';

export class GraphQLCodeLensProvider implements CodeLensProvider {
  sourceHelper: SourceHelper;
  contentProvider?: GraphQLContentProvider;
  constructor(
    private outputChannel: OutputChannel,
    private configHelper: ConfigHelper,
  ) {
    this.sourceHelper = new SourceHelper(this.outputChannel);
  }

  public async provideCodeLenses(
    document: TextDocument,
    _token: CancellationToken,
    // for some reason, ProviderResult<CodeLens[]> doesn't work here
    // anymore after upgrading types
  ): Promise<CodeLens[]> {
    try {
      const endpoints = await this.configHelper?.loadEndpoint(
        document.uri.fsPath,
      );
      console.log(endpoints);
      if (!endpoints?.url || endpoints.url === '') {
        return [];
      }
      const literals: ExtractedTemplateLiteral[] =
        this.sourceHelper.extractAllTemplateLiterals(document, [
          'gql',
          'graphql',
          '/\\* GraphQL \\*/',
        ]);
      const results = literals.map(literal => {
        return new CodeLens(
          new Range(
            new Position(literal.position.line, 0),
            new Position(literal.position.line, 0),
          ),
          {
            title: `Execute ${capitalize(literal.definition.operation)}`,
            command: 'vscode-graphql-execution.contentProvider',
            arguments: [literal],
          },
        );
      });

      return results;
    } catch (err) {
      this.outputChannel.appendLine(`${err}`);
      return [];
    }
  }
}
