import { FC, useState } from 'react';
import {
  GraphQLNamedType,
  isObjectType,
  isInterfaceType,
  isInputObjectType,
} from 'graphql';
import { Button, ChevronDownIcon, ChevronUpIcon } from '@graphiql/react';
import type { DocExplorerFieldDef } from '../context';
import { useDocExplorerActions } from '../context';
import { TypeLink } from './type-link';
import { renderType } from './utils';
import './fields-list.css';

type FieldsListProps = {
  type: GraphQLNamedType;
  activeFieldName?: string;
};

export const FieldsList: FC<FieldsListProps> = ({ type, activeFieldName }) => {
  const [expanded, setExpanded] = useState(true);
  const [showDeprecated, setShowDeprecated] = useState(false);

  if (
    !isObjectType(type) &&
    !isInterfaceType(type) &&
    !isInputObjectType(type)
  ) {
    return null;
  }

  const fieldMap = type.getFields();
  const fields: DocExplorerFieldDef[] = [];
  const deprecatedFields: DocExplorerFieldDef[] = [];

  for (const field of Object.values(fieldMap)) {
    if (field.deprecationReason) {
      deprecatedFields.push(field);
    } else {
      fields.push(field);
    }
  }

  const totalCount = fields.length + (showDeprecated ? deprecatedFields.length : 0);

  return (
    <div className="graphiql-doc-explorer-fields-list">
      <button
        type="button"
        className="graphiql-doc-explorer-fields-list-header"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        {expanded ? <ChevronDownIcon /> : <ChevronUpIcon />}
        <span>
          FIELDS{' '}
          <span className="graphiql-doc-explorer-fields-list-count">
            · {totalCount}
          </span>
        </span>
      </button>
      {expanded && (
        <div className="graphiql-doc-explorer-fields-list-body">
          {fields.map(field => (
            <FieldRow
              key={field.name}
              field={field}
              isActive={field.name === activeFieldName}
            />
          ))}
          {deprecatedFields.length > 0 &&
            (showDeprecated || fields.length === 0 ? (
              deprecatedFields.map(field => (
                <FieldRow
                  key={field.name}
                  field={field}
                  isActive={field.name === activeFieldName}
                  deprecated
                />
              ))
            ) : (
              <Button
                type="button"
                onClick={() => setShowDeprecated(true)}
                className="graphiql-doc-explorer-fields-list-show-deprecated"
              >
                Show Deprecated Fields
              </Button>
            ))}
        </div>
      )}
    </div>
  );
};

type FieldRowProps = {
  field: DocExplorerFieldDef;
  isActive: boolean;
  deprecated?: boolean;
};

const FieldRow: FC<FieldRowProps> = ({ field, isActive, deprecated }) => {
  const { push } = useDocExplorerActions();

  return (
    <button
      type="button"
      className={[
        'graphiql-doc-explorer-field-row',
        isActive ? 'graphiql-doc-explorer-field-row--active' : '',
        deprecated ? 'graphiql-doc-explorer-field-row--deprecated' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => push({ name: field.name, def: field })}
      aria-current={isActive ? 'true' : undefined}
    >
      <div className="graphiql-doc-explorer-field-row-sig">
        <span className="graphiql-doc-explorer-field-row-name">{field.name}</span>
        <span className="graphiql-doc-explorer-field-row-colon">:</span>
        <span className="graphiql-doc-explorer-field-row-type">
          {renderType(field.type, namedType => (
            <TypeLink type={namedType} />
          ))}
        </span>
      </div>
      {field.description && (
        <div className="graphiql-doc-explorer-field-row-desc">
          {field.description}
        </div>
      )}
    </button>
  );
};
