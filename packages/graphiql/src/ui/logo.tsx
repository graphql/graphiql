import type { FC, ReactNode } from 'react';

const defaultGraphiqlLogo = (
  <a
    className="graphiql-logo-link"
    href="https://github.com/graphql/graphiql"
    target="_blank"
    rel="noreferrer"
  >
    Graph
    <em>i</em>
    QL
  </a>
);

// Configure the UI by providing this Component as a child of GraphiQL.
export const GraphiQLLogo: FC<{ children?: ReactNode }> = ({
  children = defaultGraphiqlLogo,
}) => {
  return <div className="graphiql-logo">{children}</div>;
};
