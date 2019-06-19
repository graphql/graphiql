/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { GraphQLField } from 'graphql';
import Argument from './Argument';
import MarkdownContent from './MarkdownContent';
import TypeLink from './TypeLink';

type FieldDocProps = {
  field?: GraphQLField<any, any>;
  onClickType?: (...args: any[]) => any;
};
export default class FieldDoc extends React.Component<FieldDocProps, {}> {
  shouldComponentUpdate(nextProps: FieldDocProps) {
    return this.props.field !== nextProps.field;
  }
  render() {
    const field = this.props.field;
    let argsDef: React.ReactElement;
    if (field.args && field.args.length > 0) {
      argsDef = (
        <div className="doc-category">
          <div className="doc-category-title">{'arguments'}</div>
          {field.args.map(arg => (
            <div key={arg.name} className="doc-category-item">
              <div>
                <Argument arg={arg} onClickType={this.props.onClickType} />
              </div>
              <MarkdownContent
                className="doc-value-description"
                markdown={arg.description}
              />
            </div>
          ))}
        </div>
      );
    }
    return (
      <div>
        <MarkdownContent
          className="doc-type-description"
          markdown={field.description || 'No Description'}
        />
        {field.deprecationReason && (
          <MarkdownContent
            className="doc-deprecation"
            markdown={field.deprecationReason}
          />
        )}
        <div className="doc-category">
          <div className="doc-category-title">{'type'}</div>
          <TypeLink type={field.type} onClick={this.props.onClickType} />
        </div>
        {argsDef}
      </div>
    );
  }
}
