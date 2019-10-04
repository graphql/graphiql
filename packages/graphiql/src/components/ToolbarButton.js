/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';

/**
 * ToolbarButton
 *
 * A button to use within the Toolbar.
 */
class ToolbarButtonSource extends React.Component {
  static propTypes = {
    onClick: PropTypes.func,
    title: PropTypes.string,
    label: PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  render() {
    const { t } = this.props; //   i18n tranlator. { t, i18n }

    const { error } = this.state;
    return (
      <a
        className={'toolbar-button' + (error ? ' error' : '')}
        onMouseDown={preventDefault}
        onClick={this.handleClick}
        title={ t(error ? error.message : this.props.title) }>
        { t(this.props.label) }
      </a>
    );
  }

  handleClick = e => {
    e.preventDefault();
    try {
      this.props.onClick();
      this.setState({ error: null });
    } catch (error) {
      this.setState({ error });
    }
  };
}

export const ToolbarButton = withTranslation('Toolbar')(ToolbarButtonSource);

function preventDefault(e) {
  e.preventDefault();
}
