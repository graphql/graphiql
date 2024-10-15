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

export class GraphQLCodeLensProvider implements CodeLensProvider {
  outputChannel: OutputChannel;
  sourceHelper: SourceHelper;
  contentProvider?: GraphQLContentProvider;

  constructor(outputChannel: OutputChannel) {
    this.outputChannel = outputChannel;
    this.sourceHelper = new SourceHelper(this.outputChannel);
  }

  public async provideCodeLenses(
    document: TextDocument,
    _token: CancellationToken,
    // for some reason, ProviderResult<CodeLens[]> doesn't work here
    // anymore after upgrading types
  ): Promise<CodeLens[]> {
    this.contentProvider = new GraphQLContentProvider(
      document.uri,
      this.outputChannel,
      // @ts-expect-error
      { uri: document.uri.fsPath },
    );
    await this.contentProvider.loadConfig();
    if (
      !this.contentProvider.hasConfig ||
      !(await this.contentProvider.loadEndpoint())
    ) {
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
  }
}
