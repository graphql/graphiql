/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import Layout from './Layout';
import { Colors, Space, GraphiQLTheme } from '../types';

const palette = {
  neutral: {
    20: '#666666',
    70: '#333333',
    90: `rgba(0, 0, 0, 0.1)`,
    100: '#fff',
  },
  fuchsia: {
    90: 'rgba(254, 247, 252, 0.940177)',
    50: '#E535AB',
  },
};

const colors: Colors = {
  text: palette.neutral[20],
  darkText: palette.neutral[70],
  background: palette.fuchsia[90],
  cardBackground: palette.neutral[100],
  primary: palette.fuchsia[50],
  border: palette.neutral[90],
};

const space: Space = [0, 5, 10, 15, 20];
const fontSizes = [12, 16, 20];

const theme: GraphiQLTheme = {
  fonts: {
    body: 'system-ui, sans-serif',
    heading: '"Avenir Next", sans-serif',
    monospace: 'Menlo, monospace',
  },
  fontSizes,
  space,
  colors,
  transitions: ['.25s'],
  spaces: {
    rowPadding: space[3],
    rowMinHeight: space[3] + fontSizes[1] + space[3],
  },
  shadows: {
    card: `0 0 0 .1px ${colors.border}, 0 1px 4px 0 ${colors.border}`,
    primaryUnderline: `inset 0 -4px 0 0 ${colors.primary}`,
    underline: `inset 0 -4px 0 0 ${colors.border}`,
  },
};

export { Layout, theme };
