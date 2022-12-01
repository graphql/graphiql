import React from 'react';
import type { GlobalProvider } from '@ladle/react';

// styles
// TODO: find a better way to rely on these css files
import '../../packages/graphiql-react/dist/style.css';
import '../../packages/graphiql/src/style.css';
import './style.css';

export const Provider: GlobalProvider = ({ children }) => {
  return <div className="graphiql-container">{children}</div>;
};
