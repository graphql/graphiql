import { useGraphiQL, useGraphiQLActions } from '@graphiql/react';
import {
  type FieldNode,
  getNamedType,
  isEnumType,
  isScalarType,
  parse,
  print,
} from 'graphql';
import { type FC, useMemo } from 'react';
import {
  demoteVariable,
  promoteArgToVariable,
  scalarToValueNode,
  setFieldArgument,
  suggestVarName,
  toggleFieldSelection,
} from '../lib/document-mutator';
import { FragmentSection } from './fragment-section';
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

/**
 * Extract the raw default value string for an arg at a path from the document.
 * Returns an empty string when the arg is not found or has no value.
 */
function extractRawArgValue(
  doc: ReturnType<typeof parse>,
  path: string[],
  argName: string,
): string {
  const op = doc.definitions.find(d => d.kind === 'OperationDefinition');
  if (!op || op.kind !== 'OperationDefinition') return '';

  let ss = op.selectionSet;
  for (let i = 0; i < path.length; i++) {
    const seg = path[i]!;
    const f = ss.selections.find(
      (s): s is FieldNode => s.kind === 'Field' && s.name.value === seg,
    );
    if (!f) return '';
    if (i === path.length - 1) {
      const argNode = (f.arguments ?? []).find(a => a.name.value === argName);
      if (!argNode) return '';
      const v = argNode.value;
      if (v.kind === 'StringValue') return `"${v.value}"`;
      if (v.kind === 'IntValue' || v.kind === 'FloatValue') return v.value;
      if (v.kind === 'BooleanValue') return String(v.value);
      if (v.kind === 'EnumValue') return v.value;
      return '';
    }
    ss = f.selectionSet ?? ss;
  }
  return '';
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

  /** Shared schema-walk helper — returns the arg on the field at `path`, or undefined. */
  function resolveSchemaArg(path: string[], argName: string) {
    if (!schema) return undefined;
    const [rootName, ...rest] = path;
    const rootType =
      schema.getQueryType() ?? schema.getMutationType() ?? schema.getSubscriptionType();
    if (!rootType || !rootName) return undefined;

    let currentType = rootType;
    let targetField: ReturnType<typeof currentType.getFields>[string] | undefined;
    const fieldNames = rest.length === 0 ? [rootName] : [rootName, ...rest];
    for (const name of fieldNames) {
      const fields = currentType.getFields();
      const f = fields[name];
      if (!f) return undefined;
      targetField = f;
      const named = getNamedType(f.type);
      if (named && 'getFields' in named) {
        currentType = named as typeof currentType;
      }
    }
    return targetField?.args.find(a => a.name === argName);
  }

  function handleSetArg(path: string[], argName: string, rawValue: string) {
    const schemaArg = resolveSchemaArg(path, argName);
    if (!schemaArg) return;

    const namedArgType = getNamedType(schemaArg.type);
    if (!namedArgType || (!isScalarType(namedArgType) && !isEnumType(namedArgType))) return;

    const valueNode = scalarToValueNode(namedArgType, rawValue);
    applyDoc(setFieldArgument(doc, path, argName, valueNode));
  }

  function handlePromoteArg(path: string[], argName: string, suggestedName: string) {
    const schemaArg = resolveSchemaArg(path, argName);
    if (!schemaArg) return;

    const namedType = getNamedType(schemaArg.type);
    if (!namedType) return;

    const varName = suggestVarName(doc, suggestedName);
    const rawDefault = extractRawArgValue(doc, path, argName);
    applyDoc(promoteArgToVariable(doc, path, argName, varName, namedType.name, rawDefault));
  }

  function handleDemoteArg(_path: string[], varName: string) {
    applyDoc(demoteVariable(doc, varName));
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
            onPromoteArg={handlePromoteArg}
            onDemoteArg={handleDemoteArg}
          />
        </section>
      ))}
      <FragmentSection doc={doc} />
    </div>
  );
};
