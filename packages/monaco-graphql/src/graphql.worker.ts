import * as monaco from 'monaco-editor';
import { buildClientSchema } from 'graphql';
// @ts-ignore
import * as worker from 'monaco-editor/esm/vs/editor/editor.worker';
import { Range } from 'graphql-language-service-types';

export interface ICreateData {
  languageId: string;
  enableSchemaRequest: boolean;
  schemaUrl: String;
}
// @ts-ignore
import {
  getDiagnostics,
  Diagnostic,
  getRange,
  getAutocompleteSuggestions,
  getHoverInformation,
} from 'graphql-languageservice';
import introspectionQuery from './schema';

// console.log(MonacoRange)

// @ts-ignore
const schema = buildClientSchema(introspectionQuery, { assumeValid: false });

export class Position {
  line: number;
  character: number;
  constructor(line: number, character: number) {
    this.line = line;
    this.character = character;
  }

  setLine(line: number) {
    this.line = line;
  }

  setCharacter(character: number) {
    this.character = character;
  }

  lessThanOrEqualTo = (position: Position): boolean =>
    this.line < position.line ||
    (this.line === position.line && this.character <= position.character);
}

export type CompletionItem = monaco.languages.CompletionItem & {
  isDeprecated?: boolean;
  deprecationReason?: string | null;
};

export function toRange(range: Range): monaco.IRange {
  return {
    startLineNumber: range.start.line + 1,
    startColumn: range.start.character + 1,
    endLineNumber: range.end.line + 1,
    endColumn: range.end.character + 1,
  };
}

export function toGraphQLPosition(position: monaco.Position): Position {
  const pos = new Position(position.lineNumber - 1, position.column - 1);
  pos.setCharacter(position.column - 1);
  pos.line = position.lineNumber - 1;
  return pos;
}

export function toCompletion(
  entry: CompletionItem,
  range: Range,
): monaco.languages.CompletionItem {
  // @ts-ignore
  return {
    label: entry.label,
    insertText: entry.insertText || (entry.label as string),
    sortText: entry.sortText,
    filterText: entry.filterText,
    documentation: entry.documentation,
    detail: entry.detail,
    range: toRange(range),
    kind: entry.kind as monaco.languages.CompletionItemKind,
  };
}

export function toMarkerData(
  diagnostic: Diagnostic,
): monaco.editor.IMarkerData {
  return {
    startLineNumber: diagnostic.range.start.line + 1,
    endLineNumber: diagnostic.range.end.line + 1,
    startColumn: diagnostic.range.start.character + 1,
    endColumn: diagnostic.range.end.character + 1,
    message: diagnostic.message,
    severity: 5 || (diagnostic.severity as monaco.MarkerSeverity),
    code: (diagnostic.code as string) || undefined,
  };
}

export class GraphQLWorker {
  private _ctx: monaco.worker.IWorkerContext;
  // @ts-ignore
  // private _languageService: graphqlService.LanguageService;
  // private schema: GraphQLSchema | null;
  constructor(ctx: monaco.worker.IWorkerContext, createData: ICreateData) {
    this._ctx = ctx;
    // this.schema = null;
    console.log({ ctx, createData });
  }
  async doValidation(uri: string): Promise<monaco.editor.IMarkerData[]> {
    const document = this._getTextDocument(uri);
    // @ts-ignore
    const graphqlDiagnostics = await getDiagnostics(document, schema);
    return graphqlDiagnostics.map(toMarkerData);
  }
  async doComplete(
    uri: string,
    position: monaco.Position,
  ): Promise<monaco.languages.CompletionItem[]> {
    const document = this._getTextDocument(uri);
    const graphQLPosition = toGraphQLPosition(position);
    console.log({ graphQLPosition, schema, document });
    const suggestions = await getAutocompleteSuggestions(
      schema,
      document,
      // @ts-ignore
      graphQLPosition,
    );

    return suggestions.map((e: CompletionItem) =>
      toCompletion(
        e,
        // @ts-ignore
        getRange(
          {
            column: graphQLPosition.character + 1,
            line: graphQLPosition.line + 1,
          },
          document,
        ),
      ),
    );
  }

  async doHover(uri: string, position: monaco.Position) {
    const document = this._getTextDocument(uri);
    const graphQLPosition = toGraphQLPosition(position);

    const hover = await getHoverInformation(
      schema,
      document,
      // @ts-ignore
      graphQLPosition,
    );

    return hover;
  }

  private _getTextDocument(_uri: string): string {
    const models = this._ctx.getMirrorModels();
    if (models.length > 0) {
      console.log(models[0].uri);
      return models[0].getValue();
    }
    return '';
  }
}

self.onmessage = () => {
  try {
    // ignore the first message
    worker.initialize(
      (ctx: monaco.worker.IWorkerContext, createData: ICreateData) => {
        console.log('worker initialized');
        return new GraphQLWorker(ctx, createData);
      },
    );
  } catch (err) {
    console.error(err);
    throw err;
  }
};
