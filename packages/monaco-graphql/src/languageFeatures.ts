import * as monaco from 'monaco-editor';

import { Kind } from 'graphql';

import { LanguageServiceDefaultsImpl } from './monaco.contribution';
import { GraphQLWorker } from './graphqlWorker';

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

// --- diagnostics --- ---

export class DiagnosticsAdapter {
  private _disposables: IDisposable[] = [];
  private _listener: { [uri: string]: IDisposable } = Object.create(null);

  constructor(
    private _languageId: string,
    private _worker: WorkerAccessor,
    defaults: LanguageServiceDefaultsImpl,
  ) {
    const onModelAdd = (model: monaco.editor.IModel): void => {
      const modeId = model.getModeId();
      if (modeId !== this._languageId) {
        return;
      }

      let handle: number;
      this._listener[model.uri.toString()] = model.onDidChangeContent(() => {
        clearTimeout(handle);
        handle = setTimeout(() => this._doValidate(model.uri, modeId), 500);
      });

      this._doValidate(model.uri, modeId);
    };

    const onModelRemoved = (model: monaco.editor.IModel): void => {
      monaco.editor.setModelMarkers(model, this._languageId, []);
      const uriStr = model.uri.toString();
      const listener = this._listener[uriStr];
      if (listener) {
        listener.dispose();
        delete this._listener[uriStr];
      }
    };

    this._disposables.push(monaco.editor.onDidCreateModel(onModelAdd));
    this._disposables.push(
      monaco.editor.onWillDisposeModel(model => {
        onModelRemoved(model);
        this._resetSchema(model.uri);
      }),
    );
    this._disposables.push(
      monaco.editor.onDidChangeModelLanguage(event => {
        onModelRemoved(event.model);
        onModelAdd(event.model);
        this._resetSchema(event.model.uri);
      }),
    );

    this._disposables.push(
      defaults.onDidChange(_ => {
        monaco.editor.getModels().forEach(model => {
          if (model.getModeId() === this._languageId) {
            onModelRemoved(model);
            onModelAdd(model);
          }
        });
      }),
    );

    this._disposables.push({
      dispose: () => {
        monaco.editor.getModels().forEach(onModelRemoved);
        for (const key in this._listener) {
          this._listener[key].dispose();
        }
      },
    });

    monaco.editor.getModels().forEach(onModelAdd);
  }

  public dispose(): void {
    this._disposables.forEach(d => d && d.dispose());
    this._disposables = [];
  }

  private _resetSchema(resource: Uri): void {
    this._worker().then(worker => {
      worker.resetSchema(resource.toString());
    });
  }

  private _doValidate(resource: Uri, languageId: string): void {
    this._worker(resource)
      .then(worker => {
        return worker.doValidation(resource.toString()).then(diagnostics => {
          const markers = diagnostics.map(d => toDiagnostics(resource, d));
          const model = monaco.editor.getModel(resource);
          if (model && model.getModeId() === languageId) {
            monaco.editor.setModelMarkers(model, languageId, markers);
          }
        });
      })
      .then(undefined, err => {
        console.error(err);
      });
  }
}

function toSeverity(lsSeverity: number): monaco.MarkerSeverity {
  switch (lsSeverity) {
    case graphqlService.DIAGNOSTIC_SEVERITY.Error:
      return monaco.MarkerSeverity.Error;
    case graphqlService.DiagnosticSeverity.Warning:
      return monaco.MarkerSeverity.Warning;
    case graphqlService.DiagnosticSeverity.Information:
      return monaco.MarkerSeverity.Info;
    case graphqlService.DiagnosticSeverity.Hint:
      return monaco.MarkerSeverity.Hint;
    default:
      return monaco.MarkerSeverity.Info;
  }
}

function toDiagnostics(
  resource: Uri,
  diag: graphqlService.Diagnostic,
): monaco.editor.IMarkerData {
  const code =
    typeof diag.code === 'number' ? String(diag.code) : <string>diag.code;

  return {
    severity: toSeverity(diag.severity),
    startLineNumber: diag.range.start.line + 1,
    startColumn: diag.range.start.character + 1,
    endLineNumber: diag.range.end.line + 1,
    endColumn: diag.range.end.character + 1,
    message: diag.message,
    code,
    source: diag.source,
  };
}

// --- completion ------

function fromPosition(position: Position): graphqlService.Position {
  if (!position) {
    return void 0;
  }
  return { character: position.column - 1, line: position.lineNumber - 1 };
}

function fromRange(range: IRange): graphqlService.Range {
  if (!range) {
    return void 0;
  }
  return {
    start: {
      line: range.startLineNumber - 1,
      character: range.startColumn - 1,
    },
    end: { line: range.endLineNumber - 1, character: range.endColumn - 1 },
  };
}
function toRange(range: graphqlService.Range): Range {
  if (!range) {
    return void 0;
  }
  return new Range(
    range.start.line + 1,
    range.start.character + 1,
    range.end.line + 1,
    range.end.character + 1,
  );
}

function toCompletionItemKind(
  kind: string,
): monaco.languages.CompletionItemKind {
  const mItemKind = monaco.languages.CompletionItemKind;

  switch (kind) {
    case Kind.FIELD:
      return mItemKind.Property;
    case graphqlService.CompletionItemKind.Method:
      return mItemKind.Method;
    case graphqlService.CompletionItemKind.Function:
      return mItemKind.Function;
    case graphqlService.CompletionItemKind.Constructor:
      return mItemKind.Constructor;
    case graphqlService.CompletionItemKind.Field:
      return mItemKind.Field;
    case graphqlService.CompletionItemKind.Variable:
      return mItemKind.Variable;
    case graphqlService.CompletionItemKind.Class:
      return mItemKind.Class;
    case Kind.INTE:
      return mItemKind.Interface;
    case Kind.Unit:
      return mItemKind.Unit;
    case Kind.Value:
      return mItemKind.Value;
    case Kind.Enum:
      return mItemKind.Enum;
    case Kind.Keyword:
      return mItemKind.Keyword;
    case Kind.Snippet:
      return mItemKind.Snippet;
    case Kind.Color:
      return mItemKind.Color;
    case Kind.File:
      return mItemKind.File;
    case Kind.Reference:
      return mItemKind.Reference;
  }
  return mItemKind.Property;
}

function fromCompletionItemKind(
  kind: monaco.languages.CompletionItemKind,
): typeof Kind {
  const mItemKind = monaco.languages.CompletionItemKind;

  switch (kind) {
    case mItemKind.Text:
      return graphqlService.CompletionItemKind.Text;
    case mItemKind.Method:
      return graphqlService.CompletionItemKind.Method;
    case mItemKind.Function:
      return graphqlService.CompletionItemKind.Function;
    case mItemKind.Constructor:
      return graphqlService.CompletionItemKind.Constructor;
    case mItemKind.Field:
      return graphqlService.CompletionItemKind.Field;
    case mItemKind.Variable:
      return graphqlService.CompletionItemKind.Variable;
    case mItemKind.Class:
      return graphqlService.CompletionItemKind.Class;
    case mItemKind.Interface:
      return graphqlService.CompletionItemKind.Interface;
    case mItemKind.Module:
      return graphqlService.CompletionItemKind.Module;
    case mItemKind.Property:
      return graphqlService.CompletionItemKind.Property;
    case mItemKind.Unit:
      return graphqlService.CompletionItemKind.Unit;
    case mItemKind.Value:
      return graphqlService.CompletionItemKind.Value;
    case mItemKind.Enum:
      return graphqlService.CompletionItemKind.Enum;
    case mItemKind.Keyword:
      return graphqlService.CompletionItemKind.Keyword;
    case mItemKind.Snippet:
      return graphqlService.CompletionItemKind.Snippet;
    case mItemKind.Color:
      return graphqlService.CompletionItemKind.Color;
    case mItemKind.File:
      return graphqlService.CompletionItemKind.File;
    case mItemKind.Reference:
      return graphqlService.CompletionItemKind.Reference;
  }
  return graphqlService.CompletionItemKind.Property;
}

function toTextEdit(
  textEdit: graphqlService.TextEdit,
): monaco.editor.ISingleEditOperation {
  if (!textEdit) {
    return void 0;
  }
  return {
    range: toRange(textEdit.range),
    text: textEdit.newText,
  };
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
  ): Promise<monaco.languages.CompletionList | void> {
    const resource = model.uri;
    const worker = await this._worker(resource);

    const info = worker.doComplete(resource.toString(), fromPosition(position));

    if (!info) {
      return;
    }
    const wordInfo = model.getWordUntilPosition(position);
    const wordRange = new Range(
      position.lineNumber,
      wordInfo.startColumn,
      position.lineNumber,
      wordInfo.endColumn,
    );

    const items: monaco.languages.CompletionItem[] = info.items.map(entry => {
      const item: monaco.languages.CompletionItem = {
        label: entry.label,
        insertText: entry.insertText || entry.label,
        sortText: entry.sortText,
        filterText: entry.filterText,
        documentation: entry.documentation,
        detail: entry.detail,
        range: wordRange,
        kind: toCompletionItemKind(entry.kind),
      };
      if (entry.textEdit) {
        item.range = toRange(entry.textEdit.range);
        item.insertText = entry.textEdit.newText;
      }
      if (entry.additionalTextEdits) {
        item.additionalTextEdits = entry.additionalTextEdits.map(toTextEdit);
      }
      if (entry.insertTextFormat === graphqlService.InsertTextFormat.Snippet) {
        item.insertTextRules =
          monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
      }
      return item;
    });

    return {
      incomplete: info.isIncomplete,
      suggestions: items,
    };
  }
}

function isMarkupContent(thing: any): thing is graphqlService.MarkupContent {
  return (
    thing &&
    typeof thing === 'object' &&
    typeof (<graphqlService.MarkupContent>thing).kind === 'string'
  );
}

function toMarkdownString(
  entry: graphqlService.MarkupContent | graphqlService.MarkedString,
): monaco.IMarkdownString {
  if (typeof entry === 'string') {
    return {
      value: entry,
    };
  }
  if (isMarkupContent(entry)) {
    if (entry.kind === 'plaintext') {
      return {
        value: entry.value.replace(/[\\`*_{}[\]()#+\-.!]/g, '\\$&'),
      };
    }
    return {
      value: entry.value,
    };
  }

  return { value: '```' + entry.language + '\n' + entry.value + '\n```\n' };
}

function toMarkedStringArray(
  contents:
    | graphqlService.MarkupContent
    | graphqlService.MarkedString
    | graphqlService.MarkedString[],
): monaco.IMarkdownString[] {
  if (!contents) {
    return void 0;
  }
  if (Array.isArray(contents)) {
    return contents.map(toMarkdownString);
  }
  return [toMarkdownString(contents)];
}

export class HoverAdapter implements monaco.languages.HoverProvider {
  constructor(private _worker: WorkerAccessor) {}

  async provideHover(
    model: monaco.editor.IReadOnlyModel,
    position: Position,
    _token: CancellationToken,
  ): Promise<monaco.languages.Hover | undefined> {
    const resource = model.uri;
    const worker = await this._worker(resource);
    const info = await worker.doHover(resource.toString(), position);

    if (!info) {
      return;
    }
    return <monaco.languages.Hover>{
      range: toRange(info.range),
      contents: toMarkedStringArray(info.contents),
    };
  }
}

// --- definition ------

function toLocation(
  location: graphqlService.Location,
): monaco.languages.Location {
  return {
    uri: Uri.parse(location.uri),
    range: toRange(location.range),
  };
}

// --- document symbols ------

function toSymbolKind(
  kind: graphqlService.SymbolKind,
): monaco.languages.SymbolKind {
  const mKind = monaco.languages.SymbolKind;

  switch (kind) {
    case graphqlService.SymbolKind.File:
      return mKind.Array;
    case graphqlService.SymbolKind.Module:
      return mKind.Module;
    case graphqlService.SymbolKind.Namespace:
      return mKind.Namespace;
    case graphqlService.SymbolKind.Package:
      return mKind.Package;
    case graphqlService.SymbolKind.Class:
      return mKind.Class;
    case graphqlService.SymbolKind.Method:
      return mKind.Method;
    case graphqlService.SymbolKind.Property:
      return mKind.Property;
    case graphqlService.SymbolKind.Field:
      return mKind.Field;
    case graphqlService.SymbolKind.Constructor:
      return mKind.Constructor;
    case graphqlService.SymbolKind.Enum:
      return mKind.Enum;
    case graphqlService.SymbolKind.Interface:
      return mKind.Interface;
    case graphqlService.SymbolKind.Function:
      return mKind.Function;
    case graphqlService.SymbolKind.Variable:
      return mKind.Variable;
    case graphqlService.SymbolKind.Constant:
      return mKind.Constant;
    case graphqlService.SymbolKind.String:
      return mKind.String;
    case graphqlService.SymbolKind.Number:
      return mKind.Number;
    case graphqlService.SymbolKind.Boolean:
      return mKind.Boolean;
    case graphqlService.SymbolKind.Array:
      return mKind.Array;
  }
  return mKind.Function;
}

export class DocumentSymbolAdapter
  implements monaco.languages.DocumentSymbolProvider {
  constructor(private _worker: WorkerAccessor) {}

  public async provideDocumentSymbols(
    model: monaco.editor.IReadOnlyModel,
    _token: CancellationToken,
  ): Promise<monaco.languages.DocumentSymbol[]> {
    const resource = model.uri;
    const worker = await this._worker(resource);
    const items = await worker.findDocumentSymbols(resource.toString());
    if (!items) {
      return [];
    }
    return items.map(item => ({
      name: item.name,
      detail: '',
      containerName: item.containerName,
      kind: toSymbolKind(item.kind),
      range: toRange(item.location.range),
      selectionRange: toRange(item.location.range),
      tags: [],
    }));
  }
}
