import { isType } from 'graphql';
import { useState } from 'react';

import { MarkdownContent } from '../../ui';
import { useExplorerContext } from '../context';
import { Argument } from './argument';
import { Directive } from './directive';
import { TypeLink } from './type-link';

export function FieldDocumentation() {
  const { explorerNavStack } = useExplorerContext({
    nonNull: true,
    caller: FieldDocumentation,
  });
  const [showDeprecated, handleShowDeprecated] = useState(false);

  const navItem = explorerNavStack[explorerNavStack.length - 1];
  const field = navItem.def;
  if (!field || isType(field)) {
    return null;
  }

  let argsDef;
  let deprecatedArgsDef;
  if (field && 'args' in field && field.args.length > 0) {
    argsDef = (
      <div id="doc-args" className="doc-category">
        <div className="doc-category-title">arguments</div>
        {field.args
          .filter(arg => !arg.deprecationReason)
          .map(arg => (
            <Argument key={arg.name} arg={arg} />
          ))}
      </div>
    );
    const deprecatedArgs = field.args.filter(arg =>
      Boolean(arg.deprecationReason),
    );
    if (deprecatedArgs.length > 0) {
      deprecatedArgsDef = (
        <div id="doc-deprecated-args" className="doc-category">
          <div className="doc-category-title">deprecated arguments</div>
          {!showDeprecated ? (
            <button
              type="button"
              className="show-btn"
              onClick={() => handleShowDeprecated(!showDeprecated)}
            >
              Show deprecated arguments...
            </button>
          ) : (
            deprecatedArgs.map(arg => <Argument key={arg.name} arg={arg} />)
          )}
        </div>
      );
    }
  }

  let directivesDef;
  if (field?.astNode?.directives && field.astNode.directives.length > 0) {
    directivesDef = (
      <div id="doc-directives" className="doc-category">
        <div className="doc-category-title">directives</div>
        {field.astNode.directives.map(directive => (
          <div key={directive.name.value} className="doc-category-item">
            <div>
              <Directive directive={directive} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <MarkdownContent type="description">
        {field.description || 'No Description'}
      </MarkdownContent>
      {field && 'deprecationReason' in field && field.deprecationReason ? (
        <MarkdownContent type="deprecation">
          {field.deprecationReason}
        </MarkdownContent>
      ) : null}
      <div className="doc-category">
        <div className="doc-category-title">type</div>
        <TypeLink type={field.type} />
      </div>
      {argsDef}
      {directivesDef}
      {deprecatedArgsDef}
    </div>
  );
}
