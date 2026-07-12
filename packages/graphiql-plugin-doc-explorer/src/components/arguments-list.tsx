import { FC, useState } from 'react';
import { astFromValue, print, type GraphQLArgument } from 'graphql';
import { Button, ChevronDownIcon, ChevronUpIcon } from '@graphiql/react';
import { DeprecationReason } from './deprecation-reason';
import { TypeLink } from './type-link';
import { renderType } from './utils';
import './arguments-list.css';

type ArgumentsListProps = {
  title: 'ARGUMENTS' | 'DEPRECATED ARGUMENTS';
  args: GraphQLArgument[];
};

export const ArgumentsList: FC<ArgumentsListProps> = ({ title, args }) => {
  const [expanded, setExpanded] = useState(true);

  if (args.length === 0) {
    return null;
  }

  return (
    <div className="graphiql-doc-explorer-arguments-list">
      <button
        type="button"
        className="graphiql-doc-explorer-arguments-list-header"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        {expanded ? (
          <ChevronDownIcon aria-hidden="true" />
        ) : (
          <ChevronUpIcon aria-hidden="true" />
        )}
        <span>
          {title}{' '}
          <span className="graphiql-doc-explorer-arguments-list-count">
            · {args.length}
          </span>
        </span>
      </button>
      {expanded && (
        <div className="graphiql-doc-explorer-arguments-list-body">
          {args.map(arg => (
            <ArgumentRow key={arg.name} arg={arg} />
          ))}
        </div>
      )}
    </div>
  );
};

type ShowDeprecatedArgumentsButtonProps = {
  onClick: () => void;
};

export const ShowDeprecatedArgumentsButton: FC<
  ShowDeprecatedArgumentsButtonProps
> = ({ onClick }) => (
  <Button
    type="button"
    onClick={onClick}
    className="graphiql-doc-explorer-arguments-list-show-deprecated"
  >
    Show Deprecated Arguments
  </Button>
);

type ArgumentRowProps = {
  arg: GraphQLArgument;
};

const ArgumentRow: FC<ArgumentRowProps> = ({ arg }) => {
  const defaultAst =
    arg.defaultValue === undefined
      ? null
      : astFromValue(arg.defaultValue, arg.type);
  const isDeprecated = Boolean(arg.deprecationReason);

  return (
    <div
      className={[
        'graphiql-doc-explorer-argument',
        isDeprecated ? 'graphiql-doc-explorer-argument--deprecated' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="graphiql-doc-explorer-argument-sig">
        <span className="graphiql-doc-explorer-argument-name">{arg.name}</span>
        <span
          className="graphiql-doc-explorer-argument-colon"
          aria-hidden="true"
        >
          :
        </span>
        <span className="graphiql-doc-explorer-argument-type">
          {renderType(arg.type, namedType => (
            <TypeLink type={namedType} />
          ))}
        </span>
        {defaultAst && (
          <span className="graphiql-doc-explorer-argument-default">
            = {print(defaultAst)}
          </span>
        )}
      </div>
      {arg.description && (
        <div className="graphiql-doc-explorer-argument-desc">
          {arg.description}
        </div>
      )}
      {arg.deprecationReason ? (
        <DeprecationReason preview={false}>
          {arg.deprecationReason}
        </DeprecationReason>
      ) : null}
    </div>
  );
};
