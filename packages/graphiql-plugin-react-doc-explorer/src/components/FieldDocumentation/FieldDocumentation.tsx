import { useState } from 'react';
import { GraphQLArgument } from 'graphql';

// components
import { Button, MarkdownContent } from '@graphiql/react';
import { Argument } from '../Argument';
import { DeprecationReason } from '../DeprecationReason';
import { Directive } from '../Directive';
import { Section } from '../Section';
import { TypeLink } from '../TypeLink';

// types
import { ExplorerFieldDef } from '../../types';

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
      <DeprecationReason>{props.field.deprecationReason}</DeprecationReason>
      <Section title="Type">
        <TypeLink type={props.field.type} />
      </Section>
      <Arguments field={props.field} />
      <Directives field={props.field} />
    </>
  );
}

function Arguments({ field }: { field: ExplorerFieldDef }) {
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
      {args.length > 0 ? (
        <Section title="Arguments">
          {args.map(arg => (
            <Argument key={arg.name} arg={arg} />
          ))}
        </Section>
      ) : null}
      {deprecatedArgs.length > 0 ? (
        showDeprecated || args.length === 0 ? (
          <Section title="Deprecated Arguments">
            {deprecatedArgs.map(arg => (
              <Argument key={arg.name} arg={arg} />
            ))}
          </Section>
        ) : (
          <Button
            type="button"
            onClick={() => {
              setShowDeprecated(true);
            }}
          >
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
    <Section title="Directives">
      {directives.map(directive => (
        <div key={directive.name.value}>
          <Directive directive={directive} />
        </div>
      ))}
    </Section>
  );
}
