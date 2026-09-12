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
  // isNonNullType,
  isScalarType,
  isObjectType,
  isUnionType,
  isEnumType,
  isInputObjectType,
  isOutputType,
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLInputObjectType,
  SchemaMetaFieldDef,
  TypeMetaFieldDef,
  TypeNameMetaFieldDef,
  assertAbstractType,
  doTypesOverlap,
  getNamedType,
  getNullableType,
  isListType,
  isAbstractType,
  isCompositeType,
  isInputType,
  visit,
} from 'graphql';

import {
  CompletionItem,
  AllTypeInfo,
  IPosition,
  CompletionItemKind,
  GraphQLLanguageServiceOptions,
  InsertTextFormat,
} from '../types';

import type {
  ContextToken,
  State,
  RuleKind,
  ContextTokenForCodeMirror,
} from '../parser';
import {
  getTypeInfo,
  runOnlineParser,
  RuleKinds,
  getContextAtPosition,
  getDefinitionState,
  GraphQLDocumentMode,
  parseDocument,
} from '../parser';
import {
  hintList,
  objectValues,
  getInputInsertText,
  getFieldInsertText,
  getInsertText,
} from './autocompleteUtils';

import { InsertTextMode } from 'vscode-languageserver-types';
import { getFragmentDefinitions } from './getFragmentDefinitions';

export { runOnlineParser, getTypeInfo };

export const SuggestionCommand = {
  command: 'editor.action.triggerSuggest',
  title: 'Suggestions',
};

const collectFragmentDefs = (
  op: string | undefined,
  options?: GraphQLLanguageServiceOptions,
) => {
  const externalFragments: FragmentDefinitionNode[] = [];
  if (op) {
    try {
      visit(parseDocument(op, options), {
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

export type AutocompleteSuggestionOptions = GraphQLLanguageServiceOptions & {
  /**
   * EXPERIMENTAL: Automatically fill required leaf nodes recursively
   * upon triggering code completion events.
   *
   *
   * - [x] fills required nodes
   * - [x] automatically expands relay-style node/edge fields
   * - [ ] automatically jumps to first required argument field
   *      - then, continues to prompt for required argument fields
   *      - (fixing this will make it non-experimental)
   *      - when it runs out of arguments, or you choose `{` as a completion option
   *        that appears when all required arguments are supplied, the argument
   *        selection closes `)` and the leaf field expands again `{ \n| }`
   */
  fillLeafsOnComplete?: boolean;
  uri?: string;
  mode?: GraphQLDocumentMode;
};

type InternalAutocompleteOptions = AutocompleteSuggestionOptions & {
  schema?: GraphQLSchema;
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
  } as InternalAutocompleteOptions;
  const fragmentDefinitions = getFragmentDefinitions(queryText, options);
  const providedFragmentDefinitions = Array.isArray(fragmentDefs)
    ? fragmentDefs
    : collectFragmentDefs(fragmentDefs, options);
  for (const definition of providedFragmentDefinitions) {
    if (
      !fragmentDefinitions.some(
        existing => existing.name.value === definition.name.value,
      )
    ) {
      fragmentDefinitions.push(definition);
    }
  }

  const context = getContextAtPosition(
    queryText,
    cursor,
    schema,
    contextToken,
    { ...options, fragmentDefinitions },
    1,
  );
  if (!context) {
    return [];
  }
  const { state, typeInfo, mode, token } = context;

  const { kind, step, prevState } = state;

  // Definition kinds
  if (kind === RuleKinds.DOCUMENT) {
    if (mode === GraphQLDocumentMode.TYPE_SYSTEM) {
      return getSuggestionsForTypeSystemDefinitions(token);
    }
    if (mode === GraphQLDocumentMode.EXECUTABLE) {
      return getSuggestionsForExecutableDefinitions(token);
    }
    return getSuggestionsForUnknownDocumentMode(token);
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
    kind === RuleKinds.FRAGMENT_ARGUMENTS ||
    ((kind === RuleKinds.ARGUMENT || kind === RuleKinds.FRAGMENT_ARGUMENT) &&
      step === 0)
  ) {
    const { argDefs } = typeInfo;
    if (argDefs) {
      return hintList(
        token,
        argDefs.map(
          (argDef): CompletionItem => ({
            label: argDef.name,
            insertText: getInputInsertText(argDef.name + ': ', argDef.type),
            insertTextMode: InsertTextMode.adjustIndentation,
            insertTextFormat: InsertTextFormat.Snippet,
            command: SuggestionCommand,
            labelDetails: {
              detail: ' ' + String(argDef.type),
            },
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
        documentation: field?.description ?? undefined,
        kind: completionKind,
        type: field.type,
        insertText: getInputInsertText(field.name + ': ', field.type),
        insertTextMode: InsertTextMode.adjustIndentation,
        insertTextFormat: InsertTextFormat.Snippet,
        command: SuggestionCommand,
      })),
    );
  }

  // Input values: Enum and Boolean
  if (
    kind === RuleKinds.ENUM_VALUE ||
    (kind === RuleKinds.LIST_VALUE && step === 1) ||
    (kind === RuleKinds.OBJECT_FIELD && step === 2) ||
    ((kind === RuleKinds.ARGUMENT || kind === RuleKinds.FRAGMENT_ARGUMENT) &&
      step === 2)
  ) {
    return getSuggestionsForInputValues(token, typeInfo, queryText, schema);
  }
  // complete for all variables available in the query scoped to this
  if (kind === RuleKinds.VARIABLE && step === 1) {
    const namedInputType = getNamedType(typeInfo.inputType!);
    const variableDefinitions = getVariableCompletions(
      queryText,
      schema,
      token,
      options,
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
      fragmentDefinitions,
    );
  }

  const unwrappedState = unwrapType(state);

  if (unwrappedState.kind === RuleKinds.FIELD_DEF) {
    return hintList(
      token,
      Object.values(schema.getTypeMap())
        .filter(type => isOutputType(type) && !type.name.startsWith('__'))
        .map(type => ({
          label: type.name,
          kind: CompletionItemKind.Function,
          insertText: options?.fillLeafsOnComplete
            ? type.name + '\n'
            : type.name,
          insertTextMode: InsertTextMode.adjustIndentation,
        })),
    );
  }
  if (unwrappedState.kind === RuleKinds.INPUT_VALUE_DEF && step === 2) {
    return hintList(
      token,
      Object.values(schema.getTypeMap())
        .filter(type => isInputType(type) && !type.name.startsWith('__'))
        .map(type => ({
          label: type.name,
          kind: CompletionItemKind.Function,
          insertText: options?.fillLeafsOnComplete
            ? type.name + '\n$1'
            : type.name,
          insertTextMode: InsertTextMode.adjustIndentation,
          insertTextFormat: InsertTextFormat.Snippet,
        })),
    );
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
  if (kind === RuleKinds.DIRECTIVE_DEF) {
    return getSuggestionsForDirectiveArguments(token, state, schema, kind);
  }

  return [];
}

const typeSystemCompletionItems: CompletionItem[] = [
  { label: 'type', kind: CompletionItemKind.Function },
  { label: 'interface', kind: CompletionItemKind.Function },
  { label: 'union', kind: CompletionItemKind.Function },
  { label: 'input', kind: CompletionItemKind.Function },
  { label: 'scalar', kind: CompletionItemKind.Function },
  { label: 'schema', kind: CompletionItemKind.Function },
];

const executableCompletionItems: CompletionItem[] = [
  { label: 'query', kind: CompletionItemKind.Function },
  { label: 'mutation', kind: CompletionItemKind.Function },
  { label: 'subscription', kind: CompletionItemKind.Function },
  { label: 'fragment', kind: CompletionItemKind.Function },
  { label: '{', kind: CompletionItemKind.Constructor },
];

// Helper functions to get suggestions for each kinds
function getSuggestionsForTypeSystemDefinitions(
  token: ContextToken,
): CompletionItem[] {
  return hintList(token, [
    { label: 'extend', kind: CompletionItemKind.Function },
    ...typeSystemCompletionItems,
  ]);
}

function getSuggestionsForExecutableDefinitions(
  token: ContextToken,
): CompletionItem[] {
  return hintList(token, executableCompletionItems);
}

function getSuggestionsForUnknownDocumentMode(
  token: ContextToken,
): CompletionItem[] {
  return hintList(token, [
    { label: 'extend', kind: CompletionItemKind.Function },
    ...executableCompletionItems,
    ...typeSystemCompletionItems,
  ]);
}

function getSuggestionsForExtensionDefinitions(
  token: ContextToken,
): CompletionItem[] {
  return hintList(token, typeSystemCompletionItems);
}

function getSuggestionsForFieldNames(
  token: ContextToken,
  typeInfo: AllTypeInfo,
  options?: InternalAutocompleteOptions,
): CompletionItem[] {
  if (typeInfo.parentType) {
    const { parentType } = typeInfo;
    // const { parentType, fieldDef, argDefs } = typeInfo;
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
          labelDetails: {
            detail: ' ' + field.type.toString(),
          },

          type: field.type,
        };
        if (options?.fillLeafsOnComplete) {
          // const hasArgs =
          //   // token.state.needsAdvance &&
          //   // @ts-expect-error
          //   parentType?._fields[field?.name];

          suggestion.insertText = getFieldInsertText(field);

          // oxlint-disable-next-line eslint-js/logical-assignment-operators
          if (!suggestion.insertText) {
            suggestion.insertText = getInsertText(
              field.name,
              field.type,
              // if we are replacing a field with arguments, we don't want the extra line
              field.name + (token.state.needsAdvance ? '' : '\n'),
            );
          }

          if (suggestion.insertText) {
            suggestion.insertTextFormat = InsertTextFormat.Snippet;
            suggestion.insertTextMode = InsertTextMode.adjustIndentation;
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

  // When the value position expects a list (e.g. `[Episode]`), a bare literal
  // like `JEDI` is invalid — it must be wrapped as `[JEDI]`. The online parser
  // unwraps one list level each time the cursor moves inside a list literal
  // (`[ | ]`), so the number of list wrappers still present here is exactly how
  // many brackets we need to add (handles nested lists like `[[Episode]]` too).
  // Variable completions ($var) reference the whole list and must not be wrapped.
  let listDepth = 0;
  let unwrapped: GraphQLType | null | undefined = getNullableType(
    typeInfo.inputType,
  );
  while (unwrapped && isListType(unwrapped)) {
    listDepth++;
    unwrapped = getNullableType(unwrapped.ofType);
  }
  const wrap = (literal: string): string | undefined =>
    listDepth > 0
      ? '['.repeat(listDepth) + literal + ']'.repeat(listDepth)
      : undefined;

  const queryVariables: CompletionItem[] = getVariableCompletions(
    queryText,
    schema,
    token,
  ).filter(v => v.detail === namedInputType?.name);

  if (namedInputType instanceof GraphQLEnumType) {
    const values = namedInputType.getValues();
    return hintList(
      token,
      values
        .map<CompletionItem>((value: GraphQLEnumValue) => ({
          label: value.name,
          insertText: wrap(value.name),
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
          insertText: wrap('true'),
          detail: String(GraphQLBoolean),
          documentation: 'Not false.',
          kind: CompletionItemKind.Variable,
          type: GraphQLBoolean,
        },
        {
          label: 'false',
          insertText: wrap('false'),
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
        documentation: (namedType?.description as string | undefined) || '',
        kind: CompletionItemKind.Field,
      };
    }),
  );
}

function getSuggestionsForFragmentSpread(
  token: ContextToken,
  typeInfo: AllTypeInfo,
  schema: GraphQLSchema,
  fragmentDefinitions: ReadonlyArray<FragmentDefinitionNode>,
): Array<CompletionItem> {
  const typeMap = schema.getTypeMap();
  const defState = getDefinitionState(token.state);

  // Filter down to only the fragments which may exist here.
  const relevantFrags = fragmentDefinitions.filter(
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
      labelDetails: {
        detail: `fragment ${frag.name.value} on ${frag.typeCondition.name.value}`,
      },
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

function getDefinitionKey(state: State): string | undefined {
  const definition = getDefinitionState(state);
  return definition?.kind
    ? `${definition.kind}:${definition.name ?? ''}`
    : undefined;
}

function stateContains(state: State, kind: RuleKind): boolean {
  let current: State | null | undefined = state;
  while (current?.kind) {
    if (current.kind === kind) {
      return true;
    }
    current = current.prevState;
  }
  return false;
}

export function getVariableCompletions(
  queryText: string,
  schema: GraphQLSchema,
  token: ContextToken,
  options?: GraphQLLanguageServiceOptions,
): CompletionItem[] {
  let variableName: null | string = null;
  let variableScope: string | undefined;
  let variableType: GraphQLInputObjectType | undefined | null;
  const definitionsByScope = new Map<string, Map<string, CompletionItem>>();
  const fragmentSpreadsByScope = new Map<string, Set<string>>();
  const operationScopes = new Set<string>();

  runOnlineParser(
    queryText,
    (_, state: State) => {
      const scope = getDefinitionKey(state);
      const definition = getDefinitionState(state);
      if (!scope || !definition) {
        return;
      }

      if (
        definition.kind === RuleKinds.QUERY ||
        definition.kind === RuleKinds.MUTATION ||
        definition.kind === RuleKinds.SUBSCRIPTION ||
        definition.kind === RuleKinds.SHORT_QUERY
      ) {
        operationScopes.add(scope);
      }

      if (state.kind === RuleKinds.FRAGMENT_SPREAD && state.name) {
        const spreads = fragmentSpreadsByScope.get(scope) ?? new Set<string>();
        spreads.add(state.name);
        fragmentSpreadsByScope.set(scope, spreads);
      }

      if (
        state.kind === RuleKinds.VARIABLE &&
        state.name &&
        stateContains(state, RuleKinds.VARIABLE_DEFINITION)
      ) {
        variableName = state.name;
        variableScope = scope;
      }
      if (
        state.kind === RuleKinds.NAMED_TYPE &&
        variableName &&
        variableScope === scope
      ) {
        const parentDefinition = getParentDefinition(state, RuleKinds.TYPE);
        if (parentDefinition?.type) {
          variableType = schema.getType(
            parentDefinition.type,
          ) as GraphQLInputObjectType;
        }
      }

      if (variableName && variableType && variableScope === scope) {
        const definitions =
          definitionsByScope.get(scope) ?? new Map<string, CompletionItem>();
        if (!definitions.has(variableName)) {
          const replaceString =
            token.string === '$' || token.state.kind === RuleKinds.VARIABLE
              ? variableName
              : '$' + variableName;
          definitions.set(variableName, {
            detail: variableType.toString(),
            insertText: replaceString,
            label: '$' + variableName,
            rawInsert: replaceString,
            type: variableType,
            kind: CompletionItemKind.Variable,
          } as CompletionItem);
          definitionsByScope.set(scope, definitions);
        }

        variableName = null;
        variableScope = undefined;
        variableType = null;
      }
    },
    options,
  );

  const currentDefinition = getDefinitionState(token.state);
  const currentScope = getDefinitionKey(token.state);
  if (!currentDefinition || !currentScope) {
    return [];
  }

  const visibleDefinitions = new Map(
    definitionsByScope.get(currentScope) ?? [],
  );
  if (currentDefinition.kind === RuleKinds.FRAGMENT_DEFINITION) {
    const reachesFragment = (
      scope: string,
      fragmentName: string,
      visited = new Set<string>(),
    ): boolean => {
      if (visited.has(scope)) {
        return false;
      }
      visited.add(scope);
      const spreads = fragmentSpreadsByScope.get(scope);
      if (spreads?.has(fragmentName)) {
        return true;
      }
      return [...(spreads ?? [])].some(spreadName =>
        reachesFragment(
          `${RuleKinds.FRAGMENT_DEFINITION}:${spreadName}`,
          fragmentName,
          visited,
        ),
      );
    };

    for (const operationScope of operationScopes) {
      if (
        currentDefinition.name &&
        reachesFragment(operationScope, currentDefinition.name)
      ) {
        for (const [name, definition] of definitionsByScope.get(
          operationScope,
        ) ?? []) {
          // Fragment variables shadow operation variables with the same name.
          if (!visibleDefinitions.has(name)) {
            visibleDefinitions.set(name, definition);
          }
        }
      }
    }
  }

  return [...visibleDefinitions.values()];
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
      documentation: type?.description || '',
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
        documentation: directive?.description || '',
        kind: CompletionItemKind.Function,
      })),
    );
  }
  return [];
}

// I thought this added functionality somewhere, but I couldn't write any tests
// to execute it. I think it's handled as Arguments
function getSuggestionsForDirectiveArguments(
  token: ContextToken,
  state: State,
  schema: GraphQLSchema,
  _kind: string,
): Array<CompletionItem> {
  const directive = schema.getDirectives().find(d => d.name === state.name);
  return hintList(
    token,
    directive?.args.map(arg => ({
      label: arg.name,
      documentation: arg.description || '',
      kind: CompletionItemKind.Field,
    })) || [],
  );
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
