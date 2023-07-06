/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import {
  FragmentDefinitionNode,
  GraphQLDirective,
  GraphQLSchema,
  GraphQLType,
  GraphQLCompositeType,
  GraphQLEnumValue,
  GraphQLField,
  GraphQLFieldMap,
  GraphQLNamedType,
  isInterfaceType,
  GraphQLInterfaceType,
  GraphQLObjectType,
  Kind,
  DirectiveLocation,
  GraphQLArgument,
  isListType,
  isNonNullType,
  isScalarType,
  isObjectType,
  isUnionType,
  isEnumType,
  isInputObjectType,
  isOutputType,
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLList,
  SchemaMetaFieldDef,
  TypeMetaFieldDef,
  TypeNameMetaFieldDef,
  assertAbstractType,
  doTypesOverlap,
  getNamedType,
  getNullableType,
  isAbstractType,
  isCompositeType,
  isInputType,
  visit,
  BREAK,
  parse,
} from 'graphql';

import {
  CompletionItem,
  AllTypeInfo,
  IPosition,
  CompletionItemKind,
  InsertTextFormat,
} from '../types';

import {
  CharacterStream,
  onlineParser,
  ContextToken,
  State,
  RuleKinds,
  RuleKind,
  ContextTokenForCodeMirror,
} from '../parser';

import {
  forEachState,
  getDefinitionState,
  getFieldDef,
  hintList,
  objectValues,
} from './autocompleteUtils';

export const SuggestionCommand = {
  command: 'editor.action.triggerSuggest',
  title: 'Suggestions',
};

const collectFragmentDefs = (op: string | undefined) => {
  const externalFragments: FragmentDefinitionNode[] = [];
  if (op) {
    try {
      visit(parse(op), {
        FragmentDefinition(def) {
          externalFragments.push(def);
        },
      });
    } catch {
      return [];
    }
  }
  return externalFragments;
};

const typeSystemKinds: Kind[] = [
  // TypeSystemDefinition
  Kind.SCHEMA_DEFINITION,
  Kind.OPERATION_TYPE_DEFINITION,
  Kind.SCALAR_TYPE_DEFINITION,
  Kind.OBJECT_TYPE_DEFINITION,
  Kind.INTERFACE_TYPE_DEFINITION,
  Kind.UNION_TYPE_DEFINITION,
  Kind.ENUM_TYPE_DEFINITION,
  Kind.INPUT_OBJECT_TYPE_DEFINITION,
  Kind.DIRECTIVE_DEFINITION,
  // TypeSystemExtension
  Kind.SCHEMA_EXTENSION,
  Kind.SCALAR_TYPE_EXTENSION,
  Kind.OBJECT_TYPE_EXTENSION,
  Kind.INTERFACE_TYPE_EXTENSION,
  Kind.UNION_TYPE_EXTENSION,
  Kind.ENUM_TYPE_EXTENSION,
  Kind.INPUT_OBJECT_TYPE_EXTENSION,
];

const hasTypeSystemDefinitions = (sdl: string | undefined) => {
  let hasTypeSystemDef = false;
  if (sdl) {
    try {
      visit(parse(sdl), {
        enter(node) {
          if (node.kind === 'Document') {
            return;
          }
          if (typeSystemKinds.includes(node.kind)) {
            hasTypeSystemDef = true;
            return BREAK;
          }
          return false;
        },
      });
    } catch {
      return hasTypeSystemDef;
    }
  }
  return hasTypeSystemDef;
};

export type AutocompleteSuggestionOptions = {
  fillLeafsOnComplete?: boolean;
  schema?: GraphQLSchema;
  uri?: string;
  mode?: GraphQLDocumentMode;
};

/**
 * Given GraphQLSchema, queryText, and context of the current position within
 * the source text, provide a list of typeahead entries.
 */
export function getAutocompleteSuggestions(
  schema: GraphQLSchema,
  queryText: string,
  cursor: IPosition,
  contextToken?: ContextTokenForCodeMirror,
  fragmentDefs?: FragmentDefinitionNode[] | string,
  options?: AutocompleteSuggestionOptions,
): Array<CompletionItem> {
  const opts = {
    ...options,
    schema,
  };
  const token: ContextToken =
    contextToken || getTokenAtPosition(queryText, cursor, 1);

  const state =
    token.state.kind === 'Invalid' ? token.state.prevState : token.state;

  const mode = options?.mode || getDocumentMode(queryText, options?.uri);

  // relieve flow errors by checking if `state` exists
  if (!state) {
    return [];
  }

  const { kind, step, prevState } = state;
  const typeInfo = getTypeInfo(schema, token.state);

  // Definition kinds
  if (kind === RuleKinds.DOCUMENT) {
    if (mode === GraphQLDocumentMode.TYPE_SYSTEM) {
      return getSuggestionsForTypeSystemDefinitions(token);
    }
    return getSuggestionsForExecutableDefinitions(token);
  }

  if (kind === RuleKinds.EXTEND_DEF) {
    return getSuggestionsForExtensionDefinitions(token);
  }

  if (
    prevState?.prevState?.kind === RuleKinds.EXTENSION_DEFINITION &&
    state.name
  ) {
    return hintList(token, []);
  }

  // extend scalar
  if (prevState?.kind === Kind.SCALAR_TYPE_EXTENSION) {
    return hintList(
      token,
      Object.values(schema.getTypeMap())
        .filter(isScalarType)
        .map(type => ({
          label: type.name,
          kind: CompletionItemKind.Function,
        })),
    );
  }

  // extend object type
  if (prevState?.kind === Kind.OBJECT_TYPE_EXTENSION) {
    return hintList(
      token,
      Object.values(schema.getTypeMap())
        .filter(type => isObjectType(type) && !type.name.startsWith('__'))
        .map(type => ({
          label: type.name,
          kind: CompletionItemKind.Function,
        })),
    );
  }

  // extend interface type
  if (prevState?.kind === Kind.INTERFACE_TYPE_EXTENSION) {
    return hintList(
      token,
      Object.values(schema.getTypeMap())
        .filter(isInterfaceType)
        .map(type => ({
          label: type.name,
          kind: CompletionItemKind.Function,
        })),
    );
  }

  // extend union type
  if (prevState?.kind === Kind.UNION_TYPE_EXTENSION) {
    return hintList(
      token,
      Object.values(schema.getTypeMap())
        .filter(isUnionType)
        .map(type => ({
          label: type.name,
          kind: CompletionItemKind.Function,
        })),
    );
  }

  // extend enum type
  if (prevState?.kind === Kind.ENUM_TYPE_EXTENSION) {
    return hintList(
      token,
      Object.values(schema.getTypeMap())
        .filter(type => isEnumType(type) && !type.name.startsWith('__'))
        .map(type => ({
          label: type.name,
          kind: CompletionItemKind.Function,
        })),
    );
  }

  // extend input object type
  if (prevState?.kind === Kind.INPUT_OBJECT_TYPE_EXTENSION) {
    return hintList(
      token,
      Object.values(schema.getTypeMap())
        .filter(isInputObjectType)
        .map(type => ({
          label: type.name,
          kind: CompletionItemKind.Function,
        })),
    );
  }

  if (
    kind === RuleKinds.IMPLEMENTS ||
    (kind === RuleKinds.NAMED_TYPE && prevState?.kind === RuleKinds.IMPLEMENTS)
  ) {
    return getSuggestionsForImplements(
      token,
      state,
      schema,
      queryText,
      typeInfo,
    );
  }

  // Field names
  if (
    kind === RuleKinds.SELECTION_SET ||
    kind === RuleKinds.FIELD ||
    kind === RuleKinds.ALIASED_FIELD
  ) {
    return getSuggestionsForFieldNames(token, typeInfo, opts);
  }

  // Argument names
  if (
    kind === RuleKinds.ARGUMENTS ||
    (kind === RuleKinds.ARGUMENT && step === 0)
  ) {
    const { argDefs } = typeInfo;
    if (argDefs) {
      return hintList(
        token,
        argDefs.map(
          (argDef: GraphQLArgument): CompletionItem => ({
            label: argDef.name,
            insertText: argDef.name + ': ',
            command: SuggestionCommand,
            detail: String(argDef.type),
            documentation: argDef.description ?? undefined,
            kind: CompletionItemKind.Variable,
            type: argDef.type,
          }),
        ),
      );
    }
  }

  // Input Object fields
  if (
    (kind === RuleKinds.OBJECT_VALUE ||
      (kind === RuleKinds.OBJECT_FIELD && step === 0)) &&
    typeInfo.objectFieldDefs
  ) {
    const objectFields = objectValues(typeInfo.objectFieldDefs);
    const completionKind =
      kind === RuleKinds.OBJECT_VALUE
        ? CompletionItemKind.Value
        : CompletionItemKind.Field;
    return hintList(
      token,
      objectFields.map(field => ({
        label: field.name,
        detail: String(field.type),
        documentation: field.description ?? undefined,
        kind: completionKind,
        type: field.type,
      })),
    );
  }

  // Input values: Enum and Boolean
  if (
    kind === RuleKinds.ENUM_VALUE ||
    (kind === RuleKinds.LIST_VALUE && step === 1) ||
    (kind === RuleKinds.OBJECT_FIELD && step === 2) ||
    (kind === RuleKinds.ARGUMENT && step === 2)
  ) {
    return getSuggestionsForInputValues(token, typeInfo, queryText, schema);
  }
  // complete for all variables available in the query
  if (kind === RuleKinds.VARIABLE && step === 1) {
    const namedInputType = getNamedType(typeInfo.inputType!);
    const variableDefinitions = getVariableCompletions(
      queryText,
      schema,
      token,
    );
    return hintList(
      token,
      variableDefinitions.filter(v => v.detail === namedInputType?.name),
    );
  }

  // Fragment type conditions
  if (
    (kind === RuleKinds.TYPE_CONDITION && step === 1) ||
    (kind === RuleKinds.NAMED_TYPE &&
      prevState != null &&
      prevState.kind === RuleKinds.TYPE_CONDITION)
  ) {
    return getSuggestionsForFragmentTypeConditions(
      token,
      typeInfo,
      schema,
      kind,
    );
  }

  // Fragment spread names
  if (kind === RuleKinds.FRAGMENT_SPREAD && step === 1) {
    return getSuggestionsForFragmentSpread(
      token,
      typeInfo,
      schema,
      queryText,
      Array.isArray(fragmentDefs)
        ? fragmentDefs
        : collectFragmentDefs(fragmentDefs),
    );
  }

  const unwrappedState = unwrapType(state);

  if (
    (mode === GraphQLDocumentMode.TYPE_SYSTEM &&
      !unwrappedState.needsAdvance &&
      kind === RuleKinds.NAMED_TYPE) ||
    kind === RuleKinds.LIST_TYPE
  ) {
    if (unwrappedState.kind === RuleKinds.FIELD_DEF) {
      return hintList(
        token,
        Object.values(schema.getTypeMap())
          .filter(type => isOutputType(type) && !type.name.startsWith('__'))
          .map(type => ({
            label: type.name,
            kind: CompletionItemKind.Function,
          })),
      );
    }
    if (unwrappedState.kind === RuleKinds.INPUT_VALUE_DEF) {
      return hintList(
        token,
        Object.values(schema.getTypeMap())
          .filter(type => isInputType(type) && !type.name.startsWith('__'))
          .map(type => ({
            label: type.name,
            kind: CompletionItemKind.Function,
          })),
      );
    }
  }

  // Variable definition types
  if (
    (kind === RuleKinds.VARIABLE_DEFINITION && step === 2) ||
    (kind === RuleKinds.LIST_TYPE && step === 1) ||
    (kind === RuleKinds.NAMED_TYPE &&
      prevState &&
      (prevState.kind === RuleKinds.VARIABLE_DEFINITION ||
        prevState.kind === RuleKinds.LIST_TYPE ||
        prevState.kind === RuleKinds.NON_NULL_TYPE))
  ) {
    return getSuggestionsForVariableDefinition(token, schema, kind);
  }

  // Directive names
  if (kind === RuleKinds.DIRECTIVE) {
    return getSuggestionsForDirective(token, state, schema, kind);
  }

  return [];
}

const insertSuffix = ' {\n  $1\n}';

/**
 * Choose carefully when to insert the `insertText`!
 * @param field
 * @returns
 */
const getInsertText = (field: GraphQLField<null, null>) => {
  const { type } = field;
  if (isCompositeType(type)) {
    return insertSuffix;
  }
  if (isListType(type) && isCompositeType(type.ofType)) {
    return insertSuffix;
  }
  if (isNonNullType(type)) {
    if (isCompositeType(type.ofType)) {
      return insertSuffix;
    }
    if (isListType(type.ofType) && isCompositeType(type.ofType.ofType)) {
      return insertSuffix;
    }
  }
  return null;
};

// Helper functions to get suggestions for each kinds
function getSuggestionsForTypeSystemDefinitions(token: ContextToken) {
  return hintList(token, [
    { label: 'extend', kind: CompletionItemKind.Function },
    { label: 'type', kind: CompletionItemKind.Function },
    { label: 'interface', kind: CompletionItemKind.Function },
    { label: 'union', kind: CompletionItemKind.Function },
    { label: 'input', kind: CompletionItemKind.Function },
    { label: 'scalar', kind: CompletionItemKind.Function },
    { label: 'schema', kind: CompletionItemKind.Function },
  ]);
}

function getSuggestionsForExecutableDefinitions(token: ContextToken) {
  return hintList(token, [
    { label: 'query', kind: CompletionItemKind.Function },
    { label: 'mutation', kind: CompletionItemKind.Function },
    { label: 'subscription', kind: CompletionItemKind.Function },
    { label: 'fragment', kind: CompletionItemKind.Function },
    { label: '{', kind: CompletionItemKind.Constructor },
  ]);
}

function getSuggestionsForExtensionDefinitions(token: ContextToken) {
  return hintList(token, [
    { label: 'type', kind: CompletionItemKind.Function },
    { label: 'interface', kind: CompletionItemKind.Function },
    { label: 'union', kind: CompletionItemKind.Function },
    { label: 'input', kind: CompletionItemKind.Function },
    { label: 'scalar', kind: CompletionItemKind.Function },
    { label: 'schema', kind: CompletionItemKind.Function },
  ]);
}

function getSuggestionsForFieldNames(
  token: ContextToken,
  typeInfo: AllTypeInfo,
  options?: AutocompleteSuggestionOptions,
): Array<CompletionItem> {
  if (typeInfo.parentType) {
    const { parentType } = typeInfo;
    let fields: GraphQLField<null, null>[] = [];
    if ('getFields' in parentType) {
      fields = objectValues<GraphQLField<null, null>>(
        // TODO: getFields returns `GraphQLFieldMap<any, any> | GraphQLInputFieldMap`
        parentType.getFields() as GraphQLFieldMap<any, any>,
      );
    }

    if (isCompositeType(parentType)) {
      fields.push(TypeNameMetaFieldDef);
    }
    if (parentType === options?.schema?.getQueryType()) {
      fields.push(SchemaMetaFieldDef, TypeMetaFieldDef);
    }
    return hintList(
      token,
      fields.map<CompletionItem>((field, index) => {
        const suggestion: CompletionItem = {
          // This will sort the fields in the same order they are listed in the schema
          sortText: String(index) + field.name,
          label: field.name,
          detail: String(field.type),
          documentation: field.description ?? undefined,
          deprecated: Boolean(field.deprecationReason),
          isDeprecated: Boolean(field.deprecationReason),
          deprecationReason: field.deprecationReason,
          kind: CompletionItemKind.Field,
          type: field.type,
        };

        if (options?.fillLeafsOnComplete) {
          // TODO: fillLeafs capability
          const insertText = getInsertText(field);
          if (insertText) {
            suggestion.insertText = field.name + insertText;
            suggestion.insertTextFormat = InsertTextFormat.Snippet;
            suggestion.command = SuggestionCommand;
          }
        }

        return suggestion;
      }),
    );
  }
  return [];
}

function getSuggestionsForInputValues(
  token: ContextToken,
  typeInfo: AllTypeInfo,
  queryText: string,
  schema: GraphQLSchema,
): Array<CompletionItem> {
  const namedInputType = getNamedType(typeInfo.inputType!);

  const queryVariables: CompletionItem[] = getVariableCompletions(
    queryText,
    schema,
    token,
  ).filter(v => v.detail === namedInputType.name);

  if (namedInputType instanceof GraphQLEnumType) {
    const values = namedInputType.getValues();
    return hintList(
      token,
      values
        .map<CompletionItem>((value: GraphQLEnumValue) => ({
          label: value.name,
          detail: String(namedInputType),
          documentation: value.description ?? undefined,
          deprecated: Boolean(value.deprecationReason),
          isDeprecated: Boolean(value.deprecationReason),
          deprecationReason: value.deprecationReason,
          kind: CompletionItemKind.EnumMember,
          type: namedInputType,
        }))
        .concat(queryVariables),
    );
  }
  if (namedInputType === GraphQLBoolean) {
    return hintList(
      token,
      queryVariables.concat([
        {
          label: 'true',
          detail: String(GraphQLBoolean),
          documentation: 'Not false.',
          kind: CompletionItemKind.Variable,
          type: GraphQLBoolean,
        },
        {
          label: 'false',
          detail: String(GraphQLBoolean),
          documentation: 'Not true.',
          kind: CompletionItemKind.Variable,
          type: GraphQLBoolean,
        },
      ]),
    );
  }

  return queryVariables;
}

function getSuggestionsForImplements(
  token: ContextToken,
  tokenState: State,
  schema: GraphQLSchema,
  documentText: string,
  typeInfo: AllTypeInfo,
): Array<CompletionItem> {
  // exit empty if we need an &
  if (tokenState.needsSeparator) {
    return [];
  }
  const typeMap = schema.getTypeMap();

  const schemaInterfaces = objectValues(typeMap).filter(isInterfaceType);
  const schemaInterfaceNames = schemaInterfaces.map(({ name }) => name);
  const inlineInterfaces: Set<string> = new Set();
  runOnlineParser(documentText, (_, state: State) => {
    if (state.name) {
      // gather inline interface definitions
      if (
        state.kind === RuleKinds.INTERFACE_DEF &&
        !schemaInterfaceNames.includes(state.name)
      ) {
        inlineInterfaces.add(state.name);
      }
      // gather the other interfaces the current type/interface definition implements
      // so we can filter them out below
      if (
        state.kind === RuleKinds.NAMED_TYPE &&
        state.prevState?.kind === RuleKinds.IMPLEMENTS
      ) {
        if (typeInfo.interfaceDef) {
          const existingType = typeInfo.interfaceDef
            ?.getInterfaces()
            .find(({ name }) => name === state.name);
          if (existingType) {
            return;
          }
          const type = schema.getType(state.name);
          const interfaceConfig = typeInfo.interfaceDef?.toConfig();
          typeInfo.interfaceDef = new GraphQLInterfaceType({
            ...interfaceConfig,
            interfaces: [
              ...interfaceConfig.interfaces,
              (type as GraphQLInterfaceType) ||
                new GraphQLInterfaceType({ name: state.name, fields: {} }),
            ],
          });
        } else if (typeInfo.objectTypeDef) {
          const existingType = typeInfo.objectTypeDef
            ?.getInterfaces()
            .find(({ name }) => name === state.name);
          if (existingType) {
            return;
          }
          const type = schema.getType(state.name);
          const objectTypeConfig = typeInfo.objectTypeDef?.toConfig();
          typeInfo.objectTypeDef = new GraphQLObjectType({
            ...objectTypeConfig,
            interfaces: [
              ...objectTypeConfig.interfaces,
              (type as GraphQLInterfaceType) ||
                new GraphQLInterfaceType({ name: state.name, fields: {} }),
            ],
          });
        }
      }
    }
  });

  const currentTypeToExtend = typeInfo.interfaceDef || typeInfo.objectTypeDef;

  const siblingInterfaces = currentTypeToExtend?.getInterfaces() || [];
  const siblingInterfaceNames = siblingInterfaces.map(({ name }) => name);

  // TODO: we should be using schema.getPossibleTypes() here, but
  const possibleInterfaces = schemaInterfaces
    .concat(
      [...inlineInterfaces].map(name => ({ name }) as GraphQLInterfaceType),
    )
    .filter(
      ({ name }) =>
        name !== currentTypeToExtend?.name &&
        !siblingInterfaceNames.includes(name),
    );

  return hintList(
    token,
    possibleInterfaces.map(type => {
      const result = {
        label: type.name,
        kind: CompletionItemKind.Interface,
        type,
      } as CompletionItem;
      if (type?.description) {
        result.documentation = type.description;
      }
      // TODO: should we report what an interface implements in CompletionItem.detail?
      // result.detail = 'Interface'
      // const interfaces = type.astNode?.interfaces;
      // if (interfaces && interfaces.length > 0) {
      //   result.detail += ` (implements ${interfaces
      //     .map(i => i.name.value)
      //     .join(' & ')})`;
      // }

      return result;
    }),
  );
}

function getSuggestionsForFragmentTypeConditions(
  token: ContextToken,
  typeInfo: AllTypeInfo,
  schema: GraphQLSchema,
  _kind: 'NamedType' | 'TypeCondition',
): Array<CompletionItem> {
  let possibleTypes: GraphQLType[];
  if (typeInfo.parentType) {
    if (isAbstractType(typeInfo.parentType)) {
      const abstractType = assertAbstractType(typeInfo.parentType);
      // Collect both the possible Object types as well as the interfaces
      // they implement.
      const possibleObjTypes = schema.getPossibleTypes(abstractType);
      const possibleIfaceMap = Object.create(null);
      for (const type of possibleObjTypes) {
        for (const iface of type.getInterfaces()) {
          possibleIfaceMap[iface.name] = iface;
        }
      }
      possibleTypes = possibleObjTypes.concat(objectValues(possibleIfaceMap));
    } else {
      // The parent type is a non-abstract Object type, so the only possible
      // type that can be used is that same type.
      possibleTypes = [typeInfo.parentType];
    }
  } else {
    const typeMap = schema.getTypeMap();
    possibleTypes = objectValues(typeMap).filter(
      type => isCompositeType(type) && !type.name.startsWith('__'),
    );
  }
  return hintList(
    token,
    possibleTypes.map(type => {
      const namedType = getNamedType(type);
      return {
        label: String(type),
        documentation: namedType?.description || '',
        kind: CompletionItemKind.Field,
      };
    }),
  );
}

function getSuggestionsForFragmentSpread(
  token: ContextToken,
  typeInfo: AllTypeInfo,
  schema: GraphQLSchema,
  queryText: string,
  fragmentDefs?: FragmentDefinitionNode[],
): Array<CompletionItem> {
  if (!queryText) {
    return [];
  }
  const typeMap = schema.getTypeMap();
  const defState = getDefinitionState(token.state);
  const fragments = getFragmentDefinitions(queryText);

  if (fragmentDefs && fragmentDefs.length > 0) {
    fragments.push(...fragmentDefs);
  }

  // Filter down to only the fragments which may exist here.
  const relevantFrags = fragments.filter(
    frag =>
      // Only include fragments with known types.
      typeMap[frag.typeCondition.name.value] &&
      // Only include fragments which are not cyclic.
      !(
        defState &&
        defState.kind === RuleKinds.FRAGMENT_DEFINITION &&
        defState.name === frag.name.value
      ) &&
      // Only include fragments which could possibly be spread here.
      isCompositeType(typeInfo.parentType) &&
      isCompositeType(typeMap[frag.typeCondition.name.value]) &&
      doTypesOverlap(
        schema,
        typeInfo.parentType,
        typeMap[frag.typeCondition.name.value] as GraphQLCompositeType,
      ),
  );

  return hintList(
    token,
    relevantFrags.map(frag => ({
      label: frag.name.value,
      detail: String(typeMap[frag.typeCondition.name.value]),
      documentation: `fragment ${frag.name.value} on ${frag.typeCondition.name.value}`,
      kind: CompletionItemKind.Field,
      type: typeMap[frag.typeCondition.name.value],
    })),
  );
}

// TODO: should be using getTypeInfo() for this if we can
const getParentDefinition = (state: State, kind: RuleKind) => {
  if (state.prevState?.kind === kind) {
    return state.prevState;
  }
  if (state.prevState?.prevState?.kind === kind) {
    return state.prevState.prevState;
  }
  if (state.prevState?.prevState?.prevState?.kind === kind) {
    return state.prevState.prevState.prevState;
  }
  if (state.prevState?.prevState?.prevState?.prevState?.kind === kind) {
    return state.prevState.prevState.prevState.prevState;
  }
};

export function getVariableCompletions(
  queryText: string,
  schema: GraphQLSchema,
  token: ContextToken,
): CompletionItem[] {
  let variableName: null | string = null;
  let variableType: GraphQLInputObjectType | undefined | null;
  const definitions: Record<string, any> = Object.create({});
  runOnlineParser(queryText, (_, state: State) => {
    // TODO: gather this as part of `AllTypeInfo`, as I don't think it's optimal to re-run the parser like this
    if (state?.kind === RuleKinds.VARIABLE && state.name) {
      variableName = state.name;
    }
    if (state?.kind === RuleKinds.NAMED_TYPE && variableName) {
      const parentDefinition = getParentDefinition(state, RuleKinds.TYPE);
      if (parentDefinition?.type) {
        variableType = schema.getType(
          parentDefinition?.type,
        ) as GraphQLInputObjectType;
      }
    }

    if (variableName && variableType && !definitions[variableName]) {
      // append `$` if the `token.string` is not already `$`

      definitions[variableName] = {
        detail: variableType.toString(),
        insertText: token.string === '$' ? variableName : '$' + variableName,
        label: variableName, // keep label the same for `codemirror-graphql`
        type: variableType,
        kind: CompletionItemKind.Variable,
      } as CompletionItem;

      variableName = null;
      variableType = null;
    }
  });

  return objectValues(definitions);
}

export function getFragmentDefinitions(
  queryText: string,
): Array<FragmentDefinitionNode> {
  const fragmentDefs: FragmentDefinitionNode[] = [];
  runOnlineParser(queryText, (_, state: State) => {
    if (
      state.kind === RuleKinds.FRAGMENT_DEFINITION &&
      state.name &&
      state.type
    ) {
      fragmentDefs.push({
        kind: RuleKinds.FRAGMENT_DEFINITION,
        name: {
          kind: Kind.NAME,
          value: state.name,
        },

        selectionSet: {
          kind: RuleKinds.SELECTION_SET,
          selections: [],
        },

        typeCondition: {
          kind: RuleKinds.NAMED_TYPE,
          name: {
            kind: Kind.NAME,
            value: state.type,
          },
        },
      });
    }
  });

  return fragmentDefs;
}

function getSuggestionsForVariableDefinition(
  token: ContextToken,
  schema: GraphQLSchema,
  _kind: string,
): Array<CompletionItem> {
  const inputTypeMap = schema.getTypeMap();
  const inputTypes = objectValues(inputTypeMap).filter(isInputType);
  return hintList(
    token,
    // TODO: couldn't get Exclude<> working here
    inputTypes.map((type: GraphQLNamedType) => ({
      label: type.name,
      documentation: type.description!,
      kind: CompletionItemKind.Variable,
    })),
  );
}

function getSuggestionsForDirective(
  token: ContextToken,
  state: State,
  schema: GraphQLSchema,
  _kind: string,
): Array<CompletionItem> {
  if (state.prevState?.kind) {
    const directives = schema
      .getDirectives()
      .filter(directive => canUseDirective(state.prevState, directive));
    return hintList(
      token,
      directives.map(directive => ({
        label: directive.name,
        documentation: directive.description || '',
        kind: CompletionItemKind.Function,
      })),
    );
  }
  return [];
}

export function getTokenAtPosition(
  queryText: string,
  cursor: IPosition,
  offset = 0,
): ContextToken {
  let styleAtCursor = null;
  let stateAtCursor = null;
  let stringAtCursor = null;
  const token = runOnlineParser(queryText, (stream, state, style, index) => {
    if (
      index !== cursor.line ||
      stream.getCurrentPosition() + offset < cursor.character + 1
    ) {
      return;
    }
    styleAtCursor = style;
    stateAtCursor = { ...state };
    stringAtCursor = stream.current();
    return 'BREAK';
  });

  // Return the state/style of parsed token in case those at cursor aren't
  // available.
  return {
    start: token.start,
    end: token.end,
    string: stringAtCursor || token.string,
    state: stateAtCursor || token.state,
    style: styleAtCursor || token.style,
  };
}

/**
 * Provides an utility function to parse a given query text and construct a
 * `token` context object.
 * A token context provides useful information about the token/style that
 * CharacterStream currently possesses, as well as the end state and style
 * of the token.
 */
type callbackFnType = (
  stream: CharacterStream,
  state: State,
  style: string,
  index: number,
) => void | 'BREAK';

export function runOnlineParser(
  queryText: string,
  callback: callbackFnType,
): ContextToken {
  const lines = queryText.split('\n');
  const parser = onlineParser();
  let state = parser.startState();
  let style = '';

  let stream: CharacterStream = new CharacterStream('');

  for (let i = 0; i < lines.length; i++) {
    stream = new CharacterStream(lines[i]);
    while (!stream.eol()) {
      style = parser.token(stream, state);
      const code = callback(stream, state, style, i);
      if (code === 'BREAK') {
        break;
      }
    }

    // Above while loop won't run if there is an empty line.
    // Run the callback one more time to catch this.
    callback(stream, state, style, i);

    if (!state.kind) {
      state = parser.startState();
    }
  }

  return {
    start: stream.getStartOfToken(),
    end: stream.getCurrentPosition(),
    string: stream.current(),
    state,
    style,
  };
}

export function canUseDirective(
  state: State['prevState'],
  directive: GraphQLDirective,
): boolean {
  if (!state?.kind) {
    return false;
  }
  const { kind, prevState } = state;
  const { locations } = directive;
  switch (kind) {
    case RuleKinds.QUERY:
      return locations.includes(DirectiveLocation.QUERY);
    case RuleKinds.MUTATION:
      return locations.includes(DirectiveLocation.MUTATION);
    case RuleKinds.SUBSCRIPTION:
      return locations.includes(DirectiveLocation.SUBSCRIPTION);
    case RuleKinds.FIELD:
    case RuleKinds.ALIASED_FIELD:
      return locations.includes(DirectiveLocation.FIELD);
    case RuleKinds.FRAGMENT_DEFINITION:
      return locations.includes(DirectiveLocation.FRAGMENT_DEFINITION);
    case RuleKinds.FRAGMENT_SPREAD:
      return locations.includes(DirectiveLocation.FRAGMENT_SPREAD);
    case RuleKinds.INLINE_FRAGMENT:
      return locations.includes(DirectiveLocation.INLINE_FRAGMENT);

    // Schema Definitions
    case RuleKinds.SCHEMA_DEF:
      return locations.includes(DirectiveLocation.SCHEMA);
    case RuleKinds.SCALAR_DEF:
      return locations.includes(DirectiveLocation.SCALAR);
    case RuleKinds.OBJECT_TYPE_DEF:
      return locations.includes(DirectiveLocation.OBJECT);
    case RuleKinds.FIELD_DEF:
      return locations.includes(DirectiveLocation.FIELD_DEFINITION);
    case RuleKinds.INTERFACE_DEF:
      return locations.includes(DirectiveLocation.INTERFACE);
    case RuleKinds.UNION_DEF:
      return locations.includes(DirectiveLocation.UNION);
    case RuleKinds.ENUM_DEF:
      return locations.includes(DirectiveLocation.ENUM);
    case RuleKinds.ENUM_VALUE:
      return locations.includes(DirectiveLocation.ENUM_VALUE);
    case RuleKinds.INPUT_DEF:
      return locations.includes(DirectiveLocation.INPUT_OBJECT);
    case RuleKinds.INPUT_VALUE_DEF:
      const prevStateKind = prevState?.kind;
      switch (prevStateKind) {
        case RuleKinds.ARGUMENTS_DEF:
          return locations.includes(DirectiveLocation.ARGUMENT_DEFINITION);
        case RuleKinds.INPUT_DEF:
          return locations.includes(DirectiveLocation.INPUT_FIELD_DEFINITION);
      }
  }

  return false;
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

export enum GraphQLDocumentMode {
  TYPE_SYSTEM = 'TYPE_SYSTEM',
  EXECUTABLE = 'EXECUTABLE',
}

function getDocumentMode(
  documentText: string,
  uri?: string,
): GraphQLDocumentMode {
  if (uri?.endsWith('.graphqls')) {
    return GraphQLDocumentMode.TYPE_SYSTEM;
  }
  return hasTypeSystemDefinitions(documentText)
    ? GraphQLDocumentMode.TYPE_SYSTEM
    : GraphQLDocumentMode.EXECUTABLE;
}

function unwrapType(state: State): State {
  if (
    state.prevState &&
    state.kind &&
    (
      [
        RuleKinds.NAMED_TYPE,
        RuleKinds.LIST_TYPE,
        RuleKinds.TYPE,
        RuleKinds.NON_NULL_TYPE,
      ] as RuleKind[]
    ).includes(state.kind)
  ) {
    return unwrapType(state.prevState);
  }
  return state;
}
