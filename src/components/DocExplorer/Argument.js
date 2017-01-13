import React, { PropTypes } from 'react';
import TypeLink from './TypeLink';

const Argument = ({ arg, onClickType }) => {
  return (
    <span className="arg">
      <span className="arg-name">{arg.name}</span>
      {': '}
      <TypeLink type={arg.type} onClick={onClickType} />
      { renderDefaultValue(arg) }
    </span>
  );
};

function renderDefaultValue(arg) {
  if (arg.defaultValue === undefined) {
    return null;
  }

  return (
    <span>
      {' = '}
      <span className="arg-default-value">
        { arg.defaultValue === '' ? '""' : arg.defaultValue }
      </span>
    </span>
  );
}

Argument.propTypes = {
  arg: PropTypes.object.isRequired,
  onClickType: PropTypes.func.isRequired,
};

export default Argument;
