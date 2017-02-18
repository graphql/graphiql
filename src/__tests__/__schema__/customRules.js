/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @flow
 */

import type {ASTNode} from 'graphql/language';
import type {ValidationContext} from 'graphql/validation';
import type {
  CustomValidationRule,
  GraphQLConfig,
} from 'graphql-language-service-types';

import {GraphQLError} from 'graphql/error';

export default function customRules(
  graphQLConfig: GraphQLConfig,
): Array<CustomValidationRule> {
  // This rule is just for testing purposes
  const NoAlphabetIDArgumentRule = (context: ValidationContext) => ({
    Argument(node: ASTNode): void {
      if (!/^\d+$/.test(node.value.value)) {
        context.reportError(new GraphQLError(
          'Argument ID must be a number written in string type.',
          [node],
        ));
      }
    },
  });
  return [NoAlphabetIDArgumentRule];
}
