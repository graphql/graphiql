/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import {
  GraphQLLanguageConfig,
  LanguageService,
  SchemaConfig,
  JSONSchema6,
} from 'graphql-language-service';
import { Emitter } from 'monaco-editor';

import type { IEvent } from 'monaco-editor';
import type { FragmentDefinitionNode, GraphQLSchema } from 'graphql';
import type {
  FormattingOptions,
  ModeConfiguration,
  MonacoGraphQLSchemaConfig,
} from './typings';

export type MonacoGraphQLAPIOptions = {
  languageId: string;
  schemaConfig: SchemaConfig;
  modeConfiguration: ModeConfiguration;
  formattingOptions: FormattingOptions;
};

export type SchemaEntry = {
  schema: GraphQLSchema;
  documentString?: string;
  introspectionJSONString?: string;
};

const schemaCache = new Map<string, SchemaEntry>();
export class MonacoGraphQLAPI {
  private _onDidChange = new Emitter<MonacoGraphQLAPI>();
  private _onSchemaLoaded = new Emitter<MonacoGraphQLAPI>();
  private _onSchemaConfigChange = new Emitter<MonacoGraphQLAPI>();
  private _schemaCache: typeof schemaCache = schemaCache;
  private _schemaConfig: SchemaConfig = {};
  private _formattingOptions!: FormattingOptions;
  private _modeConfiguration!: ModeConfiguration;
  private _languageId: string;
  private _documentString: string | null = null;
  private _externalFragmentDefinitions:
    | string
    | FragmentDefinitionNode[]
    | null = null;
  private _langService: LanguageService | null = null;

  constructor({
    languageId,
    schemaConfig,
    modeConfiguration,
    formattingOptions,
  }: MonacoGraphQLAPIOptions) {
    // this._workerPromise = new Promise(resolve => {
    //   this._resolveWorkerPromise = resolve;
    // });
    this._languageId = languageId;
    if (schemaConfig) {
      this.setSchemaConfig(schemaConfig);
    }
    this.setModeConfiguration(modeConfiguration);
    this.setFormattingOptions(formattingOptions);
    this._schemaCache = new Map();
  }

  public get onDidChange(): IEvent<MonacoGraphQLAPI> {
    return this._onDidChange.event;
  }

  public get onSchemaLoaded(): IEvent<MonacoGraphQLAPI> {
    return this._onSchemaLoaded.event;
  }

  public get onSchemaConfigChange(): IEvent<MonacoGraphQLAPI> {
    return this._onSchemaConfigChange.event;
  }
  public get parse() {
    return this._langService!.parse;
  }

  public get langService(): LanguageService | null {
    return this._langService;
  }

  private get _currentSchemaId(): string {
    return this.schemaConfig.uri || 'default';
  }
  private get _currentSchemaEntry(): SchemaEntry | null {
    return this._schemaCache.get(this._currentSchemaId) ?? null;
  }

  public getSchemaConfig(): GraphQLLanguageConfig {
    return {
      schemaConfig: this.schemaConfig,
      exteralFragmentDefinitions: this.externalFragmentDefinitions ?? undefined,
    };
  }
  public async getVariablesJSONSchema(
    uri: string,
    documentText: string,
  ): Promise<JSONSchema6 | null> {
    const JSONSchema = await this._langService?.getVariablesJSONSchema(
      uri,
      documentText,
    );
    if (JSONSchema) {
      return JSONSchema;
    }
    return null;
  }
  /**
   * hard load the schema from the language service
   * @returns {Promise<SchemaEntry | null>}
   */
  private async loadSchema(): Promise<SchemaEntry | null> {
    try {
      const ls = new LanguageService(this.getSchemaConfig());
      this._langService = ls;
      const schema = await ls.loadSchema();
      if (schema) {
        const schemaEntry: SchemaEntry = {
          schema,
          introspectionJSONString: ls.schemaConfig.introspectionJSONString,
          documentString: ls.schemaConfig.documentString,
        };

        this.cacheSchema(schemaEntry);

        this._onSchemaLoaded.fire(this);

        return schemaEntry;
      }
    } catch (err) {
      console.error('error fetching schema\n', err);
    }
    return null;
  }
  private cacheSchema({
    introspectionJSONString,
    documentString,
    schema,
  }: SchemaEntry): void {
    this._schemaCache.set(this._currentSchemaId, {
      introspectionJSONString,
      schema,
      documentString,
    });
  }
  private get schemaReset() {
    return {
      schema: undefined,
      introspectionJSON: undefined,
      introspectionJSONString: undefined,
      documentAST: undefined,
      documentString: undefined,
    };
  }
  public async getSchema(): Promise<SchemaEntry | null> {
    const cachedSchema = this._currentSchemaEntry;

    if (cachedSchema) {
      return cachedSchema;
    }
    return this.loadSchema();
  }
  /**
   * The same as reloadSchema except it always fires a schema loaded event
   * This is great for change events
   *
   * @returns {SchemaEntry}
   */
  public changeSchema(): void {
    const cachedSchema = this._schemaCache.get(
      this.schemaConfig.uri || 'default',
    );
    if (cachedSchema) {
      const ls = new LanguageService(this.getSchemaConfig());
      this._langService = ls;

      this._onSchemaLoaded.fire(this);
    } else {
      this.loadSchema().then();
    }
  }
  /**
   * Force a reload of the schema
   */
  public async reloadSchema(): Promise<void> {
    await this.loadSchema();
  }
  public get languageId(): string {
    return this._languageId;
  }
  public get modeConfiguration(): ModeConfiguration {
    return this._modeConfiguration;
  }
  public get schemaConfig(): MonacoGraphQLSchemaConfig {
    return this._schemaConfig;
  }
  public get formattingOptions(): FormattingOptions {
    return this._formattingOptions;
  }
  public get externalFragmentDefinitions() {
    return this._externalFragmentDefinitions;
  }
  public get hasSchema() {
    return Boolean(this._documentString);
  }

  // public get worker(): Promise<WorkerAccessor> {
  //   if (this._worker) {
  //     return Promise.resolve(this._worker);
  //   }
  //   return this._workerPromise;
  // }
  // setWorker(worker: WorkerAccessor) {
  //   this._worker = worker;
  //   this._resolveWorkerPromise(worker);
  // }

  /**
   * override all schema config. fires onSchemaConfigChange
   *
   * @param options {SchemaConfig}
   */
  public setSchemaConfig(options: SchemaConfig): void {
    this._schemaConfig = options || Object.create(null);
    this._onSchemaConfigChange.fire(this);
  }

  /**
   * update the schema config. fires onSchemaConfigChange
   *
   * @param options {SchemaConfig}
   */
  public updateSchemaConfig(options: Partial<SchemaConfig>): void {
    this.setSchemaConfig({
      ...this._schemaConfig,
      ...options,
      requestOpts: {
        ...this._schemaConfig.requestOpts,
        ...options.requestOpts,
        headers: {
          ...this._schemaConfig.requestOpts?.headers,
          ...options.requestOpts?.headers,
        },
      },
    });
  }

  /**
   * set a new schema URI. fires onSchemaConfigChange
   * @param schemaUri
   */
  public setSchemaUri(schemaUri: string): void {
    this.setSchemaConfig({
      ...this._schemaConfig,
      uri: schemaUri,
      // reset everything else!
      ...this.schemaReset,
    });
  }

  /**
   * set a new schema GraphQLSchema. fires onSchemaLoaded immediately
   * @param schemaUri
   */
  public setSchema(schema: GraphQLSchema): void {
    this._schemaConfig = {
      schema,
      buildSchemaOptions: this._schemaConfig.buildSchemaOptions,
    };
    this._onSchemaLoaded.fire(this);
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

export const schemaDefault: MonacoGraphQLSchemaConfig = {
  loadSchemaOnInit: true,
  loadSchemaOnChange: true,
  requestOpts: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
  buildSchemaOptions: {
    assumeValidSDL: true,
  },
};

export const formattingDefaults: FormattingOptions = {
  prettierConfig: {
    tabWidth: 2,
  },
};
