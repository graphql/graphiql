import {
  getNamedType,
  isInterfaceType,
  isObjectType,
  isUnionType,
  type DocumentNode,
  type GraphQLObjectType,
  type GraphQLSchema,
} from 'graphql';
import { type FC, useState } from 'react';
import {
  addInlineFragment,
  getFieldArgValues,
  getFieldArgVariables,
  isFieldSelected,
  isInlineFragmentPresent,
  removeInlineFragment,
  type ArgValue,
} from '../lib/document-mutator';
import { FieldRow } from './field-row';

type FieldTreeProps = {
  type: GraphQLObjectType;
  path: string[];
  doc: DocumentNode;
  schema?: GraphQLSchema;
  onToggle: (path: string[]) => void;
  onSetArg: (path: string[], argName: string, value: ArgValue) => void;
  onPromoteArg?: (path: string[], argName: string, suggestedName: string) => void;
  onDemoteArg?: (path: string[], varName: string) => void;
  onAddInlineFragment?: (path: string[], typeName: string) => void;
  onRemoveInlineFragment?: (path: string[], typeName: string) => void;
};

export const FieldTree: FC<FieldTreeProps> = ({
  type,
  path,
  doc,
  schema,
  onToggle,
  onSetArg,
  onPromoteArg,
  onDemoteArg,
  onAddInlineFragment,
  onRemoveInlineFragment,
}) => {
  const fields = Object.values(type.getFields());

  return (
    <div className="graphiql-qb-field-tree">
      {fields.map(field => {
        const fieldPath = [...path, field.name];
        const namedType = getNamedType(field.type);
        const isObject = isObjectType(namedType);
        const isAbstract =
          namedType !== undefined &&
          (isUnionType(namedType) || isInterfaceType(namedType));
        const selected = isFieldSelected(doc, fieldPath);

        return (
          <FieldTreeNode
            key={field.name}
            field={field}
            path={path}
            doc={doc}
            schema={schema}
            isObject={isObject}
            isAbstract={isAbstract}
            selected={selected}
            objectType={isObject ? (namedType as GraphQLObjectType) : undefined}
            onToggle={onToggle}
            onSetArg={onSetArg}
            onPromoteArg={onPromoteArg}
            onDemoteArg={onDemoteArg}
            onAddInlineFragment={onAddInlineFragment}
            onRemoveInlineFragment={onRemoveInlineFragment}
          />
        );
      })}
    </div>
  );
};

type FieldTreeNodeProps = {
  field: ReturnType<GraphQLObjectType['getFields']>[string];
  path: string[];
  doc: DocumentNode;
  schema?: GraphQLSchema;
  isObject: boolean;
  isAbstract: boolean;
  selected: boolean;
  objectType: GraphQLObjectType | undefined;
  onToggle: (path: string[]) => void;
  onSetArg: (path: string[], argName: string, value: ArgValue) => void;
  onPromoteArg?: (path: string[], argName: string, suggestedName: string) => void;
  onDemoteArg?: (path: string[], varName: string) => void;
  onAddInlineFragment?: (path: string[], typeName: string) => void;
  onRemoveInlineFragment?: (path: string[], typeName: string) => void;
};

const FieldTreeNode: FC<FieldTreeNodeProps> = ({
  field,
  path,
  doc,
  schema,
  isObject,
  isAbstract,
  selected,
  objectType,
  onToggle,
  onSetArg,
  onPromoteArg,
  onDemoteArg,
  onAddInlineFragment,
  onRemoveInlineFragment,
}) => {
  const [expanded, setExpanded] = useState(false);
  const fullPath = [...path, field.name];
  const argValues = getFieldArgValues(doc, fullPath);
  const argVariables = getFieldArgVariables(doc, fullPath);

  function handleExpand() {
    setExpanded(prev => !prev);
  }

  const hasChildren = isObject || isAbstract;

  return (
    <div className="graphiql-qb-field-node">
      <FieldRow
        field={field}
        path={path}
        selected={selected}
        hasChildren={hasChildren}
        expanded={expanded}
        argValues={argValues}
        argVariables={argVariables}
        onToggle={onToggle}
        onExpand={handleExpand}
        onSetArg={onSetArg}
        onPromoteArg={onPromoteArg}
        onDemoteArg={onDemoteArg}
      />
      {isObject && expanded && objectType && (
        <FieldTree
          type={objectType}
          path={fullPath}
          doc={doc}
          schema={schema}
          onToggle={onToggle}
          onSetArg={onSetArg}
          onPromoteArg={onPromoteArg}
          onDemoteArg={onDemoteArg}
          onAddInlineFragment={onAddInlineFragment}
          onRemoveInlineFragment={onRemoveInlineFragment}
        />
      )}
      {isAbstract && expanded && schema && (
        <TypeConditionSelector
          fieldPath={fullPath}
          doc={doc}
          schema={schema}
          field={field}
          onToggle={onToggle}
          onSetArg={onSetArg}
          onPromoteArg={onPromoteArg}
          onDemoteArg={onDemoteArg}
          onAddInlineFragment={onAddInlineFragment}
          onRemoveInlineFragment={onRemoveInlineFragment}
        />
      )}
    </div>
  );
};

type TypeConditionSelectorProps = {
  fieldPath: string[];
  doc: DocumentNode;
  schema: GraphQLSchema;
  field: ReturnType<GraphQLObjectType['getFields']>[string];
  onToggle: (path: string[]) => void;
  onSetArg: (path: string[], argName: string, value: ArgValue) => void;
  onPromoteArg?: (path: string[], argName: string, suggestedName: string) => void;
  onDemoteArg?: (path: string[], varName: string) => void;
  onAddInlineFragment?: (path: string[], typeName: string) => void;
  onRemoveInlineFragment?: (path: string[], typeName: string) => void;
};

const TypeConditionSelector: FC<TypeConditionSelectorProps> = ({
  fieldPath,
  doc,
  schema,
  field,
  onToggle,
  onSetArg,
  onPromoteArg,
  onDemoteArg,
  onAddInlineFragment,
  onRemoveInlineFragment,
}) => {
  const namedType = getNamedType(field.type);
  if (!namedType || (!isUnionType(namedType) && !isInterfaceType(namedType))) {
    return null;
  }

  const possibleTypes = schema.getPossibleTypes(namedType);

  return (
    <div className="graphiql-qb-type-condition" role="group" aria-label={`Inline fragments for ${field.name}`}>
      {possibleTypes.map(concreteType => {
        const isSelected = isInlineFragmentPresent(doc, fieldPath, concreteType.name);

        return (
          <TypeConditionEntry
            key={concreteType.name}
            fieldPath={fieldPath}
            typeName={concreteType.name}
            concreteType={concreteType}
            isSelected={isSelected}
            doc={doc}
            schema={schema}
            onToggle={onToggle}
            onSetArg={onSetArg}
            onPromoteArg={onPromoteArg}
            onDemoteArg={onDemoteArg}
            onAddInlineFragment={onAddInlineFragment}
            onRemoveInlineFragment={onRemoveInlineFragment}
          />
        );
      })}
    </div>
  );
};

type TypeConditionEntryProps = {
  fieldPath: string[];
  typeName: string;
  concreteType: GraphQLObjectType;
  isSelected: boolean;
  doc: DocumentNode;
  schema: GraphQLSchema;
  onToggle: (path: string[]) => void;
  onSetArg: (path: string[], argName: string, value: ArgValue) => void;
  onPromoteArg?: (path: string[], argName: string, suggestedName: string) => void;
  onDemoteArg?: (path: string[], varName: string) => void;
  onAddInlineFragment?: (path: string[], typeName: string) => void;
  onRemoveInlineFragment?: (path: string[], typeName: string) => void;
};

const TypeConditionEntry: FC<TypeConditionEntryProps> = ({
  fieldPath,
  typeName,
  concreteType,
  isSelected,
  doc,
  schema,
  onToggle,
  onSetArg,
  onPromoteArg,
  onDemoteArg,
  onAddInlineFragment,
  onRemoveInlineFragment,
}) => {
  const [expanded, setExpanded] = useState(false);

  function handleToggle() {
    if (isSelected) {
      onRemoveInlineFragment?.(fieldPath, typeName);
    } else {
      onAddInlineFragment?.(fieldPath, typeName);
    }
  }

  return (
    <div className="graphiql-qb-inline-fragment">
      <div className="graphiql-qb-inline-fragment-header">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleToggle}
          aria-label={`Toggle ... on ${typeName}`}
          className="graphiql-qb-field-checkbox"
        />
        <button
          type="button"
          className="graphiql-qb-expand-btn"
          onClick={() => setExpanded(prev => !prev)}
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} ... on ${typeName}`}
        >
          {expanded ? '▾' : '▸'}
        </button>
        <span className="graphiql-qb-inline-fragment-label">
          <span className="graphiql-qb-spread">...</span>
          {' on '}
          <span className="graphiql-qb-type-name">{typeName}</span>
        </span>
      </div>
      {expanded && (
        <FieldTree
          type={concreteType}
          path={fieldPath}
          doc={doc}
          schema={schema}
          onToggle={onToggle}
          onSetArg={onSetArg}
          onPromoteArg={onPromoteArg}
          onDemoteArg={onDemoteArg}
          onAddInlineFragment={onAddInlineFragment}
          onRemoveInlineFragment={onRemoveInlineFragment}
        />
      )}
    </div>
  );
};
