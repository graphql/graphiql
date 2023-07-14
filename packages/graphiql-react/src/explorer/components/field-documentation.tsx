import { GraphQLArgument } from 'graphql';
import { useCallback, useState } from 'react';

import { Button, MarkdownContent } from '../../ui';
import { ExplorerFieldDef } from '../context';
import { Argument } from './argument';
import { DeprecationReason } from './deprecation-reason';
import { Directive } from './directive';
import { ExplorerSection } from './section';
import { TypeLink } from './type-link';

type FieldDocumentationProps = {
  /**
   * The field or argument that should be rendered.
   */
  field: ExplorerFieldDef;
};

export function FieldDocumentation(props: FieldDocumentationProps) {
  return (
    <>
      {props.field.description ? (
        <MarkdownContent type="description">
          {props.field.description}
        </MarkdownContent>
      ) : null}
      <DeprecationReason preview={false}>
        {props.field.deprecationReason}
      </DeprecationReason>
      <ExplorerSection title="Type">
        <TypeLink type={props.field.type} />
      </ExplorerSection>
      <Arguments field={props.field} />
      <Directives field={props.field} />
    </>
  );
}

function Arguments({ field }: { field: ExplorerFieldDef }) {
  const [showDeprecated, setShowDeprecated] = useState(false);
  const handleShowDeprecated = useCallback(() => {
    setShowDeprecated(true);
  }, []);

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
}

function Directives({ field }: { field: ExplorerFieldDef }) {
  const directives = field.astNode?.directives || [];
  if (!directives || directives.length === 0) {
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
}
