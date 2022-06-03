/** @jsx jsx */

/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { jsx } from 'theme-ui';
import { PropsWithChildren } from 'react';

const SectionHeader = ({ children }: PropsWithChildren<{}>) => (
  <h2 sx={{ color: 'primary', fontSize: [2] }}>{children}</h2>
);

const Explainer = ({ children }: PropsWithChildren<{}>) => (
  <span sx={{ fontSize: [0] }}>{children}</span>
);

export { SectionHeader, Explainer };
