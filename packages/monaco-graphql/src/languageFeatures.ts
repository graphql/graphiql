import { GraphQLWorker } from './graphqlWorker';

import * as monaco from 'monaco-editor-core';
import * as graphqlService from 'graphql-languageservice';

import Uri = monaco.Uri;
import Position = monaco.Position;
import Range = monaco.Range;
import IRange = monaco.IRange;
import Thenable = monaco.Thenable;
import CancellationToken = monaco.CancellationToken;
import IDisposable = monaco.IDisposable;

export interface WorkerAccessor {
  (...more: Uri[]): Thenable<GraphQLWorker>;
}

// --- completion ------

function fromPosition(position: Position): graphqlService.Position | void {
  if (!position) {
    return;
  }
  return { character: position.column - 1, line: position.lineNumber - 1 };
}

function fromRange(range: IRange): graphqlService.Range | void {
  if (!range) {
    return;
  }
  return {
    start: {
      line: range.startLineNumber - 1,
      character: range.startColumn - 1,
    },
    end: { line: range.endLineNumber - 1, character: range.endColumn - 1 },
    containsPosition: pos => {
      return monaco.Range.containsPosition(range, {
        lineNumber: pos.line,
        column: pos.character,
      });
    },
  };
}

function toRange(range: graphqlService.Range): Range | void {
  if (!range) {
    return;
  }
  return new Range(
    range.start.line + 1,
    range.start.character + 1,
    range.end.line + 1,
    range.end.character + 1,
  );
}

export class CompletionAdapter
  implements monaco.languages.CompletionItemProvider {
  constructor(private _worker: WorkerAccessor) {}

  public get triggerCharacters(): string[] {
    return [' ', ':'];
  }

  async provideCompletionItems(
    model: monaco.editor.IReadOnlyModel,
    position: Position,
    _context: monaco.languages.CompletionContext,
    _token: CancellationToken,
  ): Promise<monaco.languages.CompletionList> {
    const resource = model.uri;
    const worker = await this._worker(resource);

    const completionItems = await worker.doComplete(
      resource.toString(),
      fromPosition(position) as graphqlService.Position,
    );
    const wordInfo = model.getWordUntilPosition(position);
    const wordRange = new Range(
      position.lineNumber,
      wordInfo.startColumn,
      position.lineNumber,
      wordInfo.endColumn,
    );
    const items: monaco.languages.CompletionItem[] = completionItems.map<
      graphqlService.CompletionItem
    >((entry: graphqlService.CompletionItem) => {
      const item: monaco.languages.CompletionItem = {
        label: entry.label,
        insertText: entry.insertText || entry.label,
        sortText: entry.sortText,
        filterText: entry.filterText,
        documentation: entry.documentation,
        detail: entry.detail,
        range: wordRange,
        kind: entry.kind as monaco.languages.CompletionItemKind,
      };

      return item;
    });

    return {
      incomplete: true,
      suggestions: items,
    };
  }
}
