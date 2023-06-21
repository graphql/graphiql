/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import { Emitter } from 'monaco-editor';
import type * as monaco from 'monaco-editor';
import type { FragmentDefinitionNode, GraphQLSchema } from 'graphql';
import type {
  CompletionSettings,
  DiagnosticSettings,
  FormattingOptions,
  ModeConfiguration,
  MonacoGraphQLInitializeConfig,
  SchemaConfig,
} from './typings';

export type MonacoGraphQLAPIOptions = {
  languageId: string;
  schemas?: SchemaConfig[];
  modeConfiguration: ModeConfiguration;
  formattingOptions: FormattingOptions;
  diagnosticSettings: DiagnosticSettings;
  completionSettings: CompletionSettings;
};

export type SchemaEntry = {
  schema: GraphQLSchema;
  documentString?: string;
  introspectionJSONString?: string;
};

export class MonacoGraphQLAPI {
  private _onDidChange = new Emitter<MonacoGraphQLAPI>();
  private _formattingOptions: FormattingOptions;
  private _modeConfiguration: ModeConfiguration;
  private _diagnosticSettings: DiagnosticSettings;
  private _completionSettings: CompletionSettings;
  private _schemas: SchemaConfig[] | null = null;
  private _schemasById: Record<string, SchemaConfig> = Object.create(null);
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
    completionSettings,
  }: MonacoGraphQLAPIOptions) {
    this._languageId = languageId;

    if (schemas) {
      this.setSchemaConfig(schemas);
    }
    this._modeConfiguration = modeConfiguration ?? modeConfigurationDefault;
    this._completionSettings = completionSettings ?? completionSettingDefault;
    this._diagnosticSettings = diagnosticSettings ?? diagnosticSettingDefault;
    this._formattingOptions = formattingOptions ?? formattingDefaults;
  }

  public get onDidChange(): monaco.IEvent<MonacoGraphQLAPI> {
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
  public schemasById(): Record<string, SchemaConfig> {
    return this._schemasById;
  }

  public get formattingOptions(): FormattingOptions {
    return this._formattingOptions;
  }
  public get diagnosticSettings(): DiagnosticSettings {
    return this._diagnosticSettings;
  }
  public get completionSettings(): CompletionSettings {
    return this._completionSettings;
  }
  public get externalFragmentDefinitions() {
    return this._externalFragmentDefinitions;
  }

  /**
   * override all schema config.
   *
   * @param schemas {SchemaConfig[]}
   */
  public setSchemaConfig(schemas: SchemaConfig[]): void {
    this._schemas = schemas || null;
    this._schemasById = schemas.reduce((result, schema) => {
      result[schema.uri] = schema;
      return result;
    }, Object.create(null));
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

  public setCompletionSettings(completionSettings: CompletionSettings): void {
    this._completionSettings = completionSettings || Object.create(null);
    this._onDidChange.fire(this);
  }
}

export function create(
  languageId: string,
  config?: MonacoGraphQLInitializeConfig,
) {
  if (!config) {
    return new MonacoGraphQLAPI({
      languageId,
      schemas: [],
      formattingOptions: formattingDefaults,
      modeConfiguration: modeConfigurationDefault,
      diagnosticSettings: diagnosticSettingDefault,
      completionSettings: completionSettingDefault,
    });
  }
  const {
    schemas,
    formattingOptions,
    modeConfiguration,
    diagnosticSettings,
    completionSettings,
  } = config;
  return new MonacoGraphQLAPI({
    languageId,
    schemas,
    formattingOptions: {
      ...formattingDefaults,
      ...formattingOptions,
      prettierConfig: {
        ...formattingDefaults.prettierConfig,
        ...formattingOptions?.prettierConfig,
      },
    },
    modeConfiguration: {
      ...modeConfigurationDefault,
      ...modeConfiguration,
    },
    diagnosticSettings: {
      ...diagnosticSettingDefault,
      ...diagnosticSettings,
    },
    completionSettings: {
      ...completionSettingDefault,
      ...completionSettings,
    },
  });
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

export const formattingDefaults: FormattingOptions = {
  prettierConfig: {
    // rationale? a11y.
    // https://adamtuttle.codes/blog/2021/tabs-vs-spaces-its-an-accessibility-issue/
    tabWidth: 2,
  },
};

export const diagnosticSettingDefault: DiagnosticSettings = {
  jsonDiagnosticSettings: {
    schemaValidation: 'error',
  },
};

export const completionSettingDefault: CompletionSettings = {
  __experimental__fillLeafsOnComplete: false,
};
