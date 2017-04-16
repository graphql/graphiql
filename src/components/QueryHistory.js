import { parse } from 'graphql';
import React, { PropTypes } from 'react';
import HistoryStore from '../utility/HistoryStore';
import HistoryQuery from './HistoryQuery';

const shouldSaveQuery = (nextProps, current, lastQuerySaved) => {
  if (nextProps.queryID === current.queryID) {
    return false;
  }
  try {
    parse(nextProps.query);
  } catch (e) {
    return false;
  }
  if (!lastQuerySaved) {
    return true;
  }
  if (JSON.stringify(nextProps.query) ===
    JSON.stringify(lastQuerySaved.query)) {
    if (JSON.stringify(nextProps.variables) ===
      JSON.stringify(lastQuerySaved.variables)) {
      return false;
    }
    if (!nextProps.variables && !lastQuerySaved.variables) {
      return false;
    }
  }
  return true;
};

const MAX_HISTORY_LENGTH = 20;

export class QueryHistory extends React.Component {
  static propTypes = {
    query: PropTypes.string,
    variables: PropTypes.string,
    operationName: PropTypes.string,
    queryID: PropTypes.number,
    onSelectQuery: PropTypes.func,
    storage: PropTypes.object,
  }

  constructor(props) {
    super(props);
    this.store = new HistoryStore('queries', props.storage);
    this.state = {
      queries: this.store.fetchAll()
    };
  }

  componentWillReceiveProps(nextProps) {
    if (shouldSaveQuery(nextProps, this.props, this.store.fetchRecent())) {
      this.store.push({
        query: nextProps.query,
        variables: nextProps.variables || '',
        operationName: nextProps.operationName || '',
      });
      if (this.store.length > MAX_HISTORY_LENGTH) {
        this.store.shift();
      }
      this.setState({
        queries: this.store.items,
      });
    }
  }

  render() {
    const queries = this.state.queries.slice().reverse();
    const queryNodes = queries.map((query, i) => {
      return (
        <HistoryQuery key={i} {...query} onSelect={this.props.onSelectQuery} />
      );
    });
    return (
      <div>
        <div className="history-title-bar">
          <div className="history-title">{'History'}</div>
          <div className="doc-explorer-rhs">
            {this.props.children}
          </div>
        </div>
        <div className="history-contents">
          {queryNodes}
        </div>
      </div>
    );
  }
}
