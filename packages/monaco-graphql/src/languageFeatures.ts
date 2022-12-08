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
import { getModelLanguageId, GraphQLWorkerCompletionItem } from './utils';

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
    let onChangeTimeout: ReturnType<typeof setTimeout>;
    const onModelAdd = (model: editor.IModel): void => {
      const modeId = getModelLanguageId(model);
      if (modeId !== this.defaults.languageId) {
        // it is tempting to load json models we cared about here
        // into the webworker, however setDiagnosticOptions() needs
        // to be called here from main process anyways, and the worker
        // is already generating json schema itself!
        return;
      }
      const modelUri = model.uri.toString();
      // if the config changes, this adapter will be re-instantiated, so we only need to check this once
      const jsonValidationForModel =
        defaults.diagnosticSettings?.validateVariablesJSON &&
        defaults.diagnosticSettings.validateVariablesJSON[modelUri];

      this._listener[modelUri] = model.onDidChangeContent(() => {
        clearTimeout(onChangeTimeout);
        onChangeTimeout = setTimeout(() => {
          this._doValidate(model.uri, modeId, jsonValidationForModel);
        }, 200);
      });
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
    this._disposables.push({
      dispose: () => {
        clearTimeout(onChangeTimeout);
      },
    });
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

    this._disposables.push({
      dispose: () => {
        for (const key in this._listener) {
          this._listener[key].dispose();
        }
      },
    });
    this._disposables.push(
      defaults.onDidChange(() => {
        editor.getModels().forEach(model => {
          if (getModelLanguageId(model) === this.defaults.languageId) {
            onModelRemoved(model);
            onModelAdd(model);
          }
        });
      }),
    );

    editor.getModels().forEach(onModelAdd);
  }

  public dispose(): void {
    this._disposables.forEach(d => d?.dispose());
    this._disposables = [];
  }

  private async _doValidate(
    resource: Uri,
    languageId: string,
    variablesUris?: string[],
  ) {
    const worker = await this._worker(resource);

    const diagnostics = await worker.doValidation(resource.toString());
    editor.setModelMarkers(
      editor.getModel(resource) as editor.ITextModel,
      languageId,
      diagnostics,
    );

    if (variablesUris) {
      if (variablesUris.length < 1) {
        throw new Error('no variables URI strings provided to validate');
      }
      const jsonSchema = await worker.doGetVariablesJSONSchema(
        resource.toString(),
      );
      if (!jsonSchema) {
        return;
      }

      const schemaUri = monaco.Uri.file(
        variablesUris[0].replace('.json', '-schema.json'),
      ).toString();
      const configResult = {
        uri: schemaUri,
        schema: jsonSchema,
        fileMatch: variablesUris,
      };
      // TODO: export from api somehow?
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        schemaValidation: 'error',
        validate: true,
        ...this.defaults?.diagnosticSettings?.jsonDiagnosticSettings,
        schemas: [configResult],
        enableSchemaRequest: false,
      });
    }
  }
}

const mKind = monaco.languages.CompletionItemKind;

const kindMap: Record<
  lsCompletionItemKind,
  monaco.languages.CompletionItemKind
> = {
  [lsCompletionItemKind.Text]: mKind.Text,
  [lsCompletionItemKind.Method]: mKind.Method,
  [lsCompletionItemKind.Function]: mKind.Function,
  [lsCompletionItemKind.Constructor]: mKind.Constructor,
  [lsCompletionItemKind.Field]: mKind.Field,
  [lsCompletionItemKind.Variable]: mKind.Variable,
  [lsCompletionItemKind.Class]: mKind.Class,
  [lsCompletionItemKind.Interface]: mKind.Interface,
  [lsCompletionItemKind.Module]: mKind.Module,
  [lsCompletionItemKind.Property]: mKind.Property,
  [lsCompletionItemKind.Unit]: mKind.Unit,
  [lsCompletionItemKind.Value]: mKind.Value,
  [lsCompletionItemKind.Enum]: mKind.Enum,
  [lsCompletionItemKind.Keyword]: mKind.Keyword,
  [lsCompletionItemKind.Snippet]: mKind.Snippet,
  [lsCompletionItemKind.Color]: mKind.Color,
  [lsCompletionItemKind.File]: mKind.File,
  [lsCompletionItemKind.Reference]: mKind.Reference,
  [lsCompletionItemKind.Folder]: mKind.Folder,
  [lsCompletionItemKind.EnumMember]: mKind.EnumMember,
  [lsCompletionItemKind.Constant]: mKind.Constant,
  [lsCompletionItemKind.Struct]: mKind.Struct,
  [lsCompletionItemKind.Event]: mKind.Event,
  [lsCompletionItemKind.Operator]: mKind.Operator,
  [lsCompletionItemKind.TypeParameter]: mKind.TypeParameter,
};

export function toCompletionItemKind(
  kind: lsCompletionItemKind,
): monaco.languages.CompletionItemKind {
  return kind in kindMap ? kindMap[kind] : mKind.Text;
}

export function toCompletion(
  entry: GraphQLWorkerCompletionItem,
): monaco.languages.CompletionItem {
  const suggestions: monaco.languages.CompletionItem = {
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
  return suggestions;
}

export class CompletionAdapter
  implements monaco.languages.CompletionItemProvider
{
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
      // eslint-disable-next-line no-console
      console.error('Error fetching completion items', err);
      return { suggestions: [] };
    }
  }
}

export class DocumentFormattingAdapter
  implements monaco.languages.DocumentFormattingEditProvider
{
  constructor(private _worker: WorkerAccessor) {
    this._worker = _worker;
  }

  async provideDocumentFormattingEdits(
    document: editor.ITextModel,
    _options: monaco.languages.FormattingOptions,
    _token: CancellationToken,
  ) {
    const worker = await this._worker(document.uri);

    const formatted = await worker.doFormat(document.uri.toString());
    if (!formatted) {
      return [];
    }
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

    return {
      contents: [],
    };
  }

  dispose() {}
}
