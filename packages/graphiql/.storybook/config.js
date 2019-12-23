import { configure, addDecorator } from '@storybook/react';
import ThemeProvider from '../src/new-components/themes/provider';
import React from 'react';

addDecorator(story => <ThemeProvider>{story()}</ThemeProvider>);

configure(
  require.context('../src/new-components', true, /\.stories\.js$/),
  module,
);
