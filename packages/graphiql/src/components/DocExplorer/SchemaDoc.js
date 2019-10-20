/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';

import TypeLink from './TypeLink';
import MarkdownContent from './MarkdownContent';
import { withTranslation } from 'react-i18next';

// Render the top level Schema
class SchemaDocSource extends React.Component {
  static propTypes = {
    schema: PropTypes.object,
    onClickType: PropTypes.func,
  };

  shouldComponentUpdate(nextProps) {
    return this.props.schema !== nextProps.schema;
  }

  render() {
    // eslint-disable-next-line react/prop-types
    const { t } = this.props; //   i18n tranlator. { t, i18n }

    const schema = this.props.schema;
    const queryType = schema.getQueryType();
    const mutationType = schema.getMutationType && schema.getMutationType();
    const subscriptionType =
      schema.getSubscriptionType && schema.getSubscriptionType();

    return (
      <div>
        <MarkdownContent
          className="doc-type-description"
          markdown={
            t('A GraphQL schema provides a root type for each kind of operation')
          }
        />
        <div className="doc-category">
          <div className="doc-category-title">{ t('root types') }</div>
          <div className="doc-category-item">
            <span className="keyword">{ t('query') }</span>
            {': '}
            <TypeLink type={queryType} onClick={this.props.onClickType} />
          </div>
          {mutationType && (
            <div className="doc-category-item">
              <span className="keyword">{ t('mutation') }</span>
              {': '}
              <TypeLink type={mutationType} onClick={this.props.onClickType} />
            </div>
          )}
          {subscriptionType && (
            <div className="doc-category-item">
              <span className="keyword">{ t('subscription') }</span>
              {': '}
              <TypeLink
                type={subscriptionType}
                onClick={this.props.onClickType}
              />
            </div>
          )}
        </div>
      </div>
    );
  }
}

export const SchemaDoc = withTranslation('DocExplorer')(SchemaDocSource);
