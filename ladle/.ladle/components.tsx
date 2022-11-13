import React from 'react';
import type { GlobalProvider } from '@ladle/react';

// styles
import '../../packages/graphiql-react/dist/style.css';
import '../../packages/graphiql/graphiql.min.css';

export const Provider: GlobalProvider = ({ children }) => {
  return <div className="graphiql-container">{children}</div>;
};
