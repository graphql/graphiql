import {
  getNamedType,
  isObjectType,
  type DocumentNode,
  type GraphQLObjectType,
} from 'graphql';
import { type FC, useState } from 'react';
import { isFieldSelected } from '../lib/document-mutator';
import { FieldRow } from './field-row';

type FieldTreeProps = {
  type: GraphQLObjectType;
  path: string[];
  doc: DocumentNode;
  onToggle: (path: string[]) => void;
};

export const FieldTree: FC<FieldTreeProps> = ({ type, path, doc, onToggle }) => {
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
};

const FieldTreeNode: FC<FieldTreeNodeProps> = ({
  field,
  path,
  doc,
  isObject,
  selected,
  objectType,
  onToggle,
}) => {
  const [expanded, setExpanded] = useState(false);

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
        onToggle={onToggle}
        onExpand={handleExpand}
      />
      {isObject && expanded && objectType && (
        <FieldTree
          type={objectType}
          path={[...path, field.name]}
          doc={doc}
          onToggle={onToggle}
        />
      )}
    </div>
  );
};
