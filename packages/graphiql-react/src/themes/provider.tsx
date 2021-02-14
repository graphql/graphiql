/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { ThemeProvider } from 'theme-ui';
import { theme, Layout } from './default';
import React from 'react';
import { Global } from '@emotion/core';

const Reset = () => (
  <Global
    styles={themeStyles => ({
      '*': {
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
        listStyle: 'none',
      },
      body: {
        fontFamily: themeStyles.fonts.body,
        fontSize: themeStyles.fontSizes[1],
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

export function useThemeLayout() {
  return Layout;
}

export function Provider({ children }: React.PropsWithChildren<{}>) {
  return (
    <ThemeProvider theme={theme}>
      <Reset />
      {children}
    </ThemeProvider>
  );
}

export default Provider;
