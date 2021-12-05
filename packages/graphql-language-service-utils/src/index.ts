/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

export {
  getFragmentDependencies,
  getFragmentDependenciesForAST,
} from './fragmentDependencies';

export {
  getVariablesJSONSchema,
  JSONSchema6,
  JSONSchema6TypeName,
  JSONSchemaOptions,
} from './getVariablesJSONSchema';

export { getASTNodeAtPosition, pointToOffset } from './getASTNodeAtPosition';

export { Position, Range, locToRange, offsetToPosition } from './Range';

export { validateWithCustomRules } from './validateWithCustomRules';

export { collectVariables, VariableToType } from './collectVariables';

export {
  default as getOperationFacts,
  getOperationASTFacts,
  getQueryFacts,
  OperationFacts,
  QueryFacts,
} from './getOperationFacts';
