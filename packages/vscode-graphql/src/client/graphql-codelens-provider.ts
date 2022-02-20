import {
  OutputChannel,
  CodeLensProvider,
  TextDocument,
  CancellationToken,
  CodeLens,
  Range,
  Position,
  ProviderResult,
} from "vscode"

import { SourceHelper, ExtractedTemplateLiteral } from "./source-helper"
import capitalize from "capitalize"

export class GraphQLCodeLensProvider implements CodeLensProvider {
  outputChannel: OutputChannel
  sourceHelper: SourceHelper

  constructor(outputChannel: OutputChannel) {
    this.outputChannel = outputChannel
    this.sourceHelper = new SourceHelper(this.outputChannel)
  }

  public provideCodeLenses(
    document: TextDocument,
    _token: CancellationToken,
    // for some reason, ProviderResult<CodeLens[]> doesn't work here
    // anymore after upgrading types
  ): ProviderResult<[]> {
    const literals: ExtractedTemplateLiteral[] = this.sourceHelper.extractAllTemplateLiterals(
      document,
      ["gql", "graphql", "/\\* GraphQL \\*/"],
    )
    const results = literals.map(literal => {
      return new CodeLens(
        new Range(
          new Position(literal.position.line, 0),
          new Position(literal.position.line, 0),
        ),
        {
          title: `Execute ${capitalize(literal.definition.operation)}`,
          command: "vscode-graphql.contentProvider",
          arguments: [literal],
        },
      )
    })

    return results as ProviderResult<[]>
  }
}
