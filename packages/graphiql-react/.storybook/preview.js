import React from 'react';
import { addDecorator } from '@storybook/react';

import ThemeProvider from '../src/themes/provider';

addDecorator(storyFn => {
  return <ThemeProvider>{storyFn()}</ThemeProvider>;
});
