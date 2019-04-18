/**
 *  Copyright (c) Facebook, Inc. and its affiliates.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

function tokenToURL(token) {
  if (token.type !== 'string') {
    return null;
  }

  const value = token.string
    .slice(1)
    .slice(0, -1)
    .trim();
  let url;
  try {
    let location = window.location;
    return new URL(value, location.protocol + '//' + location.host);
  } catch (err) {
    return null;
  }
}

function isImageURL(url) {
  return /(bmp|gif|jpeg|jpg|png|svg)$/.test(url.pathname);
}

export class ImagePreview extends React.Component {
  state = {
    width: null,
    height: null,
    src: null,
    mime: null,
  };

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this._updateMetadata();
  }

  componentDidUpdate() {
    this._updateMetadata();
  }

  render() {
    let dims = null;
    if (this.state.width != null && this.state.height != null) {
      let dimensions = this.state.width + 'x' + this.state.height;
      if (this.state.mime != null) {
        dimensions += ' ' + this.state.mime;
      }

      dims = <div>{dimensions}</div>;
    }

    return (
      <div>
        <img
          onLoad={() => this._updateMetadata()}
          ref={node => {
            this._node = node;
          }}
          src={tokenToURL(this.props.token)}
        />
        {dims}
      </div>
    );
  }

  _updateMetadata() {
    if (!this._node) {
      return;
    }

    let width = this._node.naturalWidth;
    let height = this._node.naturalHeight;
    let src = this._node.src;

    if (src !== this.state.src) {
      this.setState({ src: src });
      fetch(src, { method: 'HEAD' }).then(response => {
        this.setState({
          mime: response.headers.get('Content-Type'),
        });
      });
    }

    if (width !== this.state.width || height !== this.state.height) {
      this.setState({
        height: height,
        width: width,
      });
    }
  }

  static shouldRender(token) {
    const url = tokenToURL(token);
    return url ? isImageURL(url) : false;
  }
}
