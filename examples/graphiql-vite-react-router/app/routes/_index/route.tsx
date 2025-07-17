import type { FC } from 'react';
import type { LinksFunction, MetaFunction } from 'react-router';
import { App } from './graphiql.client';
import graphiqlStyles from 'graphiql/style.css?url';
import explorerStyles from './styles/explorer.css?url';

export const meta: MetaFunction = () => {
  return [{ title: 'API Explorer' }];
};

export const links: LinksFunction = () => {
  return [
    { rel: 'stylesheet', href: graphiqlStyles },
    { rel: 'stylesheet', href: explorerStyles },
  ];
};

const Route: FC = () => {
  return App && <App />;
};

export default Route;
