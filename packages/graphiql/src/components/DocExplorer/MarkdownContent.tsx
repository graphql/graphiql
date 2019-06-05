/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import MD from 'markdown-it';
const md = new MD();

type MarkdownContentProps = {
  markdown?: string;
  className?: string;
};
export default class MarkdownContent extends React.Component<
  MarkdownContentProps,
  {}
> {
  shouldComponentUpdate(nextProps: MarkdownContentProps) {
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
