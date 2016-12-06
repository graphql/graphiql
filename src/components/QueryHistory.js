import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import Store from './Store';
import HistoryQuery from './HistoryQuery';

const shouldSaveQuery = (nextProps, current, last) => {
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

const MAX_HISTORY_LENGTH = 20;

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
      <HistoryQuery key={i} {...query} setQuery={this.props.setQuery} />
     )
   });
   return (
     <div>
     <div className="history-title-bar">
      <div className="history-title">History</div>
      <div className="doc-explorer-rhs">
        {this.props.children}
      </div>
     </div>
      <div className="history-contents">
        {queryNodes}
      </div>
    </div>
   )
 }
}
