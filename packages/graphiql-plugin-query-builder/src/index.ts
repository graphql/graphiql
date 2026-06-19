import type { GraphiQLPlugin } from '@graphiql/react';
import { QueryBuilder } from './components/query-builder';
import BuilderIcon from './icons/builder.svg?react';
import './style.css';

export const QUERY_BUILDER_PLUGIN: GraphiQLPlugin = {
  title: 'Query Builder',
  icon: BuilderIcon,
  content: QueryBuilder,
};

export { QueryBuilder };
