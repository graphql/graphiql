import React from 'react';
import PropTypes from 'prop-types';

const HistoryQuery = ({query, variables, operationName, onSelect}) => {
  const onClick = () => {
    onSelect(query, variables, operationName);
  };

  let displayName;
  if (operationName) {
    displayName = operationName;
  } else {
    displayName = query.split('\n')
      .filter(line => line.indexOf('#') !== 0).join('');
  }

  return (
    <p onClick={onClick}>{displayName}</p>
  );
};

HistoryQuery.propTypes = {
  query: PropTypes.string,
  variables: PropTypes.string,
  operationName: PropTypes.string,
  onSelect: PropTypes.func,
};

export default HistoryQuery;
