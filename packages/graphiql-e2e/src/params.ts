import type { Theme } from '@graphiql/react';

export interface Params<SerializedValue = string> {
  query?: string;
  variables?: SerializedValue;
  headers?: SerializedValue;

  defaultQuery?: string;
  defaultHeaders?: SerializedValue;

  confirmCloseTab?: 'true';
  onPrettifyQuery?: 'true';
  forcedTheme?: 'light' | 'dark' | 'system';
  defaultTheme?: Theme;
}
