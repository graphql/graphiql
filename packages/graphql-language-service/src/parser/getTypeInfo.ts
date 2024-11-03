/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import {
  GraphQLSchema,
  GraphQLEnumValue,
  GraphQLField,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLArgument,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLList,
  getNamedType,
  getNullableType,
  SchemaMetaFieldDef,
  GraphQLType,
  TypeMetaFieldDef,
  TypeNameMetaFieldDef,
  isCompositeType,
} from 'graphql';

import { AllTypeInfo } from '../types';

import { State, RuleKinds } from '.';

// Gets the field definition given a type and field name
export function getFieldDef(
  schema: GraphQLSchema,
  type: GraphQLType,
  fieldName: string,
): GraphQLField<any, any> | null | undefined {
  if (fieldName === SchemaMetaFieldDef.name && schema.getQueryType() === type) {
    return SchemaMetaFieldDef;
  }
  if (fieldName === TypeMetaFieldDef.name && schema.getQueryType() === type) {
    return TypeMetaFieldDef;
  }
  if (fieldName === TypeNameMetaFieldDef.name && isCompositeType(type)) {
    return TypeNameMetaFieldDef;
  }
  if ('getFields' in type) {
    return type.getFields()[fieldName] as any;
  }

  return null;
}

// Utility for iterating through a CodeMirror parse state stack bottom-up.
export function forEachState(
  stack: State,
  fn: (state: State) => AllTypeInfo | null | void,
): void {
  const reverseStateStack = [];
  let state: State | null | undefined = stack;
  while (state?.kind) {
    reverseStateStack.push(state);
    state = state.prevState;
  }
  for (let i = reverseStateStack.length - 1; i >= 0; i--) {
    fn(reverseStateStack[i]);
  }
}

// Utility for returning the state representing the Definition this token state
// is within, if any.
export function getDefinitionState(
  tokenState: State,
): State | null | undefined {
  let definitionState;

  // TODO - couldn't figure this one out
  forEachState(tokenState, (state: State): void => {
    switch (state.kind) {
      case 'Query':
      case 'ShortQuery':
      case 'Mutation':
      case 'Subscription':
      case 'FragmentDefinition':
        definitionState = state;
        break;
    }
  });

  return definitionState;
}

// Utility for collecting rich type information given any token's state
// from the graphql-mode parser.
export function getTypeInfo(
  schema: GraphQLSchema,
  tokenState: State,
): AllTypeInfo {
  let argDef: AllTypeInfo['argDef'];
  let argDefs: AllTypeInfo['argDefs'];
  let directiveDef: AllTypeInfo['directiveDef'];
  let enumValue: AllTypeInfo['enumValue'];
  let fieldDef: AllTypeInfo['fieldDef'];
  let inputType: AllTypeInfo['inputType'];
  let objectTypeDef: AllTypeInfo['objectTypeDef'];
  let objectFieldDefs: AllTypeInfo['objectFieldDefs'];
  let parentType: AllTypeInfo['parentType'];
  let type: AllTypeInfo['type'];
  let interfaceDef: AllTypeInfo['interfaceDef'];
  forEachState(tokenState, state => {
    switch (state.kind) {
      case RuleKinds.QUERY:
      case 'ShortQuery':
        type = schema.getQueryType();
        break;
      case RuleKinds.MUTATION:
        type = schema.getMutationType();
        break;
      case RuleKinds.SUBSCRIPTION:
        type = schema.getSubscriptionType();
        break;
      case RuleKinds.INLINE_FRAGMENT:
      case RuleKinds.FRAGMENT_DEFINITION:
        if (state.type) {
          type = schema.getType(state.type);
        }
        break;
      case RuleKinds.FIELD:
      case RuleKinds.ALIASED_FIELD: {
        if (!type || !state.name) {
          fieldDef = null;
        } else {
          fieldDef = parentType
            ? getFieldDef(schema, parentType, state.name)
            : null;
          type = fieldDef ? fieldDef.type : null;
        }
        break;
      }
      case RuleKinds.SELECTION_SET:
        parentType = getNamedType(type!);
        break;
      case RuleKinds.DIRECTIVE:
        directiveDef = state.name ? schema.getDirective(state.name) : null;
        break;

      case RuleKinds.INTERFACE_DEF:
        if (state.name) {
          objectTypeDef = null;
          interfaceDef = new GraphQLInterfaceType({
            name: state.name,
            interfaces: [],
            fields: {},
          });
        }

        break;

      case RuleKinds.OBJECT_TYPE_DEF:
        if (state.name) {
          interfaceDef = null;
          objectTypeDef = new GraphQLObjectType({
            name: state.name,
            interfaces: [],
            fields: {},
          });
        }

        break;
      case RuleKinds.ARGUMENTS: {
        if (state.prevState) {
          switch (state.prevState.kind) {
            case RuleKinds.FIELD:
              argDefs = fieldDef && (fieldDef.args as GraphQLArgument[]);
              break;
            case RuleKinds.DIRECTIVE:
              argDefs =
                directiveDef && (directiveDef.args as GraphQLArgument[]);
              break;
            case RuleKinds.FRAGMENT_SPREAD:
              // TODO: lookup fragment and return variable definitions (?)
              break;
            // TODO: needs more tests
            case RuleKinds.ALIASED_FIELD: {
              const name = state.prevState?.name;
              if (!name) {
                argDefs = null;
                break;
              }
              const field = parentType
                ? getFieldDef(schema, parentType, name)
                : null;
              if (!field) {
                argDefs = null;
                break;
              }
              argDefs = field.args as GraphQLArgument[];
              break;
            }
            default:
              argDefs = null;
              break;
          }
        } else {
          argDefs = null;
        }
        break;
      }
      case RuleKinds.ARGUMENT:
        if (argDefs) {
          for (let i = 0; i < argDefs.length; i++) {
            if (argDefs[i].name === state.name) {
              argDef = argDefs[i];
              break;
            }
          }
        }
        inputType = argDef?.type;
        break;
      case RuleKinds.VARIABLE_DEFINITION:
      case RuleKinds.VARIABLE:
        type = inputType;
        break;
      // TODO: needs tests
      case RuleKinds.ENUM_VALUE:
        const enumType = getNamedType(inputType!);
        enumValue =
          enumType instanceof GraphQLEnumType
            ? enumType
                .getValues()
                .find((val: GraphQLEnumValue) => val.value === state.name)
            : null;
        break;
      // TODO: needs tests
      case RuleKinds.LIST_VALUE:
        const nullableType = getNullableType(inputType!);
        inputType =
          nullableType instanceof GraphQLList ? nullableType.ofType : null;
        break;
      case RuleKinds.OBJECT_VALUE:
        const objectType = getNamedType(inputType!);
        objectFieldDefs =
          objectType instanceof GraphQLInputObjectType
            ? objectType.getFields()
            : null;
        break;
      // TODO: needs tests
      case RuleKinds.OBJECT_FIELD:
        const objectField =
          state.name && objectFieldDefs ? objectFieldDefs[state.name] : null;
        inputType = objectField?.type;
        // @ts-expect-error
        fieldDef = objectField as GraphQLField<null, null>;
        type = fieldDef ? fieldDef.type : null;
        break;
      case RuleKinds.NAMED_TYPE:
        if (state.name) {
          type = schema.getType(state.name);
        }
        // TODO: collect already extended interfaces of the type/interface we're extending
        //  here to eliminate them from the completion list
        // because "type A extends B & C &" should not show completion options for B & C still.

        break;
    }
  });

  return {
    argDef,
    argDefs,
    directiveDef,
    enumValue,
    fieldDef,
    inputType,
    objectFieldDefs,
    parentType,
    type,
    interfaceDef,
    objectTypeDef,
  };
}
