import type { FC } from 'react';
import type { DocExplorerFieldDef } from '../context';
import { DeprecationReason } from './deprecation-reason';
import { TypeLink } from './type-link';
import { renderType } from './utils';
import './field-card.css';

type FieldCardProps = {
  field: DocExplorerFieldDef;
};

export const FieldCard: FC<FieldCardProps> = ({ field }) => {
  return (
    <div className="graphiql-doc-explorer-field-card">
      <div className="graphiql-doc-explorer-field-card-header">
        <span className="graphiql-doc-explorer-type-badge">FIELD</span>
        <span className="graphiql-doc-explorer-field-card-name">
          {field.name}
        </span>
        <span
          className="graphiql-doc-explorer-field-card-colon"
          aria-hidden="true"
        >
          :
        </span>
        <span className="graphiql-doc-explorer-field-card-type">
          {renderType(field.type, namedType => (
            <TypeLink type={namedType} />
          ))}
        </span>
      </div>
      {field.description && (
        <p className="graphiql-doc-explorer-field-card-description">
          {field.description}
        </p>
      )}
      {'deprecationReason' in field && field.deprecationReason ? (
        <DeprecationReason preview={false}>
          {field.deprecationReason}
        </DeprecationReason>
      ) : null}
    </div>
  );
};
