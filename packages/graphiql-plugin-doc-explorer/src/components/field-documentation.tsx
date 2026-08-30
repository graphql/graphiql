import type { ConstDirectiveNode, GraphQLArgument } from 'graphql';
import { FC, useState } from 'react';
import type { DocExplorerFieldDef } from '../context';
import { ArgumentsList, ShowDeprecatedArgumentsButton } from './arguments-list';
import { Directive } from './directive';
import { FieldCard } from './field-card';

type FieldDocumentationProps = {
  /**
   * The field or argument that should be rendered.
   */
  field: DocExplorerFieldDef;
};

export const FieldDocumentation: FC<FieldDocumentationProps> = ({ field }) => {
  return (
    <>
      <FieldCard field={field} />
      <Arguments field={field} />
      <Directives field={field} />
    </>
  );
};

const Arguments: FC<{ field: DocExplorerFieldDef }> = ({ field }) => {
  const [showDeprecated, setShowDeprecated] = useState(false);

  if (!('args' in field)) {
    return null;
  }

  const args: GraphQLArgument[] = [];
  const deprecatedArgs: GraphQLArgument[] = [];
  for (const argument of field.args) {
    if (argument.deprecationReason) {
      deprecatedArgs.push(argument);
    } else {
      args.push(argument);
    }
  }

  return (
    <>
      <ArgumentsList title="ARGUMENTS" args={args} />
      {deprecatedArgs.length > 0 &&
        (showDeprecated || args.length === 0 ? (
          <ArgumentsList title="DEPRECATED ARGUMENTS" args={deprecatedArgs} />
        ) : (
          <ShowDeprecatedArgumentsButton
            onClick={() => setShowDeprecated(true)}
          />
        ))}
    </>
  );
};

const Directives: FC<{ field: DocExplorerFieldDef }> = ({ field }) => {
  const directives = field.astNode?.directives as
    | readonly ConstDirectiveNode[]
    | undefined;
  if (!directives?.length) {
    return null;
  }
  return (
    <div className="graphiql-doc-explorer-directives-list">
      <div className="graphiql-doc-explorer-directives-list-header">
        DIRECTIVES{' '}
        <span className="graphiql-doc-explorer-directives-list-count">
          · {directives.length}
        </span>
      </div>
      <div className="graphiql-doc-explorer-directives-list-body">
        {directives.map(directive => (
          <div
            key={directive.name.value}
            className="graphiql-doc-explorer-directive-row"
          >
            <Directive directive={directive} />
          </div>
        ))}
      </div>
    </div>
  );
};
