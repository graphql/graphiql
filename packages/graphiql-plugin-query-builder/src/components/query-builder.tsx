import { useGraphiQL, useGraphiQLActions } from '@graphiql/react';
import { getNamedType, isEnumType, isScalarType, parse, print } from 'graphql';
import { type FC, useMemo } from 'react';
import { scalarToValueNode, setFieldArgument, toggleFieldSelection } from '../lib/document-mutator';
import { FieldTree } from './field-tree';
import './../index.css';

/**
 * Parse the current query text into a DocumentNode, falling back to a
 * minimal valid document if the text is empty or unparseable.
 */
function parseOrEmpty(text: string | null | undefined) {
  const src = text?.trim();
  if (!src) {
    return parse('{ __typename }');
  }
  try {
    return parse(src);
  } catch {
    return parse('{ __typename }');
  }
}

export const QueryBuilder: FC = () => {
  const schema = useGraphiQL(state => state.schema);
  const queryEditor = useGraphiQL(state => state.queryEditor);
  const { updateActiveTabValues } = useGraphiQLActions();

  // Track the live editor text so checkboxes reflect real-time state.
  const activeTabIndex = useGraphiQL(state => state.activeTabIndex);
  const tabs = useGraphiQL(state => state.tabs);
  const queryText = tabs[activeTabIndex]?.query;

  const doc = useMemo(() => parseOrEmpty(queryText), [queryText]);

  function applyDoc(next: ReturnType<typeof parse>) {
    const printed = print(next);
    if (queryEditor) {
      queryEditor.setValue(printed);
    } else {
      updateActiveTabValues({ query: printed });
    }
  }

  function handleToggle(path: string[]) {
    applyDoc(toggleFieldSelection(doc, path));
  }

  function handleSetArg(path: string[], argName: string, rawValue: string) {
    if (!schema) return;
    // Resolve the field in the schema so we can look up the arg's type.
    const [rootName, ...rest] = path;
    const rootType =
      schema.getQueryType() ?? schema.getMutationType() ?? schema.getSubscriptionType();
    if (!rootType || !rootName) return;

    // Walk the schema from the root to find the target field's argument type.
    let currentType = rootType;
    let targetField: ReturnType<typeof currentType.getFields>[string] | undefined;
    const fieldNames = rest.length === 0 ? [rootName] : [rootName, ...rest];
    for (const name of fieldNames) {
      const fields = currentType.getFields();
      const f = fields[name];
      if (!f) return;
      targetField = f;
      const named = getNamedType(f.type);
      if (named && 'getFields' in named) {
        currentType = named as typeof currentType;
      }
    }

    if (!targetField) return;
    const arg = targetField.args.find(a => a.name === argName);
    if (!arg) return;

    const namedArgType = getNamedType(arg.type);
    if (!namedArgType || (!isScalarType(namedArgType) && !isEnumType(namedArgType))) return;

    const valueNode = scalarToValueNode(namedArgType, rawValue);
    const next = setFieldArgument(doc, path, argName, valueNode);
    applyDoc(next);
  }

  if (!schema) {
    return (
      <div className="graphiql-query-builder">
        <p className="graphiql-qb-empty">No schema loaded.</p>
      </div>
    );
  }

  const rootTypes = [
    schema.getQueryType(),
    schema.getMutationType(),
    schema.getSubscriptionType(),
  ].filter(Boolean) as NonNullable<ReturnType<typeof schema.getQueryType>>[];

  return (
    <div className="graphiql-query-builder">
      {rootTypes.map(rootType => (
        <section key={rootType.name} className="graphiql-qb-root-section">
          <h3 className="graphiql-qb-root-name">{rootType.name}</h3>
          <FieldTree
            type={rootType}
            path={[]}
            doc={doc}
            onToggle={handleToggle}
            onSetArg={handleSetArg}
          />
        </section>
      ))}
    </div>
  );
};
