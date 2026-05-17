import {
  buildClientSchema,
  getIntrospectionQuery,
  printSchema,
  parse,
  buildASTSchema,
} from 'graphql';
import type { SchemaConfig } from 'monaco-graphql';
import { Uri } from 'monaco-graphql/monaco-editor';

const SCHEMA_URL = 'https://api.github.com/graphql';
const API_TOKEN = localStorage.getItem('ghapi') || null;

const localStorageKey = 'ghapi';

export const schemaOptions = [
  {
    value: SCHEMA_URL,
    label: 'Github API',
    default: true,
    headers: Object.create(null),
  },
  {
    value: 'https://api.spacex.land/graphql',
    label: 'SpaceX GraphQL API',
    headers: Object.create(null),
  },
];

const setSchemaStatus = (message: string) => {
  const schemaStatus = document.getElementById('schema-status');
  if (schemaStatus) {
    const html = message;
    schemaStatus.innerHTML = html;
  }
};

class MySchemaFetcher {
  private _options: typeof schemaOptions;
  private _currentSchema: (typeof schemaOptions)[0];
  private _schemaCache = new Map<string, SchemaConfig>();
  private _schemaOverride = new Map<string, string>();

  constructor(options = schemaOptions) {
    this._options = options;
    this._currentSchema = schemaOptions[0];
    if (API_TOKEN) {
      this._currentSchema.headers.authorization = `Bearer ${API_TOKEN}`;
    }
  }
  public get currentSchema() {
    return this._currentSchema;
  }
  public get token() {
    return this._currentSchema.headers.authorization;
  }
  async getSchema() {
    const cacheItem = this._schemaCache.get(this._currentSchema.value);
    if (cacheItem) {
      return {
        ...cacheItem,
        documentString: this.getOverride() || cacheItem.documentString,
      };
    }
    return this.loadSchema();
  }
  async setApiToken(token: string) {
    this._currentSchema.headers.authorization = `Bearer ${token}`;
    localStorage.setItem(localStorageKey, token);
  }
  logout() {
    this._currentSchema.headers.authorization = undefined;
    localStorage.removeItem(localStorageKey);
  }
  async loadSchema() {
    try {
      setSchemaStatus('Schema Loading...');
      const url = this._currentSchema.value;

      const headers = {
        'content-type': 'application/json',
      };
      const result = await fetch(url, {
        method: 'POST',
        headers: {
          ...headers,
          ...this._currentSchema.headers,
        },
        body: JSON.stringify(
          {
            query: getIntrospectionQuery(),
            operationName: 'IntrospectionQuery',
          },
          null,
          2,
        ),
      });
      const introspectionJSON = (await result.json()).data;
      const documentString = printSchema(buildClientSchema(introspectionJSON));
      this._schemaCache.set(url, {
        introspectionJSON,
        documentString,
        uri: Uri.parse(url).toString(),
      });

      this.clearOverride();

      setSchemaStatus('Schema Loaded');
    } catch {
      setSchemaStatus('Schema error');
    }

    return this._schemaCache.get(this._currentSchema.value);
  }
  async changeSchema(uri: string) {
    this._currentSchema = this._options.find(opt => opt.value === uri)!;
    this.clearOverride();
    return this.getSchema();
  }

  getOverride() {
    return this._schemaOverride.get(this._currentSchema.value);
  }

  clearOverride() {
    this._schemaOverride.delete(this._currentSchema.value);
  }

  async overrideSchema(sdl: string) {
    if (isValid(sdl)) {
      this._schemaOverride.set(this._currentSchema.value, sdl);
      return this.getSchema();
    }
  }
}

function isValid(sdl: string) {
  try {
    const ast = parse(sdl);
    buildASTSchema(ast);
    return true;
  } catch {
    return false;
  }
}

export const schemaFetcher = new MySchemaFetcher(schemaOptions);
