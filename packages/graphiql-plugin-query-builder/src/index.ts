import { type GraphiQLPlugin, QueryBuilderIcon } from '@graphiql/react';
import { QueryBuilder } from './components/query-builder';
import './style.css';

export const QUERY_BUILDER_PLUGIN: GraphiQLPlugin = {
  title: 'Query Builder',
  icon: QueryBuilderIcon,
  content: QueryBuilder,
};

export { QueryBuilder };
