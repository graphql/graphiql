import { ThemeProvider } from 'theme-ui';
import theme from './default';
import React from 'react';
import { Global } from '@emotion/core';

const Reset = () => (
  <Global
    styles={themeStyles => ({
      '*': {
        margin: '0',
        boxSizing: 'border-box',
      },
      body: {
        fontFamily: themeStyles.fonts.body,
        color: themeStyles.colors.text,
        backgroundColor: themeStyles.colors.background,
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

const Provider = ({ children }) => (
  <ThemeProvider theme={theme}>
    <Reset />
    {children}
  </ThemeProvider>
);

export default Provider;
