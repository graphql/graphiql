/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import { GraphQLWorker } from './GraphQLWorker';
import type { MonacoGraphQLAPI } from './api';

import type {
  Uri,
  Position,
  Thenable,
  CancellationToken,
  IDisposable,
} from 'monaco-editor';

import * as monaco from 'monaco-editor';

import { editor } from 'monaco-editor/esm/vs/editor/editor.api';
import { CompletionItemKind as lsCompletionItemKind } from 'graphql-language-service';
import { GraphQLWorkerCompletionItem } from './utils';
export interface WorkerAccessor {
  (...more: Uri[]): Thenable<GraphQLWorker>;
}

// --- completion ------

export class DiagnosticsAdapter {
  private _disposables: IDisposable[] = [];
  private _listener: { [uri: string]: IDisposable } = Object.create(null);

  constructor(
    private defaults: MonacoGraphQLAPI,
    private _worker: WorkerAccessor,
  ) {
    this._worker = _worker;
    const onModelAdd = (model: editor.IModel): void => {
      const modeId = model.getLanguageId();
      if (modeId !== this.defaults.languageId) {
        return;
      }

      let handle: number;
      this._listener[model.uri.toString()] = model.onDidChangeContent(() => {
        clearTimeout(handle);
        // @ts-ignore
        handle = setTimeout(() => this._doValidate(model.uri, modeId), 200);
      });

      this._doValidate(model.uri, modeId);
    };

    const onModelRemoved = (model: editor.IModel): void => {
      editor.setModelMarkers(model, this.defaults.languageId, []);
      const uriStr = model.uri.toString();
      const listener = this._listener[uriStr];
      if (listener) {
        listener.dispose();
        delete this._listener[uriStr];
      }
    };

    this._disposables.push(editor.onDidCreateModel(onModelAdd));
    this._disposables.push(
      editor.onWillDisposeModel(model => {
        onModelRemoved(model);
      }),
    );
    this._disposables.push(
      editor.onDidChangeModelLanguage(event => {
        onModelRemoved(event.model);
        onModelAdd(event.model);
      }),
    );

    this._disposables.push(
      defaults.onDidChange((_: any) => {
        editor.getModels().forEach(model => {
          if (model.getLanguageId() === this.defaults.languageId) {
            onModelRemoved(model);
            onModelAdd(model);
          }
        });
      }),
    );

    this._disposables.push({
      dispose: () => {
        for (const key in this._listener) {
          this._listener[key].dispose();
        }
      },
    });

    editor.getModels().forEach(onModelAdd);
  }

  public dispose(): void {
    this._disposables.forEach(d => d && d.dispose());
    this._disposables = [];
  }

  private async _doValidate(resource: Uri, languageId: string) {
    const worker = await this._worker(resource);

    const diagnostics = await worker.doValidation(resource.toString());
    editor.setModelMarkers(
      editor.getModel(resource) as editor.ITextModel,
      languageId,
      diagnostics,
    );
  }
}

const mKind = monaco.languages.CompletionItemKind;
export function toCompletionItemKind(kind: lsCompletionItemKind) {
  switch (kind) {
    case lsCompletionItemKind.Text:
      return mKind.Text;
    case lsCompletionItemKind.Method:
      return mKind.Method;
    case lsCompletionItemKind.Function:
      return mKind.Function;
    case lsCompletionItemKind.Constructor:
      return mKind.Constructor;
    case lsCompletionItemKind.Field:
      return mKind.Field;
    case lsCompletionItemKind.Variable:
      return mKind.Variable;
    case lsCompletionItemKind.Class:
      return mKind.Class;
    case lsCompletionItemKind.Interface:
      return mKind.Interface;
    case lsCompletionItemKind.Module:
      return mKind.Module;
    case lsCompletionItemKind.Property:
      return mKind.Property;
    case lsCompletionItemKind.Unit:
      return mKind.Unit;
    case lsCompletionItemKind.Value:
      return mKind.Value;
    case lsCompletionItemKind.Enum:
      return mKind.Enum;
    case lsCompletionItemKind.Keyword:
      return mKind.Keyword;
    case lsCompletionItemKind.Snippet:
      return mKind.Snippet;
    case lsCompletionItemKind.Color:
      return mKind.Color;
    case lsCompletionItemKind.File:
      return mKind.File;
    case lsCompletionItemKind.Reference:
      return mKind.Reference;
    case lsCompletionItemKind.Folder:
      return mKind.Folder;
    case lsCompletionItemKind.EnumMember:
      return mKind.EnumMember;
    case lsCompletionItemKind.Constant:
      return mKind.Constant;
    case lsCompletionItemKind.Struct:
      return mKind.Struct;
    case lsCompletionItemKind.Event:
      return mKind.Event;
    case lsCompletionItemKind.Operator:
      return mKind.Operator;
    case lsCompletionItemKind.TypeParameter:
      return mKind.TypeParameter;
    default:
      return mKind.Text;
  }
}

export function toCompletion(
  entry: GraphQLWorkerCompletionItem,
): monaco.languages.CompletionItem {
  return {
    // @ts-expect-error
    range: entry.range,
    kind: toCompletionItemKind(entry.kind as lsCompletionItemKind),
    label: entry.label,
    insertText: entry.insertText ?? (entry.label as string),
    insertTextRules: entry.insertText
      ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
      : undefined,
    sortText: entry.sortText,
    filterText: entry.filterText,
    documentation: entry.documentation,
    detail: entry.detail,
    command: entry.command,
  };
}

export class CompletionAdapter
  implements monaco.languages.CompletionItemProvider {
  constructor(private _worker: WorkerAccessor) {
    this._worker = _worker;
  }

  public get triggerCharacters(): string[] {
    return [':', '$', '\n', ' ', '(', '@'];
  }

  async provideCompletionItems(
    model: editor.IReadOnlyModel,
    position: Position,
    _context: monaco.languages.CompletionContext,
    _token: CancellationToken,
  ): Promise<monaco.languages.CompletionList> {
    try {
      const resource = model.uri;
      const worker = await this._worker(model.uri);
      const completionItems = await worker.doComplete(
        resource.toString(),
        position,
      );
      return {
        incomplete: true,
        suggestions: completionItems.map(toCompletion),
      };
    } catch (err) {
      console.error(`Error fetching completion items\n\n${err}`);
      return { suggestions: [] };
    }
  }
}

export class DocumentFormattingAdapter
  implements monaco.languages.DocumentFormattingEditProvider {
  constructor(
    // private _defaults: MonacoGraphQLAPIImpl,
    private _worker: WorkerAccessor,
  ) {
    // this._defaults = _defaults;
    this._worker = _worker;
  }
  async provideDocumentFormattingEdits(
    document: editor.ITextModel,
    _options: monaco.languages.FormattingOptions,
    _token: CancellationToken,
  ) {
    const worker = await this._worker(document.uri);
    const text = document.getValue();

    const formatted = await worker.doFormat(text);
    return [
      {
        range: document.getFullModelRange(),
        text: formatted,
      },
    ];
  }
}

export class HoverAdapter implements monaco.languages.HoverProvider {
  constructor(private _worker: WorkerAccessor) {}

  async provideHover(
    model: editor.IReadOnlyModel,
    position: Position,
    _token: CancellationToken,
  ): Promise<monaco.languages.Hover> {
    const resource = model.uri;
    const worker = await this._worker(model.uri);
    const hoverItem = await worker.doHover(resource.toString(), position);

    if (hoverItem) {
      return <monaco.languages.Hover>{
        range: hoverItem.range,
        contents: [{ value: hoverItem.content }],
      };
    }

    // @ts-ignore
    return;
  }

  dispose() {}
}
