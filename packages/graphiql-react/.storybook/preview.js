/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';
import { addDecorator } from '@storybook/react';

import ThemeProvider from '../src/themes/provider';

addDecorator(story => <ThemeProvider>{story()}</ThemeProvider>);
