import type { FC } from 'react';
import type { DocExplorerNavStack } from '../context';
import './breadcrumb.css';

type BreadcrumbProps = {
  navStack: DocExplorerNavStack;
  onNavigateTo: (index: number) => void;
};

export const Breadcrumb: FC<BreadcrumbProps> = ({ navStack, onNavigateTo }) => {
  if (navStack.length <= 1) {
    return null;
  }

  return (
    <nav
      className="graphiql-doc-explorer-breadcrumb"
      aria-label="Schema navigation path"
    >
      {navStack.map((item, index) => {
        const isLast = index === navStack.length - 1;
        const depthClass =
          index === 0
            ? 'graphiql-doc-explorer-breadcrumb-root'
            : isLast
              ? 'graphiql-doc-explorer-breadcrumb-current'
              : 'graphiql-doc-explorer-breadcrumb-intermediate';

        return (
          <span key={index} className="graphiql-doc-explorer-breadcrumb-segment">
            {index > 0 && (
              <span
                className="graphiql-doc-explorer-breadcrumb-sep"
                aria-hidden="true"
              >
                ›
              </span>
            )}
            {isLast ? (
              <span className={depthClass}>{item.name}</span>
            ) : (
              <a
                href="#"
                className={depthClass}
                onClick={event => {
                  event.preventDefault();
                  onNavigateTo(index);
                }}
                aria-label={`Go back to ${item.name}`}
              >
                {item.name}
              </a>
            )}
          </span>
        );
      })}
    </nav>
  );
};
