/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @flow
 */

import type {DocumentNode} from 'graphql/language';
import type {GraphQLError} from 'graphql/error';
import type {GraphQLSchema} from 'graphql/type';
import type {CustomValidationRule} from 'graphql-language-service-types';

import {specifiedRules, TypeInfo, validate} from 'graphql';

/**
 * Validate a GraphQL Document optionally with custom validation rules.
 */
export function validateWithCustomRules(
  schema: GraphQLSchema,
  ast: DocumentNode,
  customRules?: Array<CustomValidationRule>,
  isRelayCompatMode?: boolean,
): Array<GraphQLError> {
  // Because every fragment is considered for determing model subsets that may
  // be used anywhere in the codebase they're all technically "used" by clients
  // of graphql-data. So we remove this rule from the validators.
  const {
    NoUnusedFragments,
  } = require('graphql/validation/rules/NoUnusedFragments');
  const {
    ExecutableDefinitions,
  } = require('graphql/validation/rules/ExecutableDefinitions');
  const rulesToSkip = [NoUnusedFragments, ExecutableDefinitions];
  if (isRelayCompatMode) {
    const {
      KnownFragmentNames,
    } = require('graphql/validation/rules/KnownFragmentNames');
    rulesToSkip.push(KnownFragmentNames);
  }
  const rules = specifiedRules.filter(
    rule => !rulesToSkip.some(r => r === rule),
  );

  const typeInfo = new TypeInfo(schema);
  if (customRules) {
    Array.prototype.push.apply(rules, customRules);
  }

  const errors: $ReadOnlyArray<GraphQLError> = validate(
    schema,
    ast,
    rules,
    typeInfo,
  );

  if (errors.length > 0) {
    return errors.filter(error => {
      if (error.message.indexOf('Unknown directive') === -1) {
        return true;
      }
      return !(
        (error.nodes &&
          error.nodes[0] &&
          error.nodes[0].name &&
          error.nodes[0].name.value === 'arguments') ||
        (error.nodes &&
          error.nodes[0] &&
          error.nodes[0].name &&
          error.nodes[0].name.value &&
          error.nodes[0].name.value === 'argumentDefinitions')
      );
    });
  }

  return [];
}
