import { TextDocument, Position, OutputChannel } from "vscode"
import {
  visit,
  parse,
  DocumentNode,
  VariableDefinitionNode,
  NamedTypeNode,
  ListTypeNode,
} from "graphql"

export class SourceHelper {
  private outputChannel: OutputChannel

  constructor(outputChannel: OutputChannel) {
    this.outputChannel = outputChannel
  }

  getTypeForVariableDefinitionNode(
    node: VariableDefinitionNode,
  ): GraphQLScalarType {
    let namedTypeNode: NamedTypeNode | null = null
    let isList = false
    visit(node, {
      ListType(node: ListTypeNode) {
        isList = true
      },
      NamedType(node: NamedTypeNode) {
        namedTypeNode = node
      },
    })
    if (isList) {
      // TODO: This is not a name.value but a custom type that might confuse future programmers
      return "ListNode"
    }
    if (namedTypeNode) {
      // TODO: Handle this for object types/ enums/ custom scalars
      return (namedTypeNode as NamedTypeNode).name.value as GraphQLScalarType
    } else {
      // TODO: Is handling all via string a correct fallback?
      return "String"
    }
  }

  typeCast(value, type: GraphQLScalarType) {
    if (type === "Int") {
      return parseInt(value)
    }
    if (type === "Float") {
      return parseFloat(value)
    }
    if (type === "Boolean") {
      return Boolean(value)
    }
    if (type === "String") {
      return value
    }

    // TODO: Does this note need to have an impact?
    // NOTE:
    // -- We don't do anything for non-nulls - the backend will throw a meaninful error
    // -- We treat custom types and lists similarly - as JSON - tedious for user to provide JSON but it works
    // -- We treat enums as string and that fits

    // Object type
    try {
      return JSON.parse(value)
    } catch (e) {
      this.outputChannel.appendLine(
        `Failed to parse user input as JSON, please use double quotes.`,
      )
      return value
    }
  }

  extractAllTemplateLiterals(
    document: TextDocument,
    tags: string[] = ["gql"],
  ): ExtractedTemplateLiteral[] {
    const text = document.getText()
    const documents: any[] = []

    tags.forEach(tag => {
      // https://regex101.com/r/Pd5PaU/2
      const regExpGQL = new RegExp(tag + "\\s*`([\\s\\S]+?)`", "mg")

      let result
      while ((result = regExpGQL.exec(text)) !== null) {
        const contents = result[1]

        // https://regex101.com/r/KFMXFg/2
        if (Boolean(contents.match("/${(.+)?}/g"))) {
          // We are ignoring operations with template variables for now
          continue
        }

        let isLiteralParsableGraphQLOperation = true
        let ast: DocumentNode | null = null
        try {
          ast = parse(contents)
          const isOperation = ast.definitions.some(
            definition => definition.kind === "OperationDefinition",
          )
          isLiteralParsableGraphQLOperation = isOperation ? true : false
        } catch (e) {
          isLiteralParsableGraphQLOperation = false
        }
        const position = document.positionAt(result.index + 4)
        if (isLiteralParsableGraphQLOperation) {
          documents.push({
            content: contents,
            uri: document.uri.path,
            position: position,
            ast,
          })
        }
      }
    })

    return documents
  }
}

export type GraphQLScalarType = "String" | "Float" | "Int" | "Boolean" | string
export type GraphQLScalarTSType = string | number | boolean

export interface ExtractedTemplateLiteral {
  content: string
  uri: string
  position: Position
  ast: DocumentNode
}
