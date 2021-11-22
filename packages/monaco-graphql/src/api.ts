/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import { SchemaConfig } from 'graphql-language-service';
import { Emitter } from 'monaco-editor';

import type { IEvent } from 'monaco-editor';
import type { FragmentDefinitionNode, GraphQLSchema } from 'graphql';
import type {
  DiagnosticSettings,
  FormattingOptions,
  ModeConfiguration,
} from './typings';

export type MonacoGraphQLAPIOptions = {
  languageId: string;
  schemas?: SchemaConfig[];
  modeConfiguration: ModeConfiguration;
  formattingOptions: FormattingOptions;
  diagnosticSettings: DiagnosticSettings;
};

export type SchemaEntry = {
  schema: GraphQLSchema;
  documentString?: string;
  introspectionJSONString?: string;
};

export class MonacoGraphQLAPI {
  private _onDidChange = new Emitter<MonacoGraphQLAPI>();
  private _formattingOptions!: FormattingOptions;
  private _modeConfiguration!: ModeConfiguration;
  private _diagnosticSettings!: DiagnosticSettings;
  private _schemas: SchemaConfig[] | null = null;
  private _languageId: string;
  private _externalFragmentDefinitions:
    | string
    | FragmentDefinitionNode[]
    | null = null;

  constructor({
    languageId,
    schemas,
    modeConfiguration,
    formattingOptions,
    diagnosticSettings,
  }: MonacoGraphQLAPIOptions) {
    this._languageId = languageId;
    if (schemas) {
      this.setSchemaConfig(schemas);
    }
    this.setModeConfiguration(modeConfiguration);
    this.setFormattingOptions(formattingOptions);
    this.setDiagnosticSettings(diagnosticSettings);
  }

  public get onDidChange(): IEvent<MonacoGraphQLAPI> {
    return this._onDidChange.event;
  }

  public get languageId(): string {
    return this._languageId;
  }
  public get modeConfiguration(): ModeConfiguration {
    return this._modeConfiguration;
  }
  public get schemas(): SchemaConfig[] | null {
    return this._schemas;
  }

  public get formattingOptions(): FormattingOptions {
    return this._formattingOptions;
  }
  public get diagnosticSettings(): DiagnosticSettings {
    return this._diagnosticSettings;
  }
  public get externalFragmentDefinitions() {
    return this._externalFragmentDefinitions;
  }

  /**
   * override all schema config. fires onSchemaConfigChange
   *
   * @param options {SchemaConfig}
   */
  public setSchemaConfig(schemas: SchemaConfig[]): void {
    this._schemas = schemas || null;
    this._onDidChange.fire(this);
  }

  public setExternalFragmentDefinitions(
    externalFragmentDefinitions: string | FragmentDefinitionNode[],
  ) {
    this._externalFragmentDefinitions = externalFragmentDefinitions;
  }

  public setModeConfiguration(modeConfiguration: ModeConfiguration): void {
    this._modeConfiguration = modeConfiguration || Object.create(null);
    this._onDidChange.fire(this);
  }

  public setFormattingOptions(formattingOptions: FormattingOptions): void {
    this._formattingOptions = formattingOptions || Object.create(null);
    this._onDidChange.fire(this);
  }

  public setDiagnosticSettings(diagnosticSettings: DiagnosticSettings): void {
    this._diagnosticSettings = diagnosticSettings || Object.create(null);
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
  uri: 'monaco://my-schema.graphql',
  buildSchemaOptions: {
    assumeValidSDL: true,
  },
};

export const formattingDefaults: FormattingOptions = {
  prettierConfig: {
    tabWidth: 2,
  },
};

export const diagnosticSettingDefault: DiagnosticSettings = {
  validateVariablesLevel: 'error',
};
