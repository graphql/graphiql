import { Position, OutputChannel, TextDocument } from 'vscode';
import {
  visit,
  parse,
  VariableDefinitionNode,
  FragmentDefinitionNode,
  NamedTypeNode,
  ListTypeNode,
  OperationDefinitionNode,
  print,
} from 'graphql';
import { GraphQLProjectConfig } from 'graphql-config';
import { ASTNode, DocumentNode } from 'graphql/language';

import nullthrows from 'nullthrows';

export type FragmentInfo = {
  filePath?: string;
  content: string;
  definition: FragmentDefinitionNode;
};

export class SourceHelper {
  private outputChannel: OutputChannel;
  private fragmentDefinitions: Map<string, FragmentInfo>;
  constructor(outputChannel: OutputChannel) {
    this.outputChannel = outputChannel;
    this.fragmentDefinitions = new Map();
  }

  getTypeForVariableDefinitionNode(
    node: VariableDefinitionNode,
  ): GraphQLScalarType {
    let namedTypeNode: NamedTypeNode | null = null;
    let isList = false;
    visit(node, {
      ListType(_listNode: ListTypeNode) {
        isList = true;
      },
      NamedType(namedNode: NamedTypeNode) {
        namedTypeNode = namedNode;
      },
    });
    if (isList) {
      // TODO: This is not a name.value but a custom type that might confuse future programmers
      return 'ListNode';
    }
    if (namedTypeNode) {
      // TODO: Handle this for object types/ enums/ custom scalars
      return (namedTypeNode as NamedTypeNode).name.value;
    }
    // TODO: Is handling all via string a correct fallback?
    return 'String';
  }
  validate(value: string, type: GraphQLScalarType) {
    try {
      switch (type) {
        case 'Int':
          if (parseInt(value, 10)) {
            return null;
          }
          break;
        case 'Float':
          if (parseFloat(value)) {
            return null;
          }
          break;
        case 'Boolean':
          if (value === 'true' || value === 'false') {
            return null;
          }
          break;
        case 'String':
        case 'ID':
        case 'Enum':
          if (value.length && !Array.isArray(value)) {
            return null;
          }
          break;
        default:
          try {
            JSON.parse(value);
            return null;
          } catch {
            return;
          }
      }
    } catch {
      return `${value} is not a valid ${type}`;
    }
    return `${value} is not a valid ${type}`;
  }

  typeCast(value: string, type: GraphQLScalarType) {
    if (type === 'Int') {
      return parseInt(value, 10);
    }
    if (type === 'Float') {
      return parseFloat(value);
    }
    if (type === 'Boolean') {
      return Boolean(value);
    }
    if (type === 'String' || type === 'ID' || type === 'Enum') {
      return value;
    }

    // TODO: Does this note need to have an impact?
    // NOTE:
    // -- We don't do anything for non-nulls - the backend will throw a meaningful error
    // -- We treat custom types and lists similarly - as JSON - tedious for user to provide JSON but it works
    // -- We treat enums as string and that fits

    // Object type
    try {
      return JSON.parse(value);
    } catch {
      this.outputChannel.appendLine(
        'Failed to parse user input as JSON, please use double quotes.',
      );
      return value;
    }
  }
  async getFragmentDefinitions(
    projectConfig: GraphQLProjectConfig,
  ): Promise<Map<string, FragmentInfo> | void> {
    try {
      const sources = await projectConfig.getDocuments();
      const { fragmentDefinitions } = this;
  
      for (const source of sources) {
        visit(source.document as DocumentNode, {
          FragmentDefinition(node) {
            const existingDef = fragmentDefinitions.get(node.name.value);
            const newVal = print(node);
            if ((existingDef && existingDef.content !== newVal) || !existingDef) {
              fragmentDefinitions.set(node.name.value, {
                definition: node,
                content: newVal,
                filePath: source.location,
              });
            }
          },
        });
      }
      return fragmentDefinitions;
    } catch(err) {
      this.outputChannel.append(`${err}`)
    }
  }

  extractAllTemplateLiterals(
    document: TextDocument,
    tags: string[] = ['gql'],
  ): ExtractedTemplateLiteral[] {
    const text = document.getText();
    const documents: ExtractedTemplateLiteral[] = [];

    if (document.languageId === 'graphql') {
      try {
        const documentText = document.getText();
        processGraphQLString(documentText, 0);
        return documents;
      } catch {}
    }

    for (const tag of tags) {
      // https://regex101.com/r/Pd5PaU/2
      const regExpGQL = new RegExp(tag + '\\s*`([\\s\\S]+?)`', 'mg');

      let result: RegExpExecArray | null;
      while ((result = regExpGQL.exec(text)) !== null) {
        const contents = result[1];

        // https://regex101.com/r/KFMXFg/2
        if (contents.match('/${(.+)?}/g')) {
          // We are ignoring operations with template variables for now
          continue;
        }
        try {
          processGraphQLString(contents, result.index + tag.length + 1);
          // no-op on exception, so that non-parse-able source files
          // don't break the extension while editing
        } catch {}
      }
    }
    return documents;

    function processGraphQLString(textString: string, offset: number) {
      const ast = parse(textString);
      const operations = ast.definitions.filter(
        def => def.kind === 'OperationDefinition',
      );
      for (const operation of operations) {
        const op = operation as any;
        const filteredAst = {
          ...ast,
          definitions: ast.definitions.filter(def => {
            if (def.kind === 'OperationDefinition' && def !== op) {
              return false;
            }
            return true;
          }),
        };
        documents.push({
          content: print(filteredAst),
          uri: document.uri.path,
          position: document.positionAt(op.loc.start + offset),
          definition: op,
          ast: filteredAst,
        });
      }
      // no-op, so that non-parse-able source files
      // don't break the extension while editing
    }
  }
}

export type GraphQLScalarType = 'String' | 'Float' | 'Int' | 'Boolean' | string;
export type GraphQLScalarTSType = string | number | boolean;

export interface ExtractedTemplateLiteral {
  content: string;
  uri: string;
  position: Position;
  ast: DocumentNode;
  definition: OperationDefinitionNode;
}

export const getFragmentDependencies = async (
  query: string,
  fragmentDefinitions?: Map<string, FragmentInfo> | null,
): Promise<FragmentInfo[]> => {
  // If there isn't context for fragment references,
  // return an empty array.
  if (!fragmentDefinitions) {
    return [];
  }
  // If the query cannot be parsed, validations cannot happen yet.
  // Return an empty array.
  let parsedQuery;
  try {
    parsedQuery = parse(query);
  } catch {
    return [];
  }
  return getFragmentDependenciesForAST(parsedQuery, fragmentDefinitions);
};

export const getFragmentDependenciesForAST = async (
  parsedQuery: ASTNode,
  fragmentDefinitions: Map<string, FragmentInfo>,
): Promise<FragmentInfo[]> => {
  if (!fragmentDefinitions) {
    return [];
  }

  const existingFrags = new Map();
  const referencedFragNames = new Set<string>();

  visit(parsedQuery, {
    FragmentDefinition(node) {
      existingFrags.set(node.name.value, true);
    },
    FragmentSpread(node) {
      if (!referencedFragNames.has(node.name.value)) {
        referencedFragNames.add(node.name.value);
      }
    },
  });

  const asts = new Set<FragmentInfo>();
  for (const name of referencedFragNames) {
    if (!existingFrags.has(name) && fragmentDefinitions.has(name)) {
      asts.add(nullthrows(fragmentDefinitions.get(name)));
    }
  }

  const referencedFragments: FragmentInfo[] = [];

  for (const ast of asts) {
    visit(ast.definition, {
      FragmentSpread(node) {
        if (
          !referencedFragNames.has(node.name.value) &&
          fragmentDefinitions.get(node.name.value)
        ) {
          asts.add(nullthrows(fragmentDefinitions.get(node.name.value)));
          referencedFragNames.add(node.name.value);
        }
      },
    });
    if (!existingFrags.has(ast.definition.name.value)) {
      referencedFragments.push(ast);
    }
  }

  return referencedFragments;
};
