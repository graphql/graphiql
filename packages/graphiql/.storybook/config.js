import { configure, addDecorator } from '@storybook/react';
import React from 'react';
import requireContext from 'require-context.macro';
import ThemeProvider from '../src/components/common/themes/provider';

addDecorator(story => <ThemeProvider>{story()}</ThemeProvider>);

configure(
  requireContext('../src/components/common', true, /\.stories\.tsx$/),
  module,
);
