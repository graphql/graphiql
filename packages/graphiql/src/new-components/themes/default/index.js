import Layout from './Layout';

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

const colors = {
  text: palette.neutral[20],
  darkText: palette.neutral[70],
  background: palette.fuscia[90],
  cardBackground: palette.neutral[100],
  primary: palette.fuscia[50],
  border: palette.neutral[90],
};

const theme = {
  fonts: {
    body: 'system-ui, sans-serif',
    heading: '"Avenir Next", sans-serif',
    monospace: 'Menlo, monospace',
  },
  fontSizes: [12, 16, 20],
  space: [0, 5, 10, 15, 20],
  colors,
  transitions: ['.25s'],
  shadows: {
    card: `0 0 0 .1px ${colors.border}, 0 1px 4px 0 ${colors.border}`,
    primaryUnderline: `inset 0 -4px 0 0 ${colors.primary}`,
    underline: `inset 0 -4px 0 0 ${colors.border}`,
  },
};

export { Layout, theme };
