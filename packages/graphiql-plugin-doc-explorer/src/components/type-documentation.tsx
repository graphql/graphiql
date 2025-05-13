import { FC, useState } from 'react';
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
import { useSchemaStore, Button, MarkdownContent } from '@graphiql/react';
import { DocExplorerFieldDef } from '../context';
import { Argument } from './argument';
import { DefaultValue } from './default-value';
import { DeprecationReason } from './deprecation-reason';
import { FieldLink } from './field-link';
import { ExplorerSection } from './section';
import { TypeLink } from './type-link';
import './type-documentation.css';

type TypeDocumentationProps = {
  /**
   * The type that should be rendered.
   */
  type: GraphQLNamedType;
};

export const TypeDocumentation: FC<TypeDocumentationProps> = ({ type }) => {
  return isNamedType(type) ? (
    <>
      {type.description ? (
        <MarkdownContent type="description">{type.description}</MarkdownContent>
      ) : null}
      <ImplementsInterfaces type={type} />
      <Fields type={type} />
      <EnumValues type={type} />
      <PossibleTypes type={type} />
    </>
  ) : null;
};

const ImplementsInterfaces: FC<{ type: GraphQLNamedType }> = ({ type }) => {
  if (!isObjectType(type)) {
    return null;
  }
  const interfaces = type.getInterfaces();
  return interfaces.length > 0 ? (
    <ExplorerSection title="Implements">
      {type.getInterfaces().map(implementedInterface => (
        <div key={implementedInterface.name}>
          <TypeLink type={implementedInterface} />
        </div>
      ))}
    </ExplorerSection>
  ) : null;
};

const Fields: FC<{ type: GraphQLNamedType }> = ({ type }) => {
  const [showDeprecated, setShowDeprecated] = useState(false);
  const handleShowDeprecated = () => {
    setShowDeprecated(true);
  };

  if (
    !isObjectType(type) &&
    !isInterfaceType(type) &&
    !isInputObjectType(type)
  ) {
    return null;
  }

  const fieldMap = type.getFields();

  const fields: DocExplorerFieldDef[] = [];
  const deprecatedFields: DocExplorerFieldDef[] = [];

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
        <ExplorerSection title="Fields">
          {fields.map(field => (
            <Field key={field.name} field={field} />
          ))}
        </ExplorerSection>
      ) : null}
      {deprecatedFields.length > 0 ? (
        showDeprecated || fields.length === 0 ? (
          <ExplorerSection title="Deprecated Fields">
            {deprecatedFields.map(field => (
              <Field key={field.name} field={field} />
            ))}
          </ExplorerSection>
        ) : (
          <Button type="button" onClick={handleShowDeprecated}>
            Show Deprecated Fields
          </Button>
        )
      ) : null}
    </>
  );
};

const Field: FC<{ field: DocExplorerFieldDef }> = ({ field }) => {
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
};

const EnumValues: FC<{ type: GraphQLNamedType }> = ({ type }) => {
  const [showDeprecated, setShowDeprecated] = useState(false);
  const handleShowDeprecated = () => {
    setShowDeprecated(true);
  };

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
        <ExplorerSection title="Enum Values">
          {values.map(value => (
            <EnumValue key={value.name} value={value} />
          ))}
        </ExplorerSection>
      ) : null}
      {deprecatedValues.length > 0 ? (
        showDeprecated || values.length === 0 ? (
          <ExplorerSection title="Deprecated Enum Values">
            {deprecatedValues.map(value => (
              <EnumValue key={value.name} value={value} />
            ))}
          </ExplorerSection>
        ) : (
          <Button type="button" onClick={handleShowDeprecated}>
            Show Deprecated Values
          </Button>
        )
      ) : null}
    </>
  );
};

const EnumValue: FC<{ value: GraphQLEnumValue }> = ({ value }) => {
  return (
    <div className="graphiql-doc-explorer-item">
      <div className="graphiql-doc-explorer-enum-value">{value.name}</div>
      {value.description && (
        <MarkdownContent type="description">
          {value.description}
        </MarkdownContent>
      )}
      {value.deprecationReason && (
        <MarkdownContent type="deprecation">
          {value.deprecationReason}
        </MarkdownContent>
      )}
    </div>
  );
};

const PossibleTypes: FC<{ type: GraphQLNamedType }> = ({ type }) => {
  const { schema } = useSchemaStore();
  if (!schema || !isAbstractType(type)) {
    return null;
  }
  return (
    <ExplorerSection
      title={isInterfaceType(type) ? 'Implementations' : 'Possible Types'}
    >
      {schema.getPossibleTypes(type).map(possibleType => (
        <div key={possibleType.name}>
          <TypeLink type={possibleType} />
        </div>
      ))}
    </ExplorerSection>
  );
};
