import { configure, addDecorator } from '@storybook/react';
import React from 'react';
import requireContext from 'require-context.macro';
import ThemeProvider from '../src/new-components/themes/provider';

addDecorator(story => <ThemeProvider>{story()}</ThemeProvider>);

configure(
  requireContext('../src/new-components', true, /\.stories\.tsx$/),
  module,
);
