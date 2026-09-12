import type { FC } from 'react';
import {
  GraphQLNamedType,
  isObjectType,
  isInterfaceType,
  isInputObjectType,
  isEnumType,
  isScalarType,
  isUnionType,
} from 'graphql';
import { useDocExplorerActions } from '../context';
import './type-card.css';

function getTypeKind(type: GraphQLNamedType): string {
  if (isObjectType(type)) {
    return 'TYPE';
  }
  if (isInterfaceType(type)) {
    return 'INTERFACE';
  }
  if (isInputObjectType(type)) {
    return 'INPUT';
  }
  if (isEnumType(type)) {
    return 'ENUM';
  }
  if (isScalarType(type)) {
    return 'SCALAR';
  }
  if (isUnionType(type)) {
    return 'UNION';
  }
  return 'TYPE';
}

type TypeCardProps = {
  type: GraphQLNamedType;
};

export const TypeCard: FC<TypeCardProps> = ({ type }) => {
  const { push } = useDocExplorerActions();
  const kind = getTypeKind(type);
  const interfaces = isObjectType(type) ? type.getInterfaces() : [];

  return (
    <div className="graphiql-doc-explorer-type-card">
      <div className="graphiql-doc-explorer-type-card-header">
        <span className="graphiql-doc-explorer-type-badge">{kind}</span>
        <span className="graphiql-doc-explorer-type-card-name">
          {type.name}
        </span>
      </div>
      {type.description && (
        <p className="graphiql-doc-explorer-type-card-description">
          {type.description}
        </p>
      )}
      {interfaces.length > 0 && (
        <div className="graphiql-doc-explorer-type-card-implements">
          <span className="graphiql-doc-explorer-type-card-implements-keyword">
            implements
          </span>
          {interfaces.map((iface, i) => (
            <span
              key={iface.name}
              className="graphiql-doc-explorer-type-card-implements-item"
            >
              {i > 0 && (
                <span
                  className="graphiql-doc-explorer-type-card-implements-dot"
                  aria-hidden="true"
                >
                  ·
                </span>
              )}
              <a
                href="#"
                className="graphiql-doc-explorer-type-card-implements-link"
                onClick={event => {
                  event.preventDefault();
                  push({ name: iface.name, def: iface });
                }}
              >
                {iface.name}
              </a>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
