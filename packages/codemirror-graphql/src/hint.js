/**
 *  Copyright (c) 2020 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 *
 */

import CodeMirror from 'codemirror';
import {
  canUseDirective,
  getDefinitionState,
  getFragmentDefinitions,
  getTypeInfo,
  hintList,
  objectValues,
} from 'graphql-language-service-interface';
import {
  assertAbstractType,
  doTypesOverlap,
  getNamedType,
  isAbstractType,
  isCompositeType,
  isInputType,
  isObjectType,
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLInterfaceType,
  GraphQLSchema,
  SchemaMetaFieldDef,
  TypeMetaFieldDef,
  TypeNameMetaFieldDef,
  isInterfaceType,
} from 'graphql';
import type {
  GraphQLField,
  GraphQLInputField,
  GraphQLNamedType,
} from 'graphql';
import type {
  CompletionItemForCodeMirror,
  ContextTokenForCodeMirror,
  State,
  TypeInfo,
} from 'graphql-language-service-types';

/**
 * Registers a "hint" helper for CodeMirror.
 *
 * Using CodeMirror's "hint" addon: https://codemirror.net/demo/complete.html
 * Given an editor, this helper will take the token at the cursor and return a
 * list of suggested tokens.
 *
 * Options:
 *
 *   - schema: GraphQLSchema provides the hinter with positionally relevant info
 *
 * Additional Events:
 *
 *   - hasCompletion (codemirror, data, token) - signaled when the hinter has a
 *     new list of completion suggestions.
 *
 */
CodeMirror.registerHelper('hint', 'graphql', (editor, options) => {
  const schema = options.schema;
  if (!schema) {
    return;
  }

  const cur = editor.getCursor();
  const token = editor.getTokenAt(cur);
  const rawResults = getAutocompleteSuggestions(
    schema,
    editor.getValue(),
    token,
  );
  const tokenStart =
    token.type !== null && /"|\w/.test(token.string[0])
      ? token.start
      : token.end;
  const results = {
    list: rawResults.map(item => ({
      text: item.label,
      type: item.type,
      description: item.documentation,
      isDeprecated: item.isDeprecated,
      deprecationReason: item.deprecationReason,
    })),
    from: { line: cur.line, column: tokenStart },
    to: { line: cur.line, column: token.end },
  };

  if (results && results.list && results.list.length > 0) {
    results.from = CodeMirror.Pos(results.from.line, results.from.column);
    results.to = CodeMirror.Pos(results.to.line, results.to.column);
    CodeMirror.signal(editor, 'hasCompletion', editor, results, token);
  }

  return results;
});

/**
 * Given GraphQLSchema, queryText, and context of the current position within
 * the source text, provide a list of typeahead entries.
 */
function getAutocompleteSuggestions(
  schema: GraphQLSchema,
  queryText: string,
  token: ContextTokenForCodeMirror,
): Array<CompletionItemForCodeMirror> {
  const state =
    token.state.kind === 'Invalid' ? token.state.prevState : token.state;

  // relieve flow errors by checking if `state` exists
  if (!state) {
    return [];
  }

  const kind = state.kind;
  const step = state.step;
  const typeInfo = getTypeInfo(schema, token.state);

  // Definition kinds
  if (kind === 'Document') {
    return hintList(token, [
      { label: 'query' },
      { label: 'mutation' },
      { label: 'subscription' },
      { label: 'fragment' },
      { label: '{' },
    ]);
  }

  // Field names
  if (kind === 'SelectionSet' || kind === 'Field' || kind === 'AliasedField') {
    return getSuggestionsForFieldNames(token, typeInfo, schema);
  }

  // Argument names
  if (kind === 'Arguments' || (kind === 'Argument' && step === 0)) {
    const argDefs = typeInfo.argDefs;
    if (argDefs) {
      return hintList(
        token,
        argDefs.map(argDef => ({
          label: argDef.name,
          type: argDef.type,
          documentation: argDef.description ?? undefined,
        })),
      );
    }
  }

  // Input Object fields
  if (kind === 'ObjectValue' || (kind === 'ObjectField' && step === 0)) {
    if (typeInfo.objectFieldDefs) {
      const objectFields = (objectValues(
        typeInfo.objectFieldDefs,
      ): GraphQLInputField[]);
      return hintList(
        token,
        objectFields.map(field => ({
          label: field.name,
          type: field.type,
          documentation: field.description ?? undefined,
        })),
      );
    }
  }

  // Input values: Enum and Boolean
  if (
    kind === 'EnumValue' ||
    (kind === 'ListValue' && step === 1) ||
    (kind === 'ObjectField' && step === 2) ||
    (kind === 'Argument' && step === 2)
  ) {
    return getSuggestionsForInputValues(token, typeInfo);
  }

  // Fragment type conditions
  if (
    (kind === 'TypeCondition' && step === 1) ||
    (kind === 'NamedType' &&
      state.prevState != null &&
      state.prevState.kind === 'TypeCondition')
  ) {
    return getSuggestionsForFragmentTypeConditions(token, typeInfo, schema);
  }

  // Fragment spread names
  if (kind === 'FragmentSpread' && step === 1) {
    return getSuggestionsForFragmentSpread(token, typeInfo, schema, queryText);
  }

  // Variable definition types
  if (
    (kind === 'VariableDefinition' && step === 2) ||
    (kind === 'ListType' && step === 1) ||
    (kind === 'NamedType' &&
      state.prevState &&
      (state.prevState.kind === 'VariableDefinition' ||
        state.prevState.kind === 'ListType'))
  ) {
    return getSuggestionsForVariableDefinition(token, schema);
  }

  // Directive names
  if (kind === 'Directive') {
    return getSuggestionsForDirective(token, state, schema);
  }

  return [];
}

// Helper functions to get suggestions for each kinds
function getSuggestionsForFieldNames(
  token: ContextTokenForCodeMirror,
  typeInfo: TypeInfo,
  schema: GraphQLSchema,
): Array<CompletionItemForCodeMirror> {
  if (typeInfo.parentType) {
    const parentType = typeInfo.parentType;
    const fields: GraphQLField<*, *>[] =
      isObjectType(parentType) || isInterfaceType(parentType)
        ? objectValues((parentType.getFields(): any))
        : [];
    if (isCompositeType(parentType)) {
      fields.push(TypeNameMetaFieldDef);
    }
    if (parentType === schema.getQueryType()) {
      fields.push(SchemaMetaFieldDef, TypeMetaFieldDef);
    }
    return hintList(
      token,
      fields.map(field => ({
        label: field.name,
        type: field.type,
        documentation: field.description ?? undefined,
        isDeprecated: field.isDeprecated,
        deprecationReason: field.deprecationReason,
      })),
    );
  }
  return [];
}

function getSuggestionsForInputValues(
  token: ContextTokenForCodeMirror,
  typeInfo: TypeInfo,
): Array<CompletionItemForCodeMirror> {
  const namedInputType = getNamedType(typeInfo.inputType);
  if (namedInputType instanceof GraphQLEnumType) {
    const values = namedInputType.getValues();
    return hintList(
      token,
      values.map(value => ({
        label: value.name,
        type: namedInputType,
        documentation: value.description ?? undefined,
        isDeprecated: value.isDeprecated,
        deprecationReason: value.deprecationReason,
      })),
    );
  } else if (namedInputType === GraphQLBoolean) {
    return hintList(token, [
      {
        label: 'true',
        type: GraphQLBoolean,
        documentation: 'Not false.',
      },

      {
        label: 'false',
        type: GraphQLBoolean,
        documentation: 'Not true.',
      },
    ]);
  }

  return [];
}

function getSuggestionsForFragmentTypeConditions(
  token: ContextTokenForCodeMirror,
  typeInfo: TypeInfo,
  schema: GraphQLSchema,
): Array<CompletionItemForCodeMirror> {
  let possibleTypes;
  if (typeInfo.parentType) {
    if (isAbstractType(typeInfo.parentType)) {
      const abstractType = assertAbstractType(typeInfo.parentType);
      // Collect both the possible Object types as well as the interfaces
      // they implement.
      const possibleObjTypes = schema.getPossibleTypes(abstractType);
      const possibleIfaceMap: {
        [key: string]: GraphQLInterfaceType,
      } = (Object.create(null): any);
      possibleObjTypes.forEach(type => {
        type.getInterfaces().forEach(iface => {
          possibleIfaceMap[iface.name] = iface;
        });
      });
      possibleTypes = possibleObjTypes.concat(
        (objectValues(possibleIfaceMap): GraphQLInterfaceType[]),
      );
    } else {
      // The parent type is a non-abstract Object type, so the only possible
      // type that can be used is that same type.
      possibleTypes = [typeInfo.parentType];
    }
  } else {
    const typeMap = schema.getTypeMap();
    possibleTypes = (objectValues((typeMap: any)): GraphQLNamedType[]).filter(
      isCompositeType,
    );
  }
  return hintList(
    token,
    possibleTypes.map(type => {
      const namedType = getNamedType(type);
      return {
        label: String(type),
        documentation: (namedType && namedType.description) || '',
      };
    }),
  );
}

function getSuggestionsForFragmentSpread(
  token: ContextTokenForCodeMirror,
  typeInfo: TypeInfo,
  schema: GraphQLSchema,
  queryText: string,
): Array<CompletionItemForCodeMirror> {
  const typeMap = schema.getTypeMap();
  const defState = getDefinitionState(token.state);
  const fragments = getFragmentDefinitions(queryText);

  // Filter down to only the fragments which may exist here.
  const relevantFrags = fragments.filter(
    frag =>
      // Only include fragments with known types.
      typeMap[frag.typeCondition.name.value] &&
      // Only include fragments which are not cyclic.
      !(
        defState &&
        defState.kind === 'FragmentDefinition' &&
        defState.name === frag.name.value
      ) &&
      // Only include fragments which could possibly be spread here.
      isCompositeType(typeInfo.parentType) &&
      isCompositeType(typeMap[frag.typeCondition.name.value]) &&
      doTypesOverlap(
        schema,
        typeInfo.parentType,
        typeMap[frag.typeCondition.name.value],
      ),
  );

  return hintList(
    token,
    relevantFrags.map(frag => ({
      label: frag.name.value,
      type: typeMap[frag.typeCondition.name.value],
      documentation: `fragment ${frag.name.value} on ${frag.typeCondition.name.value}`,
    })),
  );
}

function getSuggestionsForVariableDefinition(
  token: ContextTokenForCodeMirror,
  schema: GraphQLSchema,
): Array<CompletionItemForCodeMirror> {
  const inputTypeMap = schema.getTypeMap();
  const inputTypes = (objectValues(
    (inputTypeMap: any),
  ): GraphQLNamedType[]).filter(isInputType);
  return hintList(
    token,
    inputTypes.map(type => ({
      label: type.name,
      documentation: type.description,
    })),
  );
}

function getSuggestionsForDirective(
  token: ContextTokenForCodeMirror,
  state: State,
  schema: GraphQLSchema,
): Array<CompletionItemForCodeMirror> {
  if (state.prevState && state.prevState.kind) {
    const directives = schema
      .getDirectives()
      .filter(directive => canUseDirective(state.prevState, directive));
    return hintList(
      token,
      directives.map(directive => ({
        label: directive.name,
        documentation: directive.description || '',
      })),
    );
  }
  return [];
}
