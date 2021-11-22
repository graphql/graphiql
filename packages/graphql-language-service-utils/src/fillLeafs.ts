/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import {
  // getNamedType,
  isLeafType,
  parse,
  print,
  TypeInfo,
  visit,
  GraphQLSchema,
  DocumentNode,
  GraphQLOutputType,
  GraphQLType,
  SelectionSetNode,
  Kind,
  isNamedType,
  GraphQLNamedType,
  // ArgumentNode,
  GraphQLArgument,
  GraphQLField,
  // typeFromAST,
  // ArgumentNode,
  // ValueNode,
} from 'graphql';

import { Maybe } from 'graphql-language-service-types';
import { getFieldDef } from 'graphql/execution/execute';

type Insertion = {
  index: number;
  string: string;
};

export type GetDefaultFieldNamesFn = (type: GraphQLNamedType) => string[];

/**
 * Given a document string which may not be valid due to terminal fields not
 * representing leaf values (Spec Section: "Leaf Field Selections"), and a
 * function which provides reasonable default field names for a given type,
 * this function will attempt to produce a schema which is valid after filling
 * in selection sets for the invalid fields.
 *
 * Note that there is no guarantee that the result will be a valid query, this
 * utility represents a "best effort" which may be useful within IDE tools.
 */
export function fillLeafs(
  schema?: GraphQLSchema | null,
  docString?: string,
  getDefaultFieldNames?: GetDefaultFieldNamesFn,
) {
  const insertions: Insertion[] = [];

  if (!schema || !docString) {
    return { insertions, result: docString };
  }

  let ast: DocumentNode;
  try {
    ast = parse(docString);
  } catch (error) {
    return { insertions, result: docString };
  }

  const fieldNameFn = getDefaultFieldNames || defaultGetDefaultFieldNames;
  const typeInfo = new TypeInfo(schema);
  visit(ast, {
    leave(node) {
      typeInfo.leave(node);
    },
    enter(node) {
      typeInfo.enter(node);
      if (node.kind === 'Field' && !node.selectionSet) {
        const fieldType = typeInfo.getType();

        const selectionSet = buildSelectionSet(
          // @ts-expect-error
          getFieldDef(schema, field.type, node) as GraphQLField<
            null,
            null,
            any
          >,
          isFieldType(fieldType) as GraphQLOutputType,
          fieldNameFn,
          schema,
        );
        if (selectionSet && node.loc) {
          const indent = getIndentation(docString, node.loc.start);
          insertions.push({
            index: node.loc.end,
            string: ' ' + print(selectionSet).replace(/\n/g, '\n' + indent),
          });
        }
      }
    },
  });

  // Apply the insertions, but also return the insertions metadata.
  return {
    insertions,
    result: withInsertions(docString, insertions),
  };
}

// The default function to use for producing the default fields from a type.
// This function first looks for some common patterns, and falls back to
// including all leaf-type fields.
export function defaultGetDefaultFieldNames(type: GraphQLType) {
  // If this type cannot access fields, then return an empty set.
  // if (!type.getFields) {
  if (!('getFields' in type)) {
    return [];
  }

  const fields = type.getFields();
  // Include all leaf-type fields.
  const leafFieldNames: Array<string> = [];
  // Is there an `id` field?
  // if (fields.id) {
  //   leafFieldNames.push('id');
  // }

  // // // Is there an `edges` field?
  // // if (fields.edges) {
  // //   leafFieldNames.push('edges');
  // // }

  // // // Is there an `node` field?
  // // if (fields.node) {
  // //   leafFieldNames.push('node');
  // // }

  Object.keys(fields).forEach(fieldName => {
    if (isLeafType(fields[fieldName].type)) {
      leafFieldNames.push(fieldName);
    }
  });
  return leafFieldNames;
}

// Given a GraphQL type, and a function which produces field names, recursively
// generate a SelectionSet which includes default fields.
export function buildSelectionSet(
  field: GraphQLField<null, null>,
  _type: GraphQLOutputType,
  getDefaultFieldNames: GetDefaultFieldNamesFn,
  schema?: GraphQLSchema,
): SelectionSetNode | undefined {
  const { type } = field;
  // Unknown types and leaf types do not have selection sets.
  if (!type || isLeafType(type)) {
    return;
  }
  // Unwrap any non-null or list types.
  const namedType = isNamedType(type)
    ? schema?.getType(type?.name)
    : // @ts-ignore
      schema?.getType(type?.ofType?.name);

  if (!namedType) {
    return;
  }

  // Get an array of field names to use.
  const fieldNames = getDefaultFieldNames(namedType);

  // If there are no field names to use, return no selection set.
  if (
    !Array.isArray(fieldNames) ||
    fieldNames.length === 0 ||
    !('getFields' in namedType)
  ) {
    return;
  }
  // const args = field.args?.map((arg: GraphQLArgument) => {
  //   return {
  //     name: { kind: 'Name', value: arg.name },
  //     kind: 'Argument',
  //     value: { kind: 'IntValue', value: "50" },
  //   };
  // });

  // Build a selection set of each field, calling buildSelectionSet recursively.
  return {
    kind: Kind.SELECTION_SET,
    selections: fieldNames.map(fieldName => {
      const fieldDef = namedType?.getFields()[fieldName];

      const fieldType = fieldDef ? fieldDef.type : null;

      // console.log(isFieldType(fieldDef).args)
      return {
        kind: Kind.FIELD,
        name: {
          kind: Kind.NAME,
          value: fieldName,
        },
        directives: [],
        // @ts-expect-error
        arguments: fieldDef?.args?.map((arg: GraphQLArgument) => {
          return {
            name: { kind: 'Name', value: arg.name },
            kind: 'Argument',
            value: { kind: 'IntValue', value: '50' },
          };
        }),

        // arguments: fieldDef.args?.map((arg) => {
        //   const argAst: ArgumentNode  = {
        //     kind: Kind.ARGUMENT,
        //     // @ts-expect-error
        //     value: { value: arg?.defaultValue ?? "$1", kind: Kind.STRING },
        //     name:  { kind: Kind.NAME, value: arg.name }
        //   }
        //   console.log(argAst, arg)

        //   return argAst
        // }),
        // we can use as here, because we already know that fieldType
        // comes from an origin parameter
        selectionSet: buildSelectionSet(
          field,
          fieldType as GraphQLOutputType,
          getDefaultFieldNames,
        ),
      };
    }),
  };
}

// Given an initial string, and a list of "insertion" { index, string } objects,
// return a new string with these insertions applied.
function withInsertions(initial: string, insertions: Insertion[]) {
  if (insertions.length === 0) {
    return initial;
  }
  let edited = '';
  let prevIndex = 0;
  insertions.forEach(({ index, string }) => {
    edited += initial.slice(prevIndex, index) + string;
    prevIndex = index;
  });
  edited += initial.slice(prevIndex);
  return edited;
}

// Given a string and an index, look backwards to find the string of whitespace
// following the next previous line break.
function getIndentation(str: string, index: number) {
  let indentStart = index;
  let indentEnd = index;
  while (indentStart) {
    const c = str.charCodeAt(indentStart - 1);
    // line break
    if (c === 10 || c === 13 || c === 0x2028 || c === 0x2029) {
      break;
    }
    indentStart--;
    // not white space
    if (c !== 9 && c !== 11 && c !== 12 && c !== 32 && c !== 160) {
      indentEnd = indentStart;
    }
  }
  return str.substring(indentStart, indentEnd);
}

function isFieldType(
  fieldType: Maybe<GraphQLOutputType>,
): GraphQLOutputType | void {
  if (fieldType) {
    return fieldType;
  }
}
