import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import Store from './Store';

class HistoryQuery extends React.Component {
  static propTypes = {
    query: PropTypes.string,
    variables: PropTypes.string,
    operationName: PropTypes.string,
  }

  get displayName() {
    if (this.props.operationName) {
      return this.props.operationName;
    }
    return this.props.query.split('\n').filter((line) => line.indexOf('#') !== 0).join('').replace('\s', '');
  }

  setQuery() {
    this.props.setQuery(this.props.query, this.props.variables,  this.props.operationName)
  }

  render() {
    return (
      <p onClick={this.setQuery.bind(this)}>{this.displayName}</p>
    )
  }
}

function shouldSaveQuery(nextProps, current, last) {
  if (nextProps.queryID === current.queryID) {
    return false
  }
  if (!last) {
    return true;
  }
  if ((nextProps.query === last.query) && (nextProps.variables === last.variables)) {
    return false;
  }
  return true;
}

export default class QueryHistory extends React.Component {
 static propTypes = {
   query: PropTypes.string,
   variables: PropTypes.string,
   operationName: PropTypes.string,
   queryID: PropTypes.number,
   setQuery: PropTypes.func,
 }

 constructor(props) {
   super(props);
   this.store = new Store('queries');
   this.state = {
     queries: this.store.fetchAll()
   }
 }

 componentWillReceiveProps(nextProps) {
   if (shouldSaveQuery(nextProps, this.props, this.store.fetchRecent())) {
     const queries = this.store.push({
       query: nextProps.query,
       variables: nextProps.variables,
       operationName: nextProps.operationName,
     });
     this.setState({
       queries: this.store.items,
     });
   }
 }

 render() {
   const queries = this.state.queries.map((query, i) => {
     return (
      <HistoryQuery key={i} {...query} setQuery={this.props.setQuery} />
     )
   });
   return (
     <div>
     <div className="history-title-bar">
      <div className="history-title">History</div>
     </div>
      <div className="history-contents">
        {queries}
      </div>
    </div>
   )
 }
}
