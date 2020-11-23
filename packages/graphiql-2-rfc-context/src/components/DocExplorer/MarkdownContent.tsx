/**
 *  Copyright (c) 2020 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import MD from 'markdown-it';
import { Maybe } from '../../types';

const md = new MD();

type MarkdownContentProps = {
  markdown?: Maybe<string>;
  className?: string;
};

export default function MarkdownContent({
  markdown,
  className,
}: MarkdownContentProps) {
  if (!markdown) {
    return <div />;
  }

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: md.render(markdown) }}
    />
  );
}
