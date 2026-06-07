import {
  getNamedType,
  isObjectType,
  type DocumentNode,
  type GraphQLObjectType,
} from 'graphql';
import { type FC, useState } from 'react';
import { getFieldArgValues, getFieldArgVariables, isFieldSelected } from '../lib/document-mutator';
import { FieldRow } from './field-row';

type FieldTreeProps = {
  type: GraphQLObjectType;
  path: string[];
  doc: DocumentNode;
  onToggle: (path: string[]) => void;
  onSetArg: (path: string[], argName: string, value: string) => void;
  onPromoteArg?: (path: string[], argName: string, suggestedName: string) => void;
  onDemoteArg?: (path: string[], varName: string) => void;
};

export const FieldTree: FC<FieldTreeProps> = ({
  type,
  path,
  doc,
  onToggle,
  onSetArg,
  onPromoteArg,
  onDemoteArg,
}) => {
  const fields = Object.values(type.getFields());

  return (
    <div className="graphiql-qb-field-tree">
      {fields.map(field => {
        const fieldPath = [...path, field.name];
        const namedType = getNamedType(field.type);
        const isObject = isObjectType(namedType);
        const selected = isFieldSelected(doc, fieldPath);

        return (
          <FieldTreeNode
            key={field.name}
            field={field}
            path={path}
            doc={doc}
            isObject={isObject}
            selected={selected}
            objectType={isObject ? (namedType as GraphQLObjectType) : undefined}
            onToggle={onToggle}
            onSetArg={onSetArg}
            onPromoteArg={onPromoteArg}
            onDemoteArg={onDemoteArg}
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
  isObject: boolean;
  selected: boolean;
  objectType: GraphQLObjectType | undefined;
  onToggle: (path: string[]) => void;
  onSetArg: (path: string[], argName: string, value: string) => void;
  onPromoteArg?: (path: string[], argName: string, suggestedName: string) => void;
  onDemoteArg?: (path: string[], varName: string) => void;
};

const FieldTreeNode: FC<FieldTreeNodeProps> = ({
  field,
  path,
  doc,
  isObject,
  selected,
  objectType,
  onToggle,
  onSetArg,
  onPromoteArg,
  onDemoteArg,
}) => {
  const [expanded, setExpanded] = useState(false);
  const fullPath = [...path, field.name];
  const argValues = getFieldArgValues(doc, fullPath);
  const argVariables = getFieldArgVariables(doc, fullPath);

  function handleExpand() {
    setExpanded(prev => !prev);
  }

  return (
    <div className="graphiql-qb-field-node">
      <FieldRow
        field={field}
        path={path}
        selected={selected}
        hasChildren={isObject}
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
          onToggle={onToggle}
          onSetArg={onSetArg}
          onPromoteArg={onPromoteArg}
          onDemoteArg={onDemoteArg}
        />
      )}
    </div>
  );
};
