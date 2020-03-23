// / <reference path="../../../node_modules/monaco-editor-core/monaco.d.ts"/>
import * as monaco from 'monaco-editor-core';

import IWorkerContext = monaco.worker.IWorkerContext;

import * as graphqlService from 'graphql-languageservice';

import { Position } from 'graphql-language-service-utils';
import { GraphQLSchema } from 'graphql';
import { getRange } from 'graphql-language-service-interface/src/getDiagnostics';

function toRange(range: graphqlService.Range): monaco.Range {
  return new monaco.Range(
    range.start.line + 1,
    range.start.character + 1,
    range.end.line + 1,
    range.end.character + 1,
  );
}

export function toMarkerData(
  diagnostic: graphqlService.Diagnostic,
): monaco.editor.IMarkerData {
  return {
    startLineNumber: diagnostic.range.start.line + 1,
    endLineNumber: diagnostic.range.end.line + 1,
    startColumn: diagnostic.range.start.character + 1,
    endColumn: diagnostic.range.end.character + 1,
    message: diagnostic.message,
    severity: diagnostic.severity as monaco.MarkerSeverity,
    code: (diagnostic.code as string) ?? undefined,
  };
}

export function toCompletion(
  entry: graphqlService.CompletionItem,
  range: graphqlService.Range,
): monaco.languages.CompletionItem {
  return {
    label: entry.label,
    insertText: entry.insertText || entry.label,
    sortText: entry.sortText,
    filterText: entry.filterText,
    documentation: entry.documentation,
    detail: entry.detail,
    range: toRange(range),
    kind: entry.kind as monaco.languages.CompletionItemKind,
  };
}

type callbackFnType = (
  stream: graphqlService.CharacterStream,
  state: graphqlService.State,
  style: string,
  index: number,
) => void | 'BREAK';

function runOnlineParser(
  queryText: string,
  callback: callbackFnType,
): graphqlService.ContextToken {
  const lines = queryText.split('\n');
  const parser = graphqlService.onlineParser();
  let state = parser.startState();
  let style = '';

  let stream = new graphqlService.CharacterStream('');

  for (let i = 0; i < lines.length; i++) {
    stream = new graphqlService.CharacterStream(lines[i]);
    while (!stream.eol()) {
      style = parser.token(stream, state);
      const code = callback(stream, state, style, i);
      if (code === 'BREAK') {
        break;
      }
    }

    // Above while loop won't run if there is an empty line.
    // Run the callback one more time to catch this.
    callback(stream, state, style, i);

    if (!state.kind) {
      state = parser.startState();
    }
  }

  return {
    start: stream.getStartOfToken(),
    end: stream.getCurrentPosition(),
    string: stream.current(),
    state,
    style,
  };
}

export class GraphQLWorker {
  private _ctx: IWorkerContext;
  private _languageService: graphqlService.GraphQLLanguageService;
  private _languageId: string;
  private _schema: GraphQLSchema | null;

  constructor(ctx: IWorkerContext, createData: ICreateData) {
    const ls = new graphqlService.GraphQLLanguageService(
      new graphqlService.GraphQLCache(),
    );
    this._ctx = ctx;
    this._languageId = createData.languageId;
    this._languageService = ls;
    this._schema = null;
  }

  public getTokenAtPosition(
    queryText: string,
    cursor: Position,
  ): graphqlService.ContextToken {
    let styleAtCursor = null;
    let stateAtCursor = null;
    let stringAtCursor = null;
    const token = runOnlineParser(queryText, (stream, state, style, index) => {
      if (index === cursor.line) {
        if (stream.getCurrentPosition() >= cursor.character) {
          styleAtCursor = style;
          stateAtCursor = { ...state };
          stringAtCursor = stream.current();
          return 'BREAK';
        }
      }
    });

    // Return the state/style of parsed token in case those at cursor aren't
    // available.
    return {
      start: token.start,
      end: token.end,
      string: stringAtCursor || token.string,
      state: stateAtCursor || token.state,
      style: styleAtCursor || token.style,
    };
  }

  async doValidation(uri: string): Promise<monaco.editor.IMarkerData[]> {
    const document = this._getQueryText(uri);
    if (document) {
      const graphqlDiagnostics = await this._languageService.getDiagnostics(
        document,
        uri,
      );
      return graphqlDiagnostics.map(toMarkerData);
    }
    return Promise.resolve([]);
  }
  async doComplete(
    uri: string,
    position: monaco.Position,
  ): Promise<monaco.languages.CompletionItem[]> {
    const document = this._getQueryText(uri);
    const graphQLPosition = new Position(
      position.lineNumber - 1,
      position.column - 1,
    );
    graphQLPosition.setCharacter(position.column - 1);
    graphQLPosition.line = position.lineNumber - 1;
    const suggestions = await this._languageService.getAutocompleteSuggestions(
      document,
      graphQLPosition,
      uri,
      this.getTokenAtPosition(document, graphQLPosition),
    );

    return suggestions.map(e =>
      toCompletion(
        e,
        getRange(
          { column: graphQLPosition.character, line: graphQLPosition.line },
          document,
        ),
      ),
    );
  }

  public async getSchema(
    projectName?: string,
    queryHasExtensions?: boolean,
  ): Promise<GraphQLSchema | null> {
    this._schema = await this._languageService.getSchema(
      projectName,
      queryHasExtensions,
    );
    return this._schema;
  }

  private _getQueryText(uri: string): string {
    const models = this._ctx.getMirrorModels();
    for (const model of models) {
      if (model.uri.toString() === uri) {
        return model.getValue();
      }
    }
    throw Error(`No GraphQL for uri:\n${uri}`);
  }
}

export interface ICreateData {
  languageId: string;
  enableSchemaRequest: boolean;
}

export function create(
  ctx: IWorkerContext,
  createData: ICreateData,
): GraphQLWorker {
  return new GraphQLWorker(ctx, createData);
}
