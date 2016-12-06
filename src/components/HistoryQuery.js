import React, { PropTypes } from 'react';

const HistoryQuery = (props) => {
  const setQuery = () => {
    props.setQuery(props.query, props.variables,  props.operationName)
  }

  let displayName;
  if (props.operationName) {
    displayName = props.operationName;
  } else {
    displayName =  props.query.split('\n').filter((line) => line.indexOf('#') !== 0).join('');
  }

  return (
    <p onClick={setQuery}>{displayName}</p>
  )
}

export default HistoryQuery;
