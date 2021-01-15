/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { configure, addDecorator } from '@storybook/react';
import React from 'react';
import requireContext from 'require-context.macro';
import ThemeProvider from '../src/components/common/themes/provider';

addDecorator(story => <ThemeProvider>{story()}</ThemeProvider>);

configure(
  requireContext('../src/components/common', true, /\.stories\.tsx$/),
  module,
);
