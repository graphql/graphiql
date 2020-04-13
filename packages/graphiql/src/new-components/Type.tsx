/** @jsx jsx */
import { jsx } from 'theme-ui';
import { PropsWithChildren } from 'react';

const SectionHeader = ({ children }: PropsWithChildren<{}>) => (
  <h2 sx={{ color: 'primary', fontSize: [2] }}>{children}</h2>
);

const Explainer = ({ children }: PropsWithChildren<{}>) => (
  <span sx={{ fontSize: [0] }}>{children}</span>
);

export { SectionHeader, Explainer };
