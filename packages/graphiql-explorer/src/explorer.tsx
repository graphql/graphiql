/* eslint-disable */
// cSpell:disable

// TODO: 1. Add default fields recursively
// TODO: 2. Add default fields for all selections (not just fragments)
// TODO: 3. Add stylesheet and remove inline styles
// TODO: 4. Indication of when query in explorer diverges from query in editor pane
// TODO: 5. Separate section for deprecated args, with support for 'beta' fields
// TODO: 6. Custom default arg fields

// Note: Attempted 1. and 2., but they were more annoying than helpful

import * as React from 'react';

import { GraphQLObjectType, print, Kind } from 'graphql';

import type {
  DocumentNode,
  GraphQLSchema,
  FragmentDefinitionNode,
  OperationDefinitionNode,
} from 'graphql';

import {
  StyleConfig,
  GetDefaultScalarArgValue,
  MakeDefaultArg,
  Colors,
  StyleMap,
  CommitOptions,
  AvailableFragments,
  NewOperationType,
} from './types';
import { capitalize, DEFAULT_DOCUMENT, memoizeParseQuery } from './lib/utils';

import {
  defaultValue,
  defaultGetDefaultScalarArgValue,
  defaultGetDefaultFieldNames,
} from './lib/defaults';
import { RootView } from './root-view';
import {
  defaultCheckboxChecked,
  defaultColors,
  defaultArrowClosed,
  defaultArrowOpen,
  defaultCheckboxUnchecked,
  defaultStyles,
} from './style';

export type Props = {
  query: string;

  schema?: null | GraphQLSchema;
  onEdit: (edit: string) => void;
  /**
   * the same prop as GraphiQLProps.getDefaultFieldNames
   * provide an array of field names to be expanded by default
   */
  getDefaultFieldNames?: null | ((type: GraphQLObjectType) => Array<string>);
  getDefaultScalarArgValue?: null | GetDefaultScalarArgValue;
  makeDefaultArg?: null | MakeDefaultArg;
  onRunOperation?: (name: null | string) => void;
  colors?: null | Colors;
  /**
   * alternative arrowOpen icon
   */
  arrowOpen?: null | React.ReactElement;
  /**
   * alternative arrowClosed icon
   */
  arrowClosed?: null | React.ReactElement;
  /**
   * alternative checkboxChecked icon
   */
  checkboxChecked?: null | React.ReactElement;
  /**
   * alternative checkboxUnchecked icon
   */
  checkboxUnchecked?: null | React.ReactElement;
  /**
   * Provide custom styles.
   * Soon to be replaced with stylesheets and css variables
   */
  styles?: null | {
    explorerActionsStyle?: StyleMap;
    buttonStyle?: StyleMap;
    actionButtonStyle?: StyleMap;
  };
  showAttribution: boolean;
  /**
   * Decide whether to render the dropdown to add operations
   */
  hideActions?: boolean;
  /**
   * Provide external fragments to be used in the explorer
   */
  externalFragments?: FragmentDefinitionNode[];
};

export type WrapperProps = {
  width?: number;
  title?: string;
  explorerIsOpen: boolean;
  /**
   * A hook for when explorer is toggled
   */
  onToggleExplorer: () => void;
} & Props;

type State = {
  operation: null | OperationDefinitionNode;
  newOperationType: NewOperationType;
  operationToScrollTo: null | string;
};

function Attribution() {
  return (
    <div
      style={{
        fontFamily: 'sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: '1em',
        marginTop: 0,
        flexGrow: 1,
        justifyContent: 'flex-end',
      }}
    >
      <div
        style={{
          borderTop: '1px solid #d6d6d6',
          paddingTop: '1em',
          width: '100%',
          textAlign: 'center',
        }}
      >
        GraphiQL Explorer by <a href="https://www.onegraph.com">OneGraph</a>
      </div>
      <div>
        Contribute on{' '}
        <a href="https://github.com/OneGraph/graphiql-explorer">GitHub</a>
      </div>
    </div>
  );
}

export class Explorer extends React.PureComponent<Props, State> {
  static defaultProps = {
    getDefaultFieldNames: defaultGetDefaultFieldNames,
    getDefaultScalarArgValue: defaultGetDefaultScalarArgValue,
  };

  state = {
    newOperationType: 'query' as NewOperationType,
    operation: null,
    operationToScrollTo: null,
  };

  _ref: null | any;
  _resetScroll = () => {
    const container = this._ref;
    if (container) {
      container.scrollLeft = 0;
    }
  };
  componentDidMount() {
    this._resetScroll();
  }

  _onEdit = (query: string): void => this.props.onEdit(query);

  _setAddOperationType = (value: NewOperationType) => {
    this.setState({ newOperationType: value });
  };

  _handleRootViewMount = (rootViewElId: string) => {
    if (
      !!this.state.operationToScrollTo &&
      this.state.operationToScrollTo === rootViewElId
    ) {
      var selector = `.graphiql-explorer-root #${rootViewElId}`;

      var el = document.querySelector(selector);
      el && el.scrollIntoView();
    }
  };

  render() {
    const { schema, query, makeDefaultArg } = this.props;

    if (!schema) {
      return (
        <div style={{ fontFamily: 'sans-serif' }} className="error-container">
          No Schema Available
        </div>
      );
    }
    const styleConfig = {
      colors: this.props.colors || defaultColors,
      checkboxChecked: this.props.checkboxChecked || defaultCheckboxChecked,
      checkboxUnchecked:
        this.props.checkboxUnchecked || defaultCheckboxUnchecked,
      arrowClosed: this.props.arrowClosed || defaultArrowClosed,
      arrowOpen: this.props.arrowOpen || defaultArrowOpen,
      styles: this.props.styles
        ? {
            ...defaultStyles,
            ...this.props.styles,
          }
        : defaultStyles,
    };
    const queryType = schema.getQueryType();
    const mutationType = schema.getMutationType();
    const subscriptionType = schema.getSubscriptionType();
    if (!queryType && !mutationType && !subscriptionType) {
      return <div>Missing query type</div>;
    }
    const queryFields = queryType && queryType.getFields();
    const mutationFields = mutationType && mutationType.getFields();
    const subscriptionFields = subscriptionType && subscriptionType.getFields();

    const parsedQuery: DocumentNode = memoizeParseQuery(query);
    const getDefaultFieldNames =
      this.props.getDefaultFieldNames || defaultGetDefaultFieldNames;
    const getDefaultScalarArgValue =
      this.props.getDefaultScalarArgValue || defaultGetDefaultScalarArgValue;

    const definitions = parsedQuery.definitions;

    const _relevantOperations = definitions
      .map(definition => {
        if (definition.kind === Kind.FRAGMENT_DEFINITION) {
          return definition;
        } else if (definition.kind === Kind.OPERATION_DEFINITION) {
          return definition;
        } else {
          return null;
        }
      })
      .filter(Boolean);

    const relevantOperations =
      // If we don't have any relevant definitions from the parsed document,
      // then at least show an expanded Query selection
      (
        _relevantOperations.length === 0
          ? DEFAULT_DOCUMENT.definitions
          : _relevantOperations
      ) as readonly (OperationDefinitionNode | FragmentDefinitionNode)[];

    const renameOperation = (targetOperation, name) => {
      const newName =
        name == null || name === ''
          ? null
          : { kind: Kind.NAME, value: name, loc: undefined };
      const newOperation = { ...targetOperation, name: newName };

      const existingDefs = parsedQuery.definitions;

      const newDefinitions = existingDefs.map(existingOperation => {
        if (targetOperation === existingOperation) {
          return newOperation;
        } else {
          return existingOperation;
        }
      });

      return {
        ...parsedQuery,
        definitions: newDefinitions,
      };
    };

    const cloneOperation = (
      targetOperation: OperationDefinitionNode | FragmentDefinitionNode,
    ) => {
      let kind;
      if (targetOperation.kind === Kind.FRAGMENT_DEFINITION) {
        kind = 'fragment';
      } else {
        kind = targetOperation.operation;
      }

      const newOperationName =
        ((targetOperation.name && targetOperation.name.value) || '') + 'Copy';

      const newName = {
        kind: Kind.NAME,
        value: newOperationName,
        loc: undefined,
      };

      const newOperation = { ...targetOperation, name: newName };

      const existingDefs = parsedQuery.definitions;

      const newDefinitions = [...existingDefs, newOperation];

      this.setState({ operationToScrollTo: `${kind}-${newOperationName}` });

      return {
        ...parsedQuery,
        definitions: newDefinitions,
      };
    };

    const destroyOperation = targetOperation => {
      const existingDefs = parsedQuery.definitions;

      const newDefinitions = existingDefs.filter(existingOperation => {
        if (targetOperation === existingOperation) {
          return false;
        } else {
          return true;
        }
      });

      return {
        ...parsedQuery,
        definitions: newDefinitions,
      };
    };

    const addOperation = (kind: NewOperationType) => {
      const existingDefs = parsedQuery.definitions;

      const viewingDefaultOperation =
        parsedQuery.definitions.length === 1 &&
        parsedQuery.definitions[0] === DEFAULT_DOCUMENT.definitions[0];

      const MySiblingDefs = viewingDefaultOperation
        ? []
        : existingDefs.filter(def => {
            if (def.kind === Kind.OPERATION_DEFINITION) {
              return def.operation === kind;
            } else {
              // Don't support adding fragments from explorer
              return false;
            }
          });

      const newOperationName = `My${capitalize(kind)}${
        MySiblingDefs.length === 0 ? '' : MySiblingDefs.length + 1
      }`;

      // Add this as the default field as it guarantees a valid selectionSet
      const firstFieldName = '__typename # Placeholder value';

      const selectionSet = {
        kind: Kind.SELECTION_SET,
        selections: [
          {
            kind: Kind.FIELD,
            name: {
              kind: Kind.NAME,
              value: firstFieldName,
              loc: null,
            },
            arguments: [],
            directives: [],
            selectionSet: null,
            loc: null,
          },
        ],
        loc: null,
      };

      const newDefinition = {
        kind: Kind.OPERATION_DEFINITION,
        operation: kind,
        name: { kind: Kind.NAME, value: newOperationName },
        variableDefinitions: [],
        directives: [],
        selectionSet: selectionSet,
        loc: null,
      };

      const newDefinitions =
        // If we only have our default operation in the document right now, then
        // just replace it with our new definition
        viewingDefaultOperation
          ? [newDefinition]
          : [...parsedQuery.definitions, newDefinition];

      const newOperationDef = {
        ...parsedQuery,
        definitions: newDefinitions,
      } as DocumentNode;

      this.setState({ operationToScrollTo: `${kind}-${newOperationName}` });

      this.props.onEdit(print(newOperationDef));
    };

    const actionsOptions = [];

    if (queryFields) {
      actionsOptions.push(
        <option
          key="query"
          className={'toolbar-button'}
          style={styleConfig.styles.buttonStyle}
          itemType="link"
          value={'query' as NewOperationType}
        >
          Query
        </option>,
      );
    }
    if (mutationFields) {
      actionsOptions.push(
        <option
          key="mutation"
          className={'toolbar-button'}
          style={styleConfig.styles.buttonStyle}
          itemType="link"
          value={'mutation' as NewOperationType}
        >
          Mutation
        </option>,
      );
    }
    if (subscriptionFields) {
      actionsOptions.push(
        <option
          key="subscription"
          className={'toolbar-button'}
          style={styleConfig.styles.buttonStyle}
          itemType="link"
          value={'subscription' as NewOperationType}
        >
          Subscription
        </option>,
      );
    }

    const actionsEl =
      actionsOptions.length === 0 || this.props.hideActions ? null : (
        <div
          style={{
            minHeight: '50px',
            maxHeight: '50px',
            overflow: 'none',
          }}
        >
          <form
            className="variable-editor-title graphiql-explorer-actions"
            style={{
              ...styleConfig.styles.explorerActionsStyle,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              borderTop: '1px solid rgb(214, 214, 214)',
            }}
            onSubmit={event => event.preventDefault()}
          >
            <span
              style={{
                display: 'inline-block',
                flexGrow: '0',
                textAlign: 'right',
              }}
            >
              Add new{' '}
            </span>
            <select
              onChange={event =>
                this._setAddOperationType(
                  event.target.value as NewOperationType,
                )
              }
              value={this.state.newOperationType}
              style={{ flexGrow: '2' }}
            >
              {actionsOptions}
            </select>
            <button
              type="submit"
              className="toolbar-button"
              onClick={() =>
                this.state.newOperationType
                  ? addOperation(
                      this.state.newOperationType as NewOperationType,
                    )
                  : null
              }
              style={{
                ...styleConfig.styles.buttonStyle,
                height: '22px',
                width: '22px',
              }}
            >
              <span>+</span>
            </button>
          </form>
        </div>
      );

    const externalFragments =
      this.props.externalFragments &&
      this.props.externalFragments.reduce((acc, fragment) => {
        if (fragment.kind === Kind.FRAGMENT_DEFINITION) {
          const fragmentTypeName = fragment.typeCondition.name.value;
          const existingFragmentsForType = acc[fragmentTypeName] || [];
          const newFragmentsForType = [
            ...existingFragmentsForType,
            fragment,
          ].sort((a, b) => a.name.value.localeCompare(b.name.value));
          return {
            ...acc,
            [fragmentTypeName]: newFragmentsForType,
          };
        }

        return acc;
      }, {});

    const documentFragments: AvailableFragments = relevantOperations.reduce(
      (acc, operation) => {
        if (operation.kind === Kind.FRAGMENT_DEFINITION) {
          const fragmentTypeName = operation.typeCondition.name.value;
          const existingFragmentsForType = acc[fragmentTypeName] || [];
          const newFragmentsForType = [
            ...existingFragmentsForType,
            operation,
          ].sort((a, b) => a.name.value.localeCompare(b.name.value));
          return {
            ...acc,
            [fragmentTypeName]: newFragmentsForType,
          };
        }

        return acc;
      },
      {},
    );

    const availableFragments = { ...documentFragments, ...externalFragments };

    const attribution = this.props.showAttribution ? <Attribution /> : null;

    return (
      <div
        ref={ref => {
          this._ref = ref;
        }}
        style={{
          fontSize: 12,
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          margin: 0,
          padding: 8,
          fontFamily:
            'Consolas, Inconsolata, "Droid Sans Mono", Monaco, monospace',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
        className="graphiql-explorer-root"
      >
        <div
          style={{
            flexGrow: '1',
            overflow: 'scroll',
          }}
        >
          {relevantOperations.map((operation, index) => {
            const operationName =
              operation && operation.name && operation.name.value;

            const operationType =
              operation.kind === Kind.FRAGMENT_DEFINITION
                ? 'fragment'
                : (operation && operation.operation) || 'query';

            const onOperationRename = newName => {
              const newOperationDef = renameOperation(operation, newName);
              this.props.onEdit(print(newOperationDef));
            };

            const onOperationClone = () => {
              const newOperationDef = cloneOperation(operation);
              this.props.onEdit(print(newOperationDef as DocumentNode));
            };

            const onOperationDestroy = () => {
              const newOperationDef = destroyOperation(operation);
              this.props.onEdit(print(newOperationDef));
            };

            const fragmentType =
              operation?.kind === Kind.FRAGMENT_DEFINITION &&
              operation?.typeCondition?.kind === Kind.NAMED_TYPE &&
              schema.getType(operation.typeCondition.name.value);

            const fragmentFields =
              fragmentType instanceof GraphQLObjectType
                ? fragmentType.getFields()
                : null;

            const fields =
              operationType === 'query'
                ? queryFields
                : operationType === 'mutation'
                ? mutationFields
                : operationType === 'subscription'
                ? subscriptionFields
                : operation?.kind === Kind.FRAGMENT_DEFINITION
                ? fragmentFields
                : null;

            console.log(fields);

            const fragmentTypeName =
              operation?.kind === Kind.FRAGMENT_DEFINITION
                ? operation.typeCondition.name.value
                : null;

            const onCommit = (parsedDocument: DocumentNode) => {
              const textualNewDocument = print(parsedDocument);

              this.props.onEdit(textualNewDocument);
            };

            return (
              <RootView
                key={index}
                isLast={index === relevantOperations.length - 1}
                fields={fields}
                operationType={operationType}
                name={operationName}
                definition={operation}
                onOperationRename={onOperationRename}
                onOperationDestroy={onOperationDestroy}
                onOperationClone={onOperationClone}
                onTypeName={fragmentTypeName}
                onMount={this._handleRootViewMount}
                onCommit={onCommit}
                onEdit={(
                  newDefinition:
                    | null
                    | OperationDefinitionNode
                    | FragmentDefinitionNode,
                  options: CommitOptions,
                ): DocumentNode => {
                  let commit;
                  if (
                    typeof options === 'object' &&
                    typeof options.commit !== 'undefined'
                  ) {
                    commit = options.commit;
                  } else {
                    commit = true;
                  }

                  if (!!newDefinition) {
                    const newQuery: DocumentNode = {
                      ...parsedQuery,
                      definitions: parsedQuery.definitions.map(
                        existingDefinition =>
                          existingDefinition === operation
                            ? newDefinition
                            : existingDefinition,
                      ),
                    };

                    if (commit) {
                      onCommit(newQuery);
                      return newQuery;
                    } else {
                      return newQuery;
                    }
                  } else {
                    return parsedQuery;
                  }
                }}
                schema={schema}
                getDefaultFieldNames={getDefaultFieldNames}
                getDefaultScalarArgValue={getDefaultScalarArgValue}
                makeDefaultArg={makeDefaultArg}
                onRunOperation={() => {
                  if (!!this.props.onRunOperation) {
                    this.props.onRunOperation(operationName);
                  }
                }}
                styleConfig={styleConfig as StyleConfig}
                availableFragments={availableFragments}
              />
            );
          })}
          {attribution}
        </div>

        {actionsEl}
      </div>
    );
  }
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: any; errorInfo: any }
> {
  state = { hasError: false, error: null, errorInfo: null };

  componentDidCatch(error, errorInfo) {
    this.setState({ hasError: true, error: error, errorInfo: errorInfo });
    console.error('Error in component', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 18, fontFamily: 'sans-serif' }}>
          <div>Something went wrong</div>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error ? this.state.error.toString() : null}
            <br />
            {this.state.errorInfo ? this.state.errorInfo.componentStack : null}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

export class ExplorerWrapper extends React.PureComponent<WrapperProps, {}> {
  static defaultValue = defaultValue;
  static defaultProps = {
    width: 320,
    title: 'Explorer',
  };

  render() {
    return (
      <div
        className="docExplorerWrap"
        style={{
          height: '100%',
          width: this.props.width,
          minWidth: this.props.width,
          zIndex: 7,
          display: this.props.explorerIsOpen ? 'flex' : 'none',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div className="doc-explorer-title-bar">
          <div className="doc-explorer-title">{this.props.title}</div>
          <div className="doc-explorer-rhs">
            <div
              className="docExplorerHide"
              onClick={this.props.onToggleExplorer}
            >
              {'\u2715'}
            </div>
          </div>
        </div>
        <div
          className="doc-explorer-contents"
          style={{
            padding: '0px',
            /* Unset overflowY since docExplorerWrap sets it and it'll
            cause two scrollbars (one for the container and one for the schema tree) */
            overflowY: 'unset',
          }}
        >
          <ErrorBoundary>
            <Explorer {...this.props} />
          </ErrorBoundary>
        </div>
      </div>
    );
  }
}
