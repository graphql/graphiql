import type { GraphQLArgument } from 'graphql';
import { FC, useState } from 'react';
import { Button, MarkdownContent } from '@graphiql/react';
import type { DocExplorerFieldDef } from '../context';
import { Argument } from './argument';
import { DeprecationReason } from './deprecation-reason';
import { Directive } from './directive';
import { ExplorerSection } from './section';
import { TypeLink } from './type-link';

type FieldDocumentationProps = {
  /**
   * The field or argument that should be rendered.
   */
  field: DocExplorerFieldDef;
};

export const FieldDocumentation: FC<FieldDocumentationProps> = ({ field }) => {
  return (
    <>
      {field.description ? (
        <MarkdownContent type="description">
          {field.description}
        </MarkdownContent>
      ) : null}
      <DeprecationReason preview={false}>
        {field.deprecationReason}
      </DeprecationReason>
      <ExplorerSection title="Type">
        <TypeLink type={field.type} />
      </ExplorerSection>
      <Arguments field={field} />
      <Directives field={field} />
    </>
  );
};

const Arguments: FC<{ field: DocExplorerFieldDef }> = ({ field }) => {
  const [showDeprecated, setShowDeprecated] = useState(false);
  const handleShowDeprecated = () => {
    setShowDeprecated(true);
  };

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
      {args.length > 0 ? (
        <ExplorerSection title="Arguments">
          {args.map(arg => (
            <Argument key={arg.name} arg={arg} />
          ))}
        </ExplorerSection>
      ) : null}
      {deprecatedArgs.length > 0 ? (
        showDeprecated || args.length === 0 ? (
          <ExplorerSection title="Deprecated Arguments">
            {deprecatedArgs.map(arg => (
              <Argument key={arg.name} arg={arg} />
            ))}
          </ExplorerSection>
        ) : (
          <Button type="button" onClick={handleShowDeprecated}>
            Show Deprecated Arguments
          </Button>
        )
      ) : null}
    </>
  );
};

const Directives: FC<{ field: DocExplorerFieldDef }> = ({ field }) => {
  const directives = field.astNode?.directives;
  if (!directives?.length) {
    return null;
  }
  return (
    <ExplorerSection title="Directives">
      {directives.map(directive => (
        <div key={directive.name.value}>
          <Directive directive={directive} />
        </div>
      ))}
    </ExplorerSection>
  );
};
