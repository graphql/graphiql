import { FC, ReactNode } from 'react';

// Configure the UI by providing this Component as a child of GraphiQL.
export const GraphiQLFooter: FC<{ children: ReactNode }> = ({ children }) => {
  return <div className="graphiql-footer">{children}</div>;
};
