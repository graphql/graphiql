import React from 'react';
import { Global } from '@emotion/core';

export default {
  fonts: {
    body: 'system-ui, sans-serif',
    heading: '"Avenir Next", sans-serif',
    monospace: 'Menlo, monospace',
  },
  space: [5, 10, 20],
  colors: {
    text: '#939393',
    background: 'rgba(254, 247, 252, 0.940177)',
    cardBackground: '#fff',
    primary: '#E535AB',
    border: 'rgba(0, 0, 0, 0.1)',
  },
};

export const Reset = () => (
  <Global
    styles={theme => ({
      '*': {
        margin: '0',
        boxSizing: 'border-box',
      },
      body: {
        fontFamily: theme.fonts.body,
        color: theme.colors.text,
        backgroundColor: theme.colors.background,
      },
      small: {
        fontSize: '100%',
      },
      a: {
        textDecoration: 'none',
      },
      button: {
        border: 0,
        padding: 0,
        fontSize: '100%',
        backgroundColor: 'transparent',
      },
    })}
  />
);
