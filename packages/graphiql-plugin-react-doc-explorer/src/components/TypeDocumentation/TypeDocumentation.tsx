import { useState } from 'react';
import {
  GraphQLEnumValue,
  GraphQLNamedType,
  isAbstractType,
  isEnumType,
  isInputObjectType,
  isInterfaceType,
  isNamedType,
  isObjectType,
} from 'graphql';

// components
import { Button, MarkdownContent } from '@graphiql/react';
import { Argument } from '../Argument';
import { DefaultValue } from '../DefaultValue';
import { DeprecationReason } from '../DeprecationReason';
import { FieldLink } from '../FieldLink';
import { Section } from '../Section';
import { TypeLink } from '../TypeLink';

// context
import { useSchemaContext } from '@graphiql/react';

// styles
import './TypeDocumentation.css';

// types
import { ExplorerFieldDef } from '../../types';

type TypeDocumentationProps = {
  /**
   * The type that should be rendered.
   */
  type: GraphQLNamedType;
};

export function TypeDocumentation(props: TypeDocumentationProps) {
  return isNamedType(props.type) ? (
    <>
      {props.type.description ? (
        <MarkdownContent type="description">
          {props.type.description}
        </MarkdownContent>
      ) : null}
      <ImplementsInterfaces type={props.type} />
      <Fields type={props.type} />
      <EnumValues type={props.type} />
      <PossibleTypes type={props.type} />
    </>
  ) : null;
}

function ImplementsInterfaces({ type }: { type: GraphQLNamedType }) {
  if (!isObjectType(type)) {
    return null;
  }
  const interfaces = type.getInterfaces();
  return interfaces.length > 0 ? (
    <Section title="Implements">
      {type.getInterfaces().map(implementedInterface => (
        <div key={implementedInterface.name}>
          <TypeLink type={implementedInterface} />
        </div>
      ))}
    </Section>
  ) : null;
}

function Fields({ type }: { type: GraphQLNamedType }) {
  const [showDeprecated, setShowDeprecated] = useState(false);
  if (
    !isObjectType(type) &&
    !isInterfaceType(type) &&
    !isInputObjectType(type)
  ) {
    return null;
  }

  const fieldMap = type.getFields();

  const fields: ExplorerFieldDef[] = [];
  const deprecatedFields: ExplorerFieldDef[] = [];

  for (const field of Object.keys(fieldMap).map(name => fieldMap[name])) {
    if (field.deprecationReason) {
      deprecatedFields.push(field);
    } else {
      fields.push(field);
    }
  }

  return (
    <>
      {fields.length > 0 ? (
        <Section title="Fields">
          {fields.map(field => (
            <Field key={field.name} field={field} />
          ))}
        </Section>
      ) : null}
      {deprecatedFields.length > 0 ? (
        showDeprecated || fields.length === 0 ? (
          <Section title="Deprecated Fields">
            {deprecatedFields.map(field => (
              <Field key={field.name} field={field} />
            ))}
          </Section>
        ) : (
          <Button
            type="button"
            onClick={() => {
              setShowDeprecated(true);
            }}
          >
            Show Deprecated Fields
          </Button>
        )
      ) : null}
    </>
  );
}

function Field({ field }: { field: ExplorerFieldDef }) {
  const args =
    'args' in field ? field.args.filter(arg => !arg.deprecationReason) : [];
  return (
    <div className="graphiql-doc-explorer-item">
      <div>
        <FieldLink field={field} />
        {args.length > 0 ? (
          <>
            (
            <span>
              {args.map(arg =>
                args.length === 1 ? (
                  <Argument key={arg.name} arg={arg} inline />
                ) : (
                  <div
                    key={arg.name}
                    className="graphiql-doc-explorer-argument-multiple"
                  >
                    <Argument arg={arg} inline />
                  </div>
                ),
              )}
            </span>
            )
          </>
        ) : null}
        {': '}
        <TypeLink type={field.type} />
        <DefaultValue field={field} />
      </div>
      {field.description ? (
        <MarkdownContent type="description" onlyShowFirstChild>
          {field.description}
        </MarkdownContent>
      ) : null}
      <DeprecationReason>{field.deprecationReason}</DeprecationReason>
    </div>
  );
}

function EnumValues({ type }: { type: GraphQLNamedType }) {
  const [showDeprecated, setShowDeprecated] = useState(false);

  if (!isEnumType(type)) {
    return null;
  }

  const values: GraphQLEnumValue[] = [];
  const deprecatedValues: GraphQLEnumValue[] = [];
  for (const value of type.getValues()) {
    if (value.deprecationReason) {
      deprecatedValues.push(value);
    } else {
      values.push(value);
    }
  }

  return (
    <>
      {values.length > 0 ? (
        <Section title="Enum Values">
          {values.map(value => (
            <EnumValue key={value.name} value={value} />
          ))}
        </Section>
      ) : null}
      {deprecatedValues.length > 0 ? (
        showDeprecated || values.length === 0 ? (
          <Section title="Deprecated Enum Values">
            {deprecatedValues.map(value => (
              <EnumValue key={value.name} value={value} />
            ))}
          </Section>
        ) : (
          <Button
            type="button"
            onClick={() => {
              setShowDeprecated(true);
            }}
          >
            Show Deprecated Values
          </Button>
        )
      ) : null}
    </>
  );
}

function EnumValue({ value }: { value: GraphQLEnumValue }) {
  return (
    <div className="graphiql-doc-explorer-item">
      <div className="graphiql-doc-explorer-enum-value">{value.name}</div>
      {value.description ? (
        <MarkdownContent type="description">
          {value.description}
        </MarkdownContent>
      ) : null}
      {value.deprecationReason ? (
        <MarkdownContent type="deprecation">
          {value.deprecationReason}
        </MarkdownContent>
      ) : null}
    </div>
  );
}

function PossibleTypes({ type }: { type: GraphQLNamedType }) {
  const { schema } = useSchemaContext({ nonNull: true });
  if (!schema || !isAbstractType(type)) {
    return null;
  }
  return (
    <Section
      title={isInterfaceType(type) ? 'Implementations' : 'Possible Types'}
    >
      {schema.getPossibleTypes(type).map(possibleType => (
        <div key={possibleType.name}>
          <TypeLink type={possibleType} />
        </div>
      ))}
    </Section>
  );
}
