import { configure, addDecorator } from '@storybook/react';
import { ThemeProvider } from 'theme-ui';
import theme, { Reset } from '../src/new-components/theme';
import React from 'react';

addDecorator(story => <ThemeProvider theme={theme}><Reset />{story()}</ThemeProvider>);

configure(
  require.context('../src/new-components', true, /\.stories\.js$/),
  module,
);
