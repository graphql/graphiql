import {
  Source,
  parseGraphQLJSON,
  SchemaPointerSingle,
  UniversalLoader,
  SingleFileOptions,
} from '@graphql-toolkit/common';

type BrowserLoaderOptions = {
  schemaUrl: string;
} & SingleFileOptions;

export class BrowserLoader implements UniversalLoader {
  loaderId(): string {
    return 'browser';
  }

  async canLoad(
    _pointer: SchemaPointerSingle,
    _options: BrowserLoaderOptions,
  ): Promise<boolean> {
    return Boolean(document.getElementById('graphql-config'));
  }

  async load(
    pointer: SchemaPointerSingle,
    options: BrowserLoaderOptions,
  ): Promise<Source> {
    if (!options.schemaUrl) {
      throw Error('schemaUrl option not provided');
    }

    try {
      const configEl = document.getElementById('graphql-config');
      if (!configEl) {
        const div = document.createElement('div');
        div.id = 'graphql-config';
        div.innerText = `{ "schema": "${options.schemaUrl}" }`;
        document.body.appendChild(div);
        return JSON.parse(div.innerText);
      }
      const jsonContent = JSON.parse(configEl?.innerText);
      return parseGraphQLJSON(pointer, jsonContent, options);
    } catch (e) {
      throw new Error(
        `Unable to read browser json: ${options.schemaUrl}: ${e.message || e}`,
      );
    }
  }
}
