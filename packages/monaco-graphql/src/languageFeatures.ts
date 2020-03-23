import { GraphQLWorker } from './graphqlWorker';

import * as monaco from 'monaco-editor-core';

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
    private defaults: monaco.languages.graphql.LanguageServiceDefaultsImpl,
    private _worker: WorkerAccessor,
  ) {
    const onModelAdd = (model: monaco.editor.IModel): void => {
      const modeId = model.getModeId();
      if (modeId !== this.defaults._languageId) {
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
      defaults.onDidChange(_ => {
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
      position,
    );
    return {
      incomplete: true,
      suggestions: completionItems,
    };
  }
}
