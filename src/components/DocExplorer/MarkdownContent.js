/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import MD from 'markdown-it';

const md = new MD();

export default class MarkdownContent extends React.Component {
  static propTypes = {
    markdown: PropTypes.string,
    className: PropTypes.string,
  };

  shouldComponentUpdate(nextProps) {
    return this.props.markdown !== nextProps.markdown;
  }

  render() {
    const markdown = this.props.markdown;
    if (!markdown) {
      return <div />;
    }

    return (
      <div
        className={this.props.className}
        dangerouslySetInnerHTML={{ __html: md.render(markdown) }}
      />
    );
  }
}
