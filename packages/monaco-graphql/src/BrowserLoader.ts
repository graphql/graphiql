import {
  Source,
  parseGraphQLJSON,
  SchemaPointerSingle,
  DocumentLoader,
  isValidPath,
  SingleFileOptions,
} from '@graphql-toolkit/common';

import { StorageAPI } from './StorageAPI';

type BrowserLoaderOptions = {
  path: string;
} & SingleFileOptions;

const storage = new StorageAPI();

export class BrowserLoader implements DocumentLoader {
  loaderId(): string {
    return 'browser';
  }

  async canLoad(
    _pointer: SchemaPointerSingle,
    options: BrowserLoaderOptions,
  ): Promise<boolean> {
    return Boolean(storage.get(options.path));
  }

  async load(
    pointer: SchemaPointerSingle,
    options: BrowserLoaderOptions,
  ): Promise<Source> {
    if (!options.path) {
      throw Error('path option not provided');
    }

    try {
      const jsonContent = await storage.get<string>(options.path);
      if (!jsonContent) {
        await storage.set(
          options.path,
          `{ "schema": "http://localhost:8080/graphql" }`,
        );
      }
      return parseGraphQLJSON(pointer, jsonContent, options);
    } catch (e) {
      throw new Error(
        `Unable to read browser json: ${options.path}: ${e.message || e}`,
      );
    }
  }
}
