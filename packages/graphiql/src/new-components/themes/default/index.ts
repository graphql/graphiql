import Layout from './Layout';
import { Colors, Space, GraphiQLTheme } from '../types';

const palette = {
  neutral: {
    20: '#999999',
    70: '#333333',
    90: `rgba(0, 0, 0, 0.1)`,
    100: '#fff',
  },
  fuscia: {
    90: 'rgba(254, 247, 252, 0.940177)',
    50: '#E535AB',
  },
};

const colors: Colors = {
  text: palette.neutral[20],
  darkText: palette.neutral[70],
  background: palette.fuscia[90],
  cardBackground: palette.neutral[100],
  primary: palette.fuscia[50],
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
