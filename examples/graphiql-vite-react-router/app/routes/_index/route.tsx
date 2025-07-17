import graphiqlStyles from 'graphiql/style.css?url';
import { App } from './graphiql.client';
import { type LinksFunction, type MetaFunction } from 'react-router';
import explorerStyles from './styles/explorer.css?url';
import { JSX } from 'react';
import './helpers/setup-workers.client';

export const meta: MetaFunction = () => {
  return [{ title: 'API Explorer' }];
};

export const links: LinksFunction = () => {
  return [
    { rel: 'stylesheet', href: graphiqlStyles },
    { rel: 'stylesheet', href: explorerStyles },
  ];
};

export default function Route(): JSX.Element {
  return App && <App />;
}
