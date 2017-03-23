/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @flow
 */

import type {Uri} from 'graphql-language-service-types';

import fs from 'fs';
import path from 'path';

import {GRAPHQL_CONFIG_NAME, GraphQLConfig} from './GraphQLConfig';

/**
 * Given a config directory, returns a GraphQLConfig object.
 * Throws errors if GraphQLConfig object isn't available or fails to be built.
 */
export async function getGraphQLConfig(configDir: Uri): Promise<GraphQLConfig> {
  const rawGraphQLConfig = await new Promise((resolve, reject) =>
    fs.readFile(
      path.join(configDir, GRAPHQL_CONFIG_NAME),
      'utf8',
      (error, response) => {
        if (error) {
          // eslint-disable-next-line no-console
          console.error(
            '${GRAPHQL_CONFIG_NAME} file is not available in the provided ' +
              `config directory: ${configDir}\nPlease check the config ` +
              'directory path and try again.',
          );
          reject();
        }
        resolve(response);
      },
    ));
  try {
    return new GraphQLConfig(JSON.parse(rawGraphQLConfig), configDir);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Parsing JSON in .graphqlrc file has failed.');
    throw new Error(error);
  }
}
