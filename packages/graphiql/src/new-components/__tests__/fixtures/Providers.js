import React from 'react';
import ThemeProvider from '../../themes/provider';

/*
export a wrapper component that adds all needed providers
*/

const WithProviders = ({ children }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

export default WithProviders;
