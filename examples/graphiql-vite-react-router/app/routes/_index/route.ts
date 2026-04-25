import type { FC } from 'react';
import type { LinksFunction, MetaFunction } from 'react-router';
import { graphiql } from './graphiql.client';
import graphiqlCss from 'graphiql/style.css?url';
import globalsCss from './globals.css?url';

export const meta: MetaFunction = () => {
  return [{ title: 'API Explorer' }];
};

export const links: LinksFunction = () => {
  return [
    { rel: 'stylesheet', href: graphiqlCss },
    { rel: 'stylesheet', href: globalsCss },
  ];
};

const Route: FC = () => graphiql;

export default Route;
