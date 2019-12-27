import { configure, addDecorator } from '@storybook/react';
import ThemeProvider from '../src/new-components/themes/provider';
import React from 'react';
import requireContext from 'require-context.macro';

addDecorator(story => <ThemeProvider>{story()}</ThemeProvider>);

configure(
  requireContext('../src/new-components', true, /\.stories\.js$/),
  module,
);
