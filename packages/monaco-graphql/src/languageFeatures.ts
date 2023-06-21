/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import { GraphQLWorker } from './GraphQLWorker';
import type { MonacoGraphQLAPI } from './api';
import type * as monaco from 'monaco-editor';
import { Uri, languages } from 'monaco-editor';
import { editor } from 'monaco-editor/esm/vs/editor/editor.api';
import { CompletionItemKind as lsCompletionItemKind } from 'graphql-language-service';
import { getModelLanguageId, GraphQLWorkerCompletionItem } from './utils';

export interface WorkerAccessor {
  (...more: Uri[]): monaco.Thenable<GraphQLWorker>;
}

// --- completion ------

export class DiagnosticsAdapter {
  private _disposables: monaco.IDisposable[] = [];
  private _listener: { [uri: string]: monaco.IDisposable } =
    Object.create(null);

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
        // to be called here from main process anyway, and the worker
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
          void this._doValidate(model.uri, modeId, jsonValidationForModel);
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

    this._disposables.push(
      editor.onDidCreateModel(onModelAdd),
      {
        dispose: () => {
          clearTimeout(onChangeTimeout);
        },
      },
      editor.onWillDisposeModel(model => {
        onModelRemoved(model);
      }),
      editor.onDidChangeModelLanguage(event => {
        onModelRemoved(event.model);
        onModelAdd(event.model);
      }),
      {
        dispose: () => {
          for (const key in this._listener) {
            this._listener[key].dispose();
          }
        },
      },
      defaults.onDidChange(() => {
        for (const model of editor.getModels()) {
          if (getModelLanguageId(model) === this.defaults.languageId) {
            onModelRemoved(model);
            onModelAdd(model);
          }
        }
      }),
    );

    for (const model of editor.getModels()) {
      onModelAdd(model);
    }
  }

  public dispose(): void {
    for (const d of this._disposables) {
      d?.dispose();
    }
    this._disposables = [];
  }

  private async _doValidate(
    resource: Uri,
    languageId: string,
    variablesUris?: string[],
  ) {
    const worker = await this._worker(resource);

    // to handle an edge case bug that happens when
    // typing before the schema is present
    if (!worker) {
      return;
    }

    const diagnostics = await worker.doValidation(resource.toString());
    editor.setModelMarkers(editor.getModel(resource)!, languageId, diagnostics);

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

      const schemaUri = Uri.file(
        variablesUris[0].replace('.json', '-schema.json'),
      ).toString();
      const configResult = {
        uri: schemaUri,
        schema: jsonSchema,
        fileMatch: variablesUris,
      };
      // TODO: export from api somehow?
      languages.json.jsonDefaults.setDiagnosticsOptions({
        schemaValidation: 'error',
        validate: true,
        ...this.defaults?.diagnosticSettings?.jsonDiagnosticSettings,
        schemas: [configResult],
        enableSchemaRequest: false,
      });
    }
  }
}

const mKind = languages.CompletionItemKind;

const kindMap: Record<lsCompletionItemKind, languages.CompletionItemKind> = {
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
): languages.CompletionItemKind {
  return kind in kindMap ? kindMap[kind] : mKind.Text;
}

export function toCompletion(
  entry: GraphQLWorkerCompletionItem,
): languages.CompletionItem {
  const suggestions: languages.CompletionItem = {
    // @ts-expect-error
    range: entry.range,
    kind: toCompletionItemKind(entry.kind!),
    label: entry.label,
    insertText: entry.insertText ?? entry.label,
    insertTextRules: entry.insertText
      ? languages.CompletionItemInsertTextRule.InsertAsSnippet
      : undefined,
    sortText: entry.sortText,
    filterText: entry.filterText,
    documentation: entry.documentation,
    detail: entry.detail,
    command: entry.command,
  };
  return suggestions;
}

export class CompletionAdapter implements languages.CompletionItemProvider {
  constructor(private _worker: WorkerAccessor) {
    this._worker = _worker;
  }

  public get triggerCharacters(): string[] {
    return [':', '$', '\n', '(', '@'];
  }

  async provideCompletionItems(
    model: editor.IReadOnlyModel,
    position: monaco.Position,
    _context: languages.CompletionContext,
    _token: monaco.CancellationToken,
  ): Promise<languages.CompletionList> {
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
  implements languages.DocumentFormattingEditProvider
{
  constructor(private _worker: WorkerAccessor) {
    this._worker = _worker;
  }

  async provideDocumentFormattingEdits(
    document: editor.ITextModel,
    _options: languages.FormattingOptions,
    _token: monaco.CancellationToken,
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

export class HoverAdapter implements languages.HoverProvider {
  constructor(private _worker: WorkerAccessor) {}

  async provideHover(
    model: editor.IReadOnlyModel,
    position: monaco.Position,
    _token: monaco.CancellationToken,
  ): Promise<languages.Hover> {
    const resource = model.uri;
    const worker = await this._worker(model.uri);
    const hoverItem = await worker.doHover(resource.toString(), position);

    if (hoverItem) {
      return {
        range: hoverItem.range,
        contents: [{ value: hoverItem.content as string }],
      };
    }

    return {
      contents: [],
    };
  }

  dispose() {}
}
