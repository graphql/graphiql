import { getNamedType } from 'graphql';
import type {
  GraphQLEnumType,
  GraphQLNamedType,
  GraphQLField,
  GraphQLArgument,
  GraphQLDirective,
  GraphQLSchema,
  GraphQLEnumValue,
  GraphQLInputFieldMap,
  GraphQLInputType,
  GraphQLType,
} from 'graphql';
import type { Maybe } from 'graphql/jsutils/Maybe';

/**
 * Copied from packages/codemirror-graphql/src/jump.ts
 */
export function getSchemaReference(kind: string, typeInfo: any) {
  if (
    (kind === 'Field' && typeInfo.fieldDef) ||
    (kind === 'AliasedField' && typeInfo.fieldDef)
  ) {
    return getFieldReference(typeInfo);
  }
  if (kind === 'Directive' && typeInfo.directiveDef) {
    return getDirectiveReference(typeInfo);
  }
  if (kind === 'Argument' && typeInfo.argDef) {
    return getArgumentReference(typeInfo);
  }
  if (kind === 'EnumValue' && typeInfo.enumValue) {
    return getEnumValueReference(typeInfo);
  }
  if (kind === 'NamedType' && typeInfo.type) {
    return getTypeReference(typeInfo);
  }
}

function getArgumentReference(typeInfo: any): ArgumentReference {
  return typeInfo.directiveDef
    ? {
        kind: 'Argument',
        schema: typeInfo.schema,
        argument: typeInfo.argDef,
        directive: typeInfo.directiveDef,
      }
    : {
        kind: 'Argument',
        schema: typeInfo.schema,
        argument: typeInfo.argDef,
        field: typeInfo.fieldDef,
        type: isMetaField(typeInfo.fieldDef) ? null : typeInfo.parentType,
      };
}

function getDirectiveReference(typeInfo: any): DirectiveReference {
  return {
    kind: 'Directive',
    schema: typeInfo.schema,
    directive: typeInfo.directiveDef,
  };
}

function getFieldReference(typeInfo: any): FieldReference {
  return {
    kind: 'Field',
    schema: typeInfo.schema,
    field: typeInfo.fieldDef,
    type: isMetaField(typeInfo.fieldDef) ? null : typeInfo.parentType,
  };
}

// Note: for reusability, getTypeReference can produce a reference to any type,
// though it defaults to the current type.
function getTypeReference(
  typeInfo: any,
  type?: Maybe<GraphQLNamedType>,
): TypeReference {
  return {
    kind: 'Type',
    schema: typeInfo.schema,
    type: type || typeInfo.type,
  };
}

function getEnumValueReference(typeInfo: TypeInfo): EnumValueReference {
  return {
    kind: 'EnumValue',
    value: typeInfo.enumValue || undefined,
    type: typeInfo.inputType
      ? (getNamedType(typeInfo.inputType) as GraphQLEnumType)
      : undefined,
  };
}

function isMetaField(fieldDef: GraphQLField<unknown, unknown>) {
  return fieldDef.name.slice(0, 2) === '__';
}

type ArgumentReference = {
  kind: 'Argument';
  argument: GraphQLArgument;
  field?: GraphQLField<unknown, unknown>;
  type?: GraphQLNamedType;
  directive?: GraphQLDirective;
  schema?: GraphQLSchema;
};

type DirectiveReference = {
  kind: 'Directive';
  directive: GraphQLDirective;
  schema?: GraphQLSchema;
};

type EnumValueReference = {
  kind: 'EnumValue';
  value?: GraphQLEnumValue;
  type?: GraphQLEnumType;
  schema?: GraphQLSchema;
};

type FieldReference = {
  kind: 'Field';
  field: GraphQLField<unknown, unknown>;
  type: Maybe<GraphQLNamedType>;
  schema?: GraphQLSchema;
};

type TypeReference = {
  kind: 'Type';
  type: GraphQLNamedType;
  schema?: GraphQLSchema;
};

interface TypeInfo {
  schema: GraphQLSchema;
  type?: Maybe<GraphQLType>;
  parentType?: Maybe<GraphQLType>;
  inputType?: Maybe<GraphQLInputType>;
  directiveDef?: Maybe<GraphQLDirective>;
  fieldDef?: Maybe<GraphQLField<unknown, unknown>>;
  argDef?: Maybe<GraphQLArgument>;
  argDefs?: Maybe<GraphQLArgument[]>;
  enumValue?: Maybe<GraphQLEnumValue>;
  objectFieldDefs?: Maybe<GraphQLInputFieldMap>;
}
