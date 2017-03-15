import QueryStore from './QueryStore';
import React, { PropTypes } from 'react';

function cleanQuery(query) {
  return query.split('\n').filter((line) => {
    return line.indexOf('#') !== 0;
  }).join('');
}

export class QueryHistory extends React.Component {
  static propTypes = {
    query: PropTypes.string,
    operationName: PropTypes.string,
    variables: PropTypes.string,
    editorQueryID: PropTypes.number,
    loadQuery: PropTypes.func,
  }

  constructor(props) {
    super(props);
    this.store = new QueryStore();
    this.state = {
      queries: this.store.fetchAll()
    }
    this.lastQuery = this.store.fetchLatest() || {};
  }

  componentWillReceiveProps(nextProps) {
    if (((nextProps.variables !== this.lastQuery.variables) || (nextProps.query !== this.lastQuery.query)) && nextProps.editorQueryID > this.props.editorQueryID) {
      this.lastQuery = this.props;
      this.store.push(nextProps);
      this.setState({
        queries: this.store.fetchAll()
      });
    }
  }

  loadQuery(query) {
    this.props.loadQuery(query);
  }

  render() {
    const pastQueries = this.state.queries.slice().reverse().map((query, i) => {
      return <li onClick={() => this.loadQuery(query)} key={i}>{cleanQuery(query.query)}</li>;
    });
    return (
      <div className="history">
        <div className="history-list">
          <h2>History</h2>
          <ul>
            {pastQueries}
          </ul>
        </div>
      </div>
    )
  }
}
