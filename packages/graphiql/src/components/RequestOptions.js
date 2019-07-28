import React from 'react';
import PropTypes from 'prop-types';

export function RequestOptions(props) {
  return (
    <div>
      <div className="request-options-title-bar">
        <div className="request-options-title">{'Request options'}</div>
        <div className="doc-explorer-rhs">{props.children}</div>
      </div>
      <div className="request-options-contents">
        <label className="input-container">
          <span>{'Content-Type:'}</span>
          <select
            value={props.headers['Content-Type']}
            onChange={e => props.onContentTypeChange(e.target.value)}>
            <option>{'application/json'}</option>
            <option>{'application/graphql'}</option>
            <option>{'application/text'}</option>
          </select>
        </label>
        <label className="input-container">
          <span>{'Method:'}</span>
          <select onChange={e => props.onMethodChange(e.target.value)} value={props.method}>
            <option>{'POST'}</option>
            <option>{'GET'}</option>
          </select>
        </label>
        <label className="input-container">
          <span>{'Include X-CSRFToken:'}</span>
          <input
            type="checkbox"
            onChange={props.handleToggleCsrfToken}
            checked={props.hasToken}
          />
        </label>
      </div>
    </div>
  );
}

RequestOptions.propTypes = {
  headers: PropTypes.shape({
    Accept: PropTypes.string,
    'Content-Type': PropTypes.string,
  }),
  method: PropTypes.string,
  hasToken: PropTypes.bool,
  handleToggleCsrfToken: PropTypes.func,
  onContentTypeChange: PropTypes.func,
  onMethodChange: PropTypes.func,
};
