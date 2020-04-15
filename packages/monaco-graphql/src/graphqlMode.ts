import * as monaco from 'monaco-editor'

import { WorkerManager } from './workerManager';
import { JSONWorker } from './graphqlWorker';
import { LanguageServiceDefaultsImpl } from './monaco.contribution';
import * as languageFeatures from './languageFeatures';
import { createTokenizationSupport } from './tokenization';

import Uri = monaco.Uri;
import IDisposable = monaco.IDisposable;

export function setupMode(defaults: LanguageServiceDefaultsImpl): IDisposable {

    const disposables: IDisposable[] = [];
    const providers: IDisposable[] = [];

    const client = new WorkerManager(defaults);
    disposables.push(client);

    const worker: languageFeatures.WorkerAccessor = (...uris: Uri[]): Promise<JSONWorker> => {
        return client.getLanguageServiceWorker(...uris);
    };


    function registerProviders(): void {
        const { languageId, modeConfiguration } = defaults;

        disposeAll(providers);

        if (modeConfiguration.documentFormattingEdits) {
            providers.push(monaco.languages.registerDocumentFormattingEditProvider(languageId, new languageFeatures.DocumentFormattingEditProvider(worker)));
        }
        if (modeConfiguration.documentRangeFormattingEdits) {
            providers.push(monaco.languages.registerDocumentRangeFormattingEditProvider(languageId, new languageFeatures.DocumentRangeFormattingEditProvider(worker)));
        }
        if (modeConfiguration.completionItems) {
            providers.push(monaco.languages.registerCompletionItemProvider(languageId, new languageFeatures.CompletionAdapter(worker)));
        }
        if (modeConfiguration.hovers) {
            providers.push(monaco.languages.registerHoverProvider(languageId, new languageFeatures.HoverAdapter(worker)));
        }
        if (modeConfiguration.documentSymbols) {
            providers.push(monaco.languages.registerDocumentSymbolProvider(languageId, new languageFeatures.DocumentSymbolAdapter(worker)));
        }
        if (modeConfiguration.tokens) {
            providers.push(monaco.languages.setTokensProvider(languageId, createTokenizationSupport(true)));
        }
        if (modeConfiguration.colors) {
            providers.push(monaco.languages.registerColorProvider(languageId, new languageFeatures.DocumentColorAdapter(worker)));
        }
        if (modeConfiguration.foldingRanges) {
            providers.push(monaco.languages.registerFoldingRangeProvider(languageId, new languageFeatures.FoldingRangeAdapter(worker)));
        }
        if (modeConfiguration.diagnostics) {
            providers.push(new languageFeatures.DiagnosticsAdapter(languageId, worker, defaults));
        }
        if (modeConfiguration.selectionRanges) {
            providers.push(monaco.languages.registerSelectionRangeProvider(languageId, new languageFeatures.SelectionRangeAdapter(worker)));
        }
    }

    registerProviders();

    disposables.push(monaco.languages.setLanguageConfiguration(defaults.languageId, richEditConfiguration));

    let modeConfiguration = defaults.modeConfiguration;
    defaults.onDidChange((newDefaults) => {
        if (newDefaults.modeConfiguration !== modeConfiguration) {
            modeConfiguration = newDefaults.modeConfiguration;
            registerProviders();
        }
    });

    disposables.push(asDisposable(providers));

    return asDisposable(disposables);
}

function asDisposable(disposables: IDisposable[]): IDisposable {
    return { dispose: () => disposeAll(disposables) };
}

function disposeAll(disposables: IDisposable[]) {
    while (disposables.length) {
        disposables.pop().dispose();
    }
}

const richEditConfiguration: monaco.languages.LanguageConfiguration = {
    wordPattern: /(-?\d*\.\d\w*)|([^\[\{\]\}\:\"\,\s]+)/g,

    comments: {
        lineComment: '//',
        blockComment: ['/*', '*/']
    },

    brackets: [
        ['{', '}'],
        ['[', ']']
    ],

    autoClosingPairs: [
        { open: '{', close: '}', notIn: ['string'] },
        { open: '[', close: ']', notIn: ['string'] },
        { open: '"', close: '"', notIn: ['string'] }
    ]
};

