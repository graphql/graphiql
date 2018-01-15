import React from 'react';
import PropTypes from 'prop-types';

export function RequestOptions(props) {
  return (
    <div>
      <div className="request-options-title-bar">
        <div className="request-options-title">{'Request options'}</div>
        <div className="doc-explorer-rhs">
          {props.children}
        </div>
      </div>
      <div className="request-options-contents">
        <label className="input-container">
          {'Content-Type:'}
          <select
            value={props.headers['Content-Type']}
            onChange={props.handleOnChange('headers.Content-Type')}>
            <option>{'application/json'}</option>
            <option>{'application/graphql'}</option>
            <option>{'application/text'}</option>
          </select>
        </label>
        <label className="input-container">
          {'Method:'}
          <select
            onChange={props.handleOnChange('method')}
            value={props.method}>
            <option>{'POST'}</option>
            <option>{'GET'}</option>
          </select>
        </label>
        <label className="input-container">
          {'Include X-CSRFToken:'}
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
  handleOnChange: PropTypes.func,
};
