/**
 *  Copyright (c) 2020 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import { SchemaConfig } from 'graphql-language-service';
import { FormattingOptions, ModeConfiguration } from './typings';
import { WorkerAccessor } from './languageFeatures';
import { Emitter, IEvent } from 'monaco-editor';

export class LanguageServiceAPI {
  private _onDidChange = new Emitter<LanguageServiceAPI>();
  private _schemaConfig!: SchemaConfig;
  private _formattingOptions!: FormattingOptions;
  private _modeConfiguration!: ModeConfiguration;
  private _languageId: string;
  private _worker: WorkerAccessor | null;

  constructor({
    languageId,
    schemaConfig,
    modeConfiguration,
    formattingOptions,
  }: {
    languageId: string;
    schemaConfig: SchemaConfig;
    modeConfiguration: ModeConfiguration;
    formattingOptions: FormattingOptions;
  }) {
    this._worker = null;
    this._languageId = languageId;
    this.setSchemaConfig(schemaConfig);
    this.setModeConfiguration(modeConfiguration);
    this.setFormattingOptions(formattingOptions);
  }
  get onDidChange(): IEvent<LanguageServiceAPI> {
    return this._onDidChange.event;
  }

  get languageId(): string {
    return this._languageId;
  }
  get modeConfiguration(): ModeConfiguration {
    return this._modeConfiguration;
  }
  get schemaConfig(): SchemaConfig {
    return this._schemaConfig;
  }
  get formattingOptions(): FormattingOptions {
    return this._formattingOptions;
  }
  get worker(): WorkerAccessor {
    return this._worker as WorkerAccessor;
  }
  setWorker(worker: WorkerAccessor) {
    this._worker = worker;
  }

  getSchema = async () => {
    const langWorker = await this.worker();
    return langWorker.getSchemaResponse();
  };
  parse = async (graphqlString: string) => {
    const langWorker = await this.worker();
    return langWorker.doParse(graphqlString);
  };

  setSchemaConfig(options: SchemaConfig): void {
    this._schemaConfig = options || Object.create(null);
    this._onDidChange.fire(this);
  }

  updateSchemaConfig(options: Partial<SchemaConfig>): void {
    this._schemaConfig = { ...this._schemaConfig, ...options };
    this._onDidChange.fire(this);
  }

  setSchemaUri(schemaUri: string): void {
    this.setSchemaConfig({ ...this._schemaConfig, uri: schemaUri });
  }

  setModeConfiguration(modeConfiguration: ModeConfiguration): void {
    this._modeConfiguration = modeConfiguration || Object.create(null);
    this._onDidChange.fire(this);
  }

  setFormattingOptions(formattingOptions: FormattingOptions): void {
    this._formattingOptions = formattingOptions || Object.create(null);
    this._onDidChange.fire(this);
  }
}

export const modeConfigurationDefault: Required<ModeConfiguration> = {
  documentFormattingEdits: true,
  documentRangeFormattingEdits: false,
  completionItems: true,
  hovers: true,
  documentSymbols: false,
  tokens: false,
  colors: false,
  foldingRanges: false,
  diagnostics: true,
  selectionRanges: false,
};

export const schemaDefault: SchemaConfig = {
  uri: 'http://localhost:8000',
};

export const formattingDefaults: FormattingOptions = {
  prettierConfig: {
    tabWidth: 2,
  },
};
