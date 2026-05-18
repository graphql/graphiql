import {
  GraphQLNamedType,
  isEnumType,
  isInputObjectType,
  isInterfaceType,
  isObjectType,
  isType,
  isUnionType,
} from 'graphql';
import type { FC, ReactNode } from 'react';
import {
  MagnifyingGlassIcon,
  PanelHeader,
  SettingsIcon,
  Spinner,
  ToolbarButton,
  useGraphiQL,
  pick,
} from '@graphiql/react';
import { useDocExplorer, useDocExplorerActions } from '../context';
import { Breadcrumb } from './breadcrumb';
import { FieldDocumentation } from './field-documentation';
import { FieldsList } from './fields-list';
import { SchemaDocumentation } from './schema-documentation';
import { SearchRow } from './search-row';
import { TypeCard } from './type-card';
import { TypeDocumentation } from './type-documentation';
import './doc-explorer.css';

export const DocExplorer: FC = () => {
  const { fetchError, isIntrospecting, schema, validationErrors } = useGraphiQL(
    pick('fetchError', 'isIntrospecting', 'schema', 'validationErrors'),
  );
  const explorerNavStack = useDocExplorer();
  const { pop } = useDocExplorerActions();
  const navItem = explorerNavStack.at(-1)!;

  const navigateToIndex = (index: number) => {
    const stepsBack = explorerNavStack.length - 1 - index;
    for (let i = 0; i < stepsBack; i++) {
      pop();
    }
  };

  let content: ReactNode = null;
  if (fetchError) {
    content = (
      <div className="graphiql-doc-explorer-error">Error fetching schema</div>
    );
  } else if (validationErrors[0]) {
    content = (
      <div className="graphiql-doc-explorer-error">
        Schema is invalid: {validationErrors[0].message}
      </div>
    );
  } else if (isIntrospecting) {
    content = <Spinner />;
  } else if (!schema) {
    content = (
      <div className="graphiql-doc-explorer-error">
        No GraphQL schema available
      </div>
    );
  } else if (explorerNavStack.length === 1) {
    content = <SchemaDocumentation schema={schema} />;
  } else if (isType(navItem.def)) {
    content = <TypeView type={navItem.def} />;
  } else if (navItem.def) {
    content = <FieldDocumentation field={navItem.def} />;
  }

  const isTypeOrFieldView = explorerNavStack.length > 1;

  return (
    <section
      className="graphiql-doc-explorer"
      aria-label="Documentation Explorer"
    >
      <PanelHeader
        title="Schema Explorer"
        actions={
          <>
            <ToolbarButton
              label="Filter fields"
              className="graphiql-doc-explorer-action-btn"
            >
              <SettingsIcon />
            </ToolbarButton>
            <ToolbarButton
              label="Search schema"
              className="graphiql-doc-explorer-action-btn"
            >
              <MagnifyingGlassIcon />
            </ToolbarButton>
          </>
        }
      />
      {isTypeOrFieldView && (
        <Breadcrumb
          navStack={explorerNavStack}
          onNavigateTo={navigateToIndex}
        />
      )}
      {isTypeOrFieldView && <SearchRow key={navItem.name} />}
      <div className="graphiql-doc-explorer-content">{content}</div>
    </section>
  );
};

const TypeView: FC<{ type: GraphQLNamedType }> = ({ type }) => {
  const hasNewFieldsList =
    isObjectType(type) || isInterfaceType(type) || isInputObjectType(type);
  // Enum/union/scalar still need the TypeDocumentation for enum values and
  // possible-type sections; interface needs it for Implementations.
  const needsTypeDocs =
    isEnumType(type) || isUnionType(type) || isInterfaceType(type);

  return (
    <>
      <TypeCard type={type} />
      {hasNewFieldsList && <FieldsList type={type} />}
      {needsTypeDocs && (
        <div className="graphiql-doc-explorer-type-extra">
          <TypeDocumentation type={type} hideHeader />
        </div>
      )}
    </>
  );
};
