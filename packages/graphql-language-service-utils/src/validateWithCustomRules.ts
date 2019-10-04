/**
 *  Copyright (c) 2019 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { DocumentNode, TypeDefinitionNode } from 'graphql/language';
import { GraphQLError } from 'graphql/error';
import { GraphQLSchema } from 'graphql/type';
import { CustomValidationRule } from 'graphql-language-service-types';

import { specifiedRules, TypeInfo, validate } from 'graphql';

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

  const errors: Readonly<Array<GraphQLError>> = validate(
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
      if (error.nodes && error.nodes[0] as TypeDefinitionNode) {
        const node = <TypeDefinitionNode>error.nodes[0];
        return !(
          node.name &&
          node.name.value === 'arguments' ||
          node.name.value === 'argumentDefinitions'
        );
      }
    });
  }

  return [];
}
