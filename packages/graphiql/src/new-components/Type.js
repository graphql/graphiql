/** @jsx jsx */
import { jsx } from 'theme-ui';

const SectionHeader = ({ children }) => (
  <h2 sx={{ color: 'primary', fontSize: [2] }}>{children}</h2>
);

const Explainer = ({ children }) => (
  <span sx={{ fontSize: [0] }}>{children}</span>
);

export { SectionHeader, Explainer };
