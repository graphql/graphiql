/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE-examples file in the root directory of this source tree.
 */

import React from 'react';
import { ExecuteButton } from './ExecuteButton';
import { QueryEditor } from './QueryEditor';
import { VariableEditor } from './VariableEditor';
import { ResultViewer } from './ResultViewer';
// import { DocExplorer } from './DocExplorer';
import { introspectionQuery, buildClientSchema } from 'graphql/utilities';
import find from 'graphql/jsutils/find';
import { fillLeafs } from '../utility/fillLeafs';


/**
 * GraphiQL
 *
 * This React component is responsible for rendering the GraphiQL editor.
 *
 * Props:
 *
 *   - fetcher: a function which accepts GraphQL-HTTP parameters and returns
 *     a Promise which resolves to the GraphQL parsed JSON response.
 *
 *   - schema: an optional GraphQLSchema instance. If one is not provided,
 *     GraphiQL will fetch one using introspection.
 *
 *   - query: an optional GraphQL string to use as the initial displayed query,
 *     if not provided, the local storage or defaultQuery will be used.
 *
 *   - defaultQuery: an optional GraphQL string to use instead of a
 *     blank screen when a query was not found in the local cache.
 *
 *   - variables: an optional GraphQL string to use as the initial displayed
 *     query variables, if not provided, the local storage will be used.
 *
 *   - onEditQuery: an optional function which will be called when the Query
 *     editor changes. The argument to the function will be the query string.
 *
 *   - onEditVariables: an optional function which will be called when the Query
 *     varible editor changes. The argument to the function will be the
 *     variables string.
 *
 *   - getDefaultFieldNames: an optional function used to provide default fields
 *     to non-leaf fields which invalidly lack a selection set.
 *     Accepts a GraphQLType instance and returns an array of field names.
 *     If not provided, a default behavior will be used.
 *
 * Children:
 *
 *   - <GraphiQL.Logo> Replace the GraphiQL logo with your own.
 *
 *   - <GraphiQL.Toolbar> Add a custom toolbar above GraphiQL.
 *
 *   - <GraphiQL.Footer> Add a custom footer below GraphiQL Results.
 *
 */
export class GraphiQL extends React.Component {
  constructor(props) {
    super();

    // Ensure props are correct
    if (typeof props.fetcher !== 'function') {
      throw new TypeError('GraphiQL requires a fetcher function.');
    }

    var storage = window.localStorage;

    // Determine the initial query to display.
    var query =
      props.query ||
      storage.getItem('query') ||
      props.defaultQuery ||
      defaultQuery;

    // Determine the initial variables to display.
    var variables = props.variables || storage.getItem('variables');

    // Initialize state
    this.state = {
      schema: props.schema,
      query,
      variables,
      response: null,
      editorFlex: storage.getItem('editorFlex') || 1,
      variableEditorOpen: Boolean(variables),
      variableEditorHeight: storage.getItem('variableEditorHeight') || 200,
      typeToExplore: null,
    };

    // Ensure only the last executed editor query is rendered.
    this.editorQueryID = 0;
  }

  componentWillReceiveProps(nextProps) {
    var nextQuery = this.state.query;
    var nextVariables = this.state.variables;
    if (nextProps.query && nextProps.query !== nextQuery) {
      nextQuery = nextProps.query;
    }
    if (nextProps.variables && nextProps.variables !== nextVariables) {
      nextVariables = nextProps.variables;
    }
    this.setState({
      query: nextQuery,
      variables: nextVariables
    });
  }

  /**
   * Inspect the query, automatically filling in selection sets for non-leaf
   * fields which do not yet have them.
   */
  autoCompleteLeafs() {
    var { insertions, result } = fillLeafs(
      this.state.schema,
      this.state.query,
      this.props.getDefaultFieldNames
    );
    if (insertions) {
      var editor = this.refs.queryEditor.getCodeMirror();
      editor.setValue(result);
      var added = 0;
      var markers = insertions.map(({ index, string }) => editor.markText(
        editor.posFromIndex(index + added),
        editor.posFromIndex(index + (added += string.length)),
        {
          className: 'autoInsertedLeaf',
          clearOnEnter: true,
          title: 'Automatically added leaf fields'
        }
      ));
      setTimeout(() => markers.forEach(marker => marker.clear()), 7000);
    }
  }

  _fetchQuery(query, variables, cb) {
    this.props.fetcher({ query, variables }).then(cb).catch(error => {
      this.setState({ response: JSON.stringify(error, null, 2) });
    });
  }

  _runEditorQuery() {
    this.editorQueryID++;
    var queryID = this.editorQueryID;

    this.autoCompleteLeafs();

    this._fetchQuery(this.state.query, this.state.variables, result => {
      if (queryID === this.editorQueryID) {
        this.setState({ response: JSON.stringify(result, null, 2) });
      }
    });
  }

  componentDidMount() {
    if (!this.state.schema) {
      this._fetchQuery(introspectionQuery, null, result => {
        if (!result.data) {
          this.setState({ response: JSON.stringify(result, null, 2) });
        } else {
          this.setState({ schema: buildClientSchema(result.data) });
        }
      });
    }
  }

  _onHintInformationRender(elem) {
    var onClickHintInformation = this._onClickHintInformation.bind(this);
    elem.addEventListener('click', onClickHintInformation);

    var onRemoveFn;
    elem.addEventListener('DOMNodeRemoved', onRemoveFn = () => {
      elem.removeEventListener('DOMNodeRemoved', onRemoveFn);
      elem.removeEventListener('click', onClickHintInformation);
    });
  }

  _onClickHintInformation(event) {
    if (event.target.className === 'infoType') {
      var typeName = event.target.innerHTML;
      this.setState({
        typeToExplore: typeName
      });
    }
  }

  _onUpdate() {
    this.forceUpdate();
  }

  _onEditQuery(value) {
    window.localStorage.setItem('query', value);
    this.setState({ query: value });
    this.props.onEditQuery && this.props.onEditQuery(value);
  }

  _onEditVariables(value) {
    window.localStorage.setItem('variables', value);
    this.setState({ variables: value });
    this.props.onEditVariables && this.props.onEditVariables(value);
  }

  render() {
    var children = [];
    React.Children.forEach(this.props.children, child => {
      children.push(child);
    });

    var logo = find(children, child => child.type === GraphiQL.Logo) ||
      <GraphiQL.Logo />;

    var toolbar = find(children, child => child.type === GraphiQL.Toolbar);
    var footer = find(children, child => child.type === GraphiQL.Footer);

    var variableOpen = this.state.variableEditorOpen;
    var variableHeight = variableOpen ? this.state.variableEditorHeight : null;

    return (
      <div id="graphiql-container">
        <div className="topBar">
          {logo}
          <ExecuteButton onClick={this._runEditorQuery.bind(this)} />
          {toolbar}
        </div>
        <div
          ref="editorBar"
          className="editorBar"
          onMouseDown={this.onResizeStart.bind(this)}
        >
          <div className="queryWrap" style={{ flex: this.state.editorFlex }}>
            <QueryEditor
              ref="queryEditor"
              schema={this.state.schema}
              value={this.state.query}
              onEdit={this._onEditQuery.bind(this)}
              onHintInformationRender={this._onHintInformationRender.bind(this)}
            />
            <div className="variable-editor" style={{ height: variableHeight }}>
              <div
                className="variable-editor-title"
                style={{ cursor: variableOpen ? 'row-resize' : 'n-resize' }}
                onMouseDown={this.onVariableResizeStart.bind(this)}
              >
                Query Variables
              </div>
              <VariableEditor
                value={this.state.variables}
                onEdit={this._onEditVariables.bind(this)}
              />
            </div>
          </div>
          <div className="resultWrap">
            <ResultViewer ref="result" value={this.state.response} />
            {footer}
          </div>
        </div>
        <div className="docExplorerWrap">
          {// Temporarily disabled.
          /* <DocExplorer
            ref="docExplorer"
            schema={this.state.schema}
            typeName={this.state.typeToExplore}
          /> */}
        </div>
      </div>
    );
  }

  onResizeStart(downEvent) {
    if (this.mouseMoveListener || !this.didClickDragBar(downEvent)) {
      return;
    }
    this.mouseOffset = downEvent.clientX - getLeft(downEvent.target);
    downEvent.preventDefault();
    this.mouseMoveListener = moveEvent => {
      if (moveEvent.buttons === 0) {
        this.onResizeEnd();
      } else {
        this.onResize(moveEvent);
      }
    };
    this.mouseUpListener = () => {
      this.onResizeEnd();
    };
    document.addEventListener('mousemove', this.mouseMoveListener);
    document.addEventListener('mouseup', this.mouseUpListener);
  }

  onResizeEnd() {
    window.localStorage.setItem('editorFlex', this.state.editorFlex);
    document.removeEventListener('mousemove', this.mouseMoveListener);
    document.removeEventListener('mouseup', this.mouseUpListener);
    this.mouseMoveListener = null;
    this.mouseUpListener = null;
  }

  onResize(event) {
    var editorBar = React.findDOMNode(this.refs.editorBar);
    var leftSize = event.clientX - getLeft(editorBar) - this.mouseOffset;
    var rightSize = editorBar.clientWidth - leftSize;
    this.setState({ editorFlex: leftSize / rightSize });
  }

  didClickDragBar(event) {
    // Only for primary unmodified clicks
    if (event.button !== 0 || event.ctrlKey) {
      return false;
    }
    var target = event.target;
    // We use codemirror's gutter as the drag bar.
    if (target.className.indexOf('CodeMirror-gutter') !== 0) {
      return false;
    }
    // Specifically the result window's drag bar.
    var resultWindow = React.findDOMNode(this.refs.result);
    while (target) {
      if (target === resultWindow) {
        return true;
      }
      target = target.parentNode;
    }
    return false;
  }

  onVariableResizeStart(downEvent) {
    var wasOpen = this.state.variableEditorOpen;
    var hadHeight = this.state.variableEditorHeight;
    if (!wasOpen) {
      this.setState({
        variableEditorOpen: true,
        variableEditorHeight: 30,
      });
    }
    this.mouseOffset = downEvent.clientY - getTop(downEvent.target);
    downEvent.preventDefault();
    var didMove = false;
    this.mouseMoveListener = moveEvent => {
      didMove = true;
      if (moveEvent.buttons === 0) {
        this.onVariableResizeEnd();
      } else {
        this.onVariableResize(moveEvent);
      }
    };
    this.mouseUpListener = upEvent => {
      upEvent.preventDefault();
      if (!didMove) {
        var isOpen = !wasOpen;
        this.setState({
          variableEditorOpen: isOpen,
          variableEditorHeight: hadHeight,
        });

        // Simulate a window resize event so any CodeMirror instances become
        // properly rendered.
        window.dispatchEvent(new Event('resize'));
      } else {
        this.onVariableResizeEnd();
      }
    };
    document.addEventListener('mousemove', this.mouseMoveListener);
    document.addEventListener('mouseup', this.mouseUpListener);
  }

  onVariableResizeEnd() {
    if (this.state.variableEditorHeight === 30) {
      window.localStorage.setItem('variableEditorHeight', 200);
      this.setState({ variableEditorOpen: false, variableEditorHeight: 200 });
    } else {
      window.localStorage.setItem(
        'variableEditorHeight',
        this.state.variableEditorHeight
      );
    }
    document.removeEventListener('mousemove', this.mouseMoveListener);
    document.removeEventListener('mouseup', this.mouseUpListener);
    this.mouseMoveListener = null;
    this.mouseUpListener = null;
  }

  onVariableResize(event) {
    var editorBar = React.findDOMNode(this.refs.editorBar);
    var topSize = event.clientY - getTop(editorBar) - this.mouseOffset;
    var bottomSize = editorBar.clientHeight - topSize;
    if (bottomSize < 60) {
      bottomSize = 30;
    }
    this.setState({ variableEditorHeight: bottomSize });

    // Simulate a window resize event so any CodeMirror instances become
    // properly rendered.
    window.dispatchEvent(new Event('resize'));
  }
}

// Configure the UI by providing this Component as a child of GraphiQL.
GraphiQL.Logo = class GraphiQLLogo extends React.Component {
  render() {
    return (
      <div className="title">
        {this.props.children || <span>Graph<em>i</em>QL</span>}
      </div>
    );
  }
};

// Configure the UI by providing this Component as a child of GraphiQL.
GraphiQL.Toolbar = class GraphiQLToolbar extends React.Component {
  render() {
    return (
      <div className="toolbar">
        {this.props.children}
      </div>
    );
  }
};

// Configure the UI by providing this Component as a child of GraphiQL.
GraphiQL.Footer = class GraphiQLFooter extends React.Component {
  render() {
    return (
      <div className="footer">
        {this.props.children}
      </div>
    );
  }
};

const defaultQuery =
`# Welcome to GraphiQL
#
# GraphiQL is an in-browser IDE for writing, validating, and
# testing GraphQL queries.
#
# Type queries into this side of the screen, and you will
# see intelligent typeaheads aware of the current GraphQL type schema and
# live syntax and validation errors highlighted within the text.
#
# To bring up the auto-complete at any point, just press Ctrl-Space.
#
# Press the run button above, or Cmd-Enter to execute the query, and the result
# will appear in the pane to the right.

`;

function getLeft(initialElem) {
  var pt = 0;
  var elem = initialElem;
  while (elem.offsetParent) {
    pt += elem.offsetLeft;
    elem = elem.offsetParent;
  }
  return pt;
}

function getTop(initialElem) {
  var pt = 0;
  var elem = initialElem;
  while (elem.offsetParent) {
    pt += elem.offsetTop;
    elem = elem.offsetParent;
  }
  return pt;
}
