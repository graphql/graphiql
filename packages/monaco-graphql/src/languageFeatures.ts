import { GraphQLWorker } from './graphql.worker';

import * as monaco from 'monaco-editor';
import {
  CompletionItem as lsCompletionItem,
  CompletionItemKind as lsCompletionItemKind,
} from 'vscode-languageserver-types';

import Uri = monaco.Uri;
import Position = monaco.Position;
import Thenable = monaco.Thenable;
import CancellationToken = monaco.CancellationToken;
import IDisposable = monaco.IDisposable;

export interface WorkerAccessor {
  (...more: Uri[]): Thenable<GraphQLWorker>;
}

// --- completion ------

export class DiagnosticsAdapter {
  private _disposables: IDisposable[] = [];
  private _listener: { [uri: string]: IDisposable } = Object.create(null);

  constructor(
    // @ts-ignore
    private defaults: monaco.languages.graphql.LanguageServiceDefaultsImpl,
    private _worker: WorkerAccessor,
  ) {
    this._worker = _worker;
    const onModelAdd = (model: monaco.editor.IModel): void => {
      const modeId = model.getModeId();
      if (modeId !== this.defaults._languageId) {
        return;
      }

      let handle: number;
      this._listener[model.uri.toString()] = model.onDidChangeContent(() => {
        clearTimeout(handle);
        // @ts-ignore
        handle = setTimeout(() => this._doValidate(model.uri, modeId), 500);
      });

      this._doValidate(model.uri, modeId);
    };

    const onModelRemoved = (model: monaco.editor.IModel): void => {
      monaco.editor.setModelMarkers(model, this.defaults._languageId, []);
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
      }),
    );
    this._disposables.push(
      monaco.editor.onDidChangeModelLanguage(event => {
        onModelRemoved(event.model);
        onModelAdd(event.model);
      }),
    );

    this._disposables.push(
      defaults.onDidChange((_: any) => {
        monaco.editor.getModels().forEach(model => {
          if (model.getModeId() === this.defaults._languageId) {
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

    monaco.editor.getModels().forEach(onModelAdd);
  }

  public dispose(): void {
    this._disposables.forEach(d => d && d.dispose());
    this._disposables = [];
  }

  private async _doValidate(resource: Uri, languageId: string) {
    const worker = await this._worker(resource);

    const diagnostics = await worker.doValidation(resource.toString());
    monaco.editor.setModelMarkers(
      monaco.editor.getModel(resource) as monaco.editor.ITextModel,
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
  entry: lsCompletionItem & { range: monaco.IRange },
): monaco.languages.CompletionItem {
  // @ts-ignore
  return {
    label: entry.label,
    insertText: entry.insertText || (entry.label as string),
    sortText: entry.sortText,
    filterText: entry.filterText,
    documentation: entry.documentation,
    detail: entry.detail,
    range: entry.range,
    kind: toCompletionItemKind(entry.kind as lsCompletionItemKind),
  };
}

export class CompletionAdapter
  implements monaco.languages.CompletionItemProvider {
  constructor(private _worker: WorkerAccessor) {
    // this._worker = _worker
  }

  public get triggerCharacters(): string[] {
    return [' ', ':'];
  }

  async provideCompletionItems(
    model: monaco.editor.IReadOnlyModel,
    position: Position,
    _context: monaco.languages.CompletionContext,
    _token: CancellationToken,
  ): Promise<monaco.languages.CompletionList> {
    try {
      const resource = model.uri;
      const worker = await this._worker(model.uri);
      // @ts-ignore
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

export class HoverAdapter implements monaco.languages.HoverProvider {
  constructor(private _worker: WorkerAccessor) {}

  async provideHover(
    model: monaco.editor.IReadOnlyModel,
    position: Position,
    _token: CancellationToken,
  ): Promise<monaco.languages.Hover> {
    const resource = model.uri;
    const worker = await this._worker(model.uri);
    // @ts-ignore
    const hoverItem = await worker.doHover(resource.toString(), position);

    if (hoverItem) {
      console.log(hoverItem.range);
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
