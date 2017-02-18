/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @flow
 */

import type {
  GraphQLRC as GraphQLRCInterface,
  GraphQLConfig as GraphQLConfigInterface,
  Uri,
} from 'graphql-language-service-types';

import path from 'path';
import fs from 'fs';

const CONFIG_LIST_NAME = 'build-configs';
const SCHEMA_PATH = 'schema-file';
const CUSTOM_VALIDATION_RULES_MODULE_PATH = 'custom-validation-rules';

/**
 * Finds a .graphqlrc configuration file, and returns null if not found.
 * If the file isn't present in the provided directory path, walk up the
 * directory tree until the file is found or it reaches the root directory.
 */
export function findGraphQLConfigDir(dirPath: Uri): ?string {
  let currentPath = path.resolve(dirPath);
  while (true) {
    const filePath = path.join(currentPath, '.graphqlrc');
    if (fs.existsSync(filePath)) {
      break;
    }
    if (isRootDir(currentPath)) {
      break;
    }

    currentPath = path.dirname(currentPath);
  }

  return !isRootDir(currentPath) ? currentPath : null;
}

export async function getGraphQLConfig(configDir: Uri): Promise<GraphQLRC> {
  const rawGraphQLConfig = await new Promise((resolve, reject) =>
    fs.readFile(
      path.join(configDir, '.graphqlrc'),
      'utf8',
      (error, response) => {
        if (error) {
          // eslint-disable-next-line no-console
          console.error(
            '.graphqlrc file is not available in the provided config ' +
            `directory: ${configDir}\nPlease check the config directory ` +
            'path and try again.',
          );
          reject();
        }
        resolve(response);
      },
    ),
  );
  try {
    const graphqlrc = JSON.parse(rawGraphQLConfig);
    return new GraphQLRC(graphqlrc, configDir);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Parsing JSON in .graphqlrc file has failed.');
    throw new Error(error);
  }
}

export class GraphQLRC implements GraphQLRCInterface {
  _graphqlrc: Object;
  _rootDir: Uri;
  _configs: {[name: string]: GraphQLConfig};

  constructor(graphqlrc: Object, root: Uri) {
    this._graphqlrc = graphqlrc;
    this._rootDir = root;
    this._configs = {};
    if (this._graphqlrc[CONFIG_LIST_NAME]) {
      Object.keys(this._graphqlrc[CONFIG_LIST_NAME]).forEach(name => {
        this._configs[name] = new GraphQLConfig(
          name,
          this._graphqlrc[CONFIG_LIST_NAME][name],
          this._rootDir,
        );
      });
    }
  }

  getConfigDir = (): Uri => {
    return this._rootDir;
  }

  getConfigNames = (): Array<string> => {
    return Object.keys(this._graphqlrc[CONFIG_LIST_NAME]);
  }

  getConfig = (name: string): GraphQLConfig => {
    const config = this._configs[name];
    if (config === undefined) {
      throw new Error(
        `Config ${name} not defined. Choose one of: ` +
        Object.keys(this._graphqlrc[CONFIG_LIST_NAME]).join(', '),
      );
    }
    return config;
  }

  getConfigByFilePath = (filePath: Uri): ?GraphQLConfig => {
    const name = this.getConfigNames().find(configName =>
      this.getConfig(configName).isFileInInputDirs(filePath),
    );

    return name ? this._configs[name] : null;
  }
}

export class GraphQLConfig implements GraphQLConfigInterface {
  _config: Object;
  _name: string;
  _rootDir: Uri;

  constructor(name: string, config: Object, rootDir: Uri): void {
    this._name = name;
    this._rootDir = rootDir;
    this._config = config;
  }

  getRootDir = (): Uri => {
    return this._rootDir;
  }

  getName = (): string => {
    return this._name;
  }

  getConfig = (): Object => {
    return this._config;
  }

  getInputDirs = (): Array<string> => {
    return this._config['input-dirs'] ? this._config['input-dirs'] : [];
  }

  getExcludeDirs = (): Array<string> => {
    return this._config['exclude-dirs'] ? this._config['exclude-dirs'] : [];
  }

  isFileInInputDirs = (fileName: string): boolean => {
    if (!this.getInputDirs()) {
      return false;
    }
    return this.getInputDirs().some(
      dirPath => fileName.indexOf(dirPath) !== -1,
    );
  }

  getSchemaPath = (): ?Uri => {
    return this._config[SCHEMA_PATH] || null;
  }

  getCustomValidationRulesModulePath = (): ?Uri => {
    const modulePath = this._config[CUSTOM_VALIDATION_RULES_MODULE_PATH];
    if (!modulePath) {
      return null;
    }
    return this._normalizePath(modulePath);
  }

  _normalizePath(modulePath: Uri): Uri {
    let resolvedPath;
    if (modulePath.startsWith('~')) { // home directory
      const homeDirPath = (process.platform === 'win32') ?
        process.env.USERPROFILE : process.env.HOME;
      resolvedPath = path.join(homeDirPath || '', modulePath.slice(1));
    } else if (modulePath.startsWith('./')) { // relative local directory
      resolvedPath = path.join(this._rootDir, modulePath);
    } else { // `/` or an actual module name (node_modules)
      resolvedPath = modulePath;
    }

    return resolvedPath;
  }
}

function isRootDir(dirPath: Uri): boolean {
  return path.dirname(dirPath) === dirPath;
}
