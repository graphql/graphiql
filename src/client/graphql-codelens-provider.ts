import {
  OutputChannel,
  CodeLensProvider,
  TextDocument,
  CancellationToken,
  CodeLens,
  Range,
  Position,
} from "vscode"

import { SourceHelper, ExtractedTemplateLiteral } from "./source-helper"
import { OperationDefinitionNode } from "graphql"
import * as capitalize from "capitalize"

export class GraphQLCodeLensProvider implements CodeLensProvider {
  outputChannel: OutputChannel
  sourceHelper: SourceHelper

  constructor(outputChannel: OutputChannel) {
    this.outputChannel = outputChannel
    this.sourceHelper = new SourceHelper(this.outputChannel)
  }

  public provideCodeLenses(
    document: TextDocument,
    token: CancellationToken,
  ): CodeLens[] | Thenable<CodeLens[]> {
    const literals: ExtractedTemplateLiteral[] = this.sourceHelper.extractAllTemplateLiterals(
      document,
      ["gql", "graphql"],
    )
    return literals.map(literal => {
      return new CodeLens(
        new Range(
          new Position(literal.position.line, 0),
          new Position(literal.position.line, 0),
        ),
        {
          title: `Execute ${capitalize(
            (literal.ast.definitions[0] as OperationDefinitionNode).operation,
          )}`,
          command: "extension.contentProvider",
          arguments: [literal],
        },
      )
    })
  }
}
