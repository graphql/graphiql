/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import {
  ValidationRule,
  DocumentNode,
  specifiedRules,
  validate,
  GraphQLError,
  GraphQLSchema,
  NoUnusedFragmentsRule,
  KnownFragmentNamesRule,
  Kind,
  ExecutableDefinitionsRule,
} from 'graphql';

/**
 * Validate a GraphQL Document optionally with custom validation rules.
 */
export function validateWithCustomRules(
  schema: GraphQLSchema,
  ast: DocumentNode,
  customRules?: Array<ValidationRule> | null,
  isRelayCompatMode?: boolean,
): Array<GraphQLError> {
  const rules = specifiedRules.filter(rule => {
    // Because every fragment is considered for determing model subsets that may
    // be used anywhere in the codebase they're all technically "used" by clients
    // of graphql-data. So we remove this rule from the validators.
    if (rule === NoUnusedFragmentsRule || rule === ExecutableDefinitionsRule) {
      return false;
    }
    if (isRelayCompatMode && rule === KnownFragmentNamesRule) {
      return false;
    }
    return true;
  });

  if (customRules) {
    Array.prototype.push.apply(rules, customRules);
  }

  const errors = validate(schema, ast, rules);
  return errors.filter(error => {
    if (error.message.indexOf('Unknown directive') !== -1 && error.nodes) {
      const node = error.nodes[0];
      if (node && node.kind === Kind.DIRECTIVE) {
        const name = node.name.value;
        if (name === 'arguments' || name === 'argumentDefinitions') {
          return false;
        }
      }
    }
    return true;
  });
}
