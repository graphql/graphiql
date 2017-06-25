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
  GraphQLConfig as GraphQLConfigInterface,
  GraphQLConfiguration,
  Uri,
} from 'graphql-language-service-types';

import path from 'path';

const PROJECTS_NAME = 'projects';
const CUSTOM_VALIDATION_RULES_NAME = 'customValidationRules';

export const GRAPHQL_CONFIG_NAME = '.graphqlconfig';

/**
 * GraphQLConfig class holds various information about the GraphQL app by
 * reading the GraphQL configuration file (.graphqlconfig) located somewhere
 * in the app directory tree. For more information of how to write a
 * configuration for your GraphQL app, please refer to `GraphQLConfigTypes.js`
 * file.
 */
export class GraphQLConfig implements GraphQLConfigInterface {
  _config: GraphQLConfiguration;
  _rootDir: Uri;

  constructor(config: GraphQLConfiguration, rootDir: Uri): void {
    this._rootDir = rootDir;
    this._config = config;
  }

  // GraphQL language server utilizes an `extensions` config option to customize
  // for the situation with many apps with a shared code in one repository.
  // This function searches for the additional app configurations and
  // returns the name of the app configuration if found.
  getAppConfigNameByFilePath(filePath: Uri): ?string {
    const appConfigs = this._config[PROJECTS_NAME];
    if (!appConfigs) {
      return null;
    }

    const appConfigNames = Object.keys(appConfigs);

    const name = appConfigNames.find(appName => {
      const appConfig = this._config[PROJECTS_NAME] &&
        this._config[PROJECTS_NAME][appName];
      if (appConfig) {
        // check if the file is included in includeDirs,
        // and is not included in excludeDirs
        return this.isFileInIncludeDirs(filePath, appName) &&
          !this.isFileInExcludeDirs(filePath, appName);
      }
      return false;
    });

    return name || null;
  }

  getRootDir(): Uri {
    return this._rootDir;
  }

  getName(): string {
    return 'GraphQLConfig';
  }

  getConfig(): GraphQLConfiguration {
    return this._config;
  }

  /**
   * Below getters inspect the GraphQL configuration in two steps:
   * 1. If `appName` is provided, look for the app configuration and try
   *    returning app-specific properties, overriding the configuration options
   *    at the top level.
   * 2. If step 1 fails and/or `appName` is not passed in, look for the property
   *    at the top level (the "root" configuration).
   */

  getIncludeDirs(appName: ?string): Array<Uri> {
    return this._getPropertyFromConfig('includeDirs', appName, []);
  }

  getExcludeDirs(appName: ?string): Array<Uri> {
    return this._getPropertyFromConfig('excludeDirs', appName, []);
  }

  getSchemaPath(appName: ?string): ?Uri {
    return this._getPropertyFromConfig('schemaPath', appName, null);
  }

  isFileInIncludeDirs(fileName: Uri, appName: ?string): boolean {
    if (appName) {
      if (
        this._config[PROJECTS_NAME] &&
        this._config[PROJECTS_NAME][appName] &&
        this._config[PROJECTS_NAME][appName].includeDirs
      ) {
        return this._config[PROJECTS_NAME][appName].includeDirs.some(
          dirPath => fileName.indexOf(dirPath) !== -1,
        );
      }
    }
    return this._config.includeDirs
      ? this._config.includeDirs.some(
          dirPath => fileName.indexOf(dirPath) !== -1,
        )
      : false;
  }

  isFileInExcludeDirs(fileName: Uri, appName: ?string): boolean {
    if (appName) {
      if (
        this._config[PROJECTS_NAME] &&
        this._config[PROJECTS_NAME][appName] &&
        this._config[PROJECTS_NAME][appName].excludeDirs
      ) {
        return this._config[PROJECTS_NAME][appName].excludeDirs.some(
          dirPath => fileName.indexOf(dirPath) !== -1,
        );
      }
    }
    return this._config.excludeDirs
      ? this._config.excludeDirs.some(
          dirPath => fileName.indexOf(dirPath) !== -1,
        )
      : false;
  }

  getCustomValidationRulesModulePath(appName: ?string): ?Uri {
    let modulePath;
    if (appName) {
      if (
        this._config[PROJECTS_NAME] &&
        this._config[PROJECTS_NAME][appName] &&
        this._config[PROJECTS_NAME][appName][CUSTOM_VALIDATION_RULES_NAME]
      ) {
        const appConfig = this._config[PROJECTS_NAME][appName];
        modulePath = appConfig[CUSTOM_VALIDATION_RULES_NAME];
      }
    } else {
      modulePath = this._config[CUSTOM_VALIDATION_RULES_NAME];
    }
    if (!modulePath) {
      return null;
    }
    return this._normalizePath(modulePath);
  }

  _normalizePath(modulePath: Uri): Uri {
    let resolvedPath;
    if (modulePath.startsWith('~')) {
      // home directory
      const homeDirPath = process.platform === 'win32'
        ? process.env.USERPROFILE
        : process.env.HOME;
      resolvedPath = path.join(homeDirPath || '', modulePath.slice(1));
    } else if (modulePath.startsWith('./')) {
      // relative local directory
      resolvedPath = path.join(this._rootDir, modulePath);
    } else {
      // `/` or an actual module name (node_modules)
      resolvedPath = modulePath;
    }

    return resolvedPath;
  }

  _getPropertyFromConfig<T: any>(
    key: string,
    appName: ?string,
    defaultValue: T,
  ): T {
    if (
      appName &&
      this._config[PROJECTS_NAME] &&
      this._config[PROJECTS_NAME][appName] &&
      this._config[PROJECTS_NAME][appName][key]
    ) {
      return this._config[PROJECTS_NAME][appName][key];
    }
    return this._config[key] || defaultValue;
  }
}
