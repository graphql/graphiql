import type { GraphiQLPlugin } from '@graphiql/react';
import { QueryBuilder } from './components/query-builder';
import BuilderIcon from './icons/builder.svg?react';
import './index.css';

export const queryBuilderPlugin = (): GraphiQLPlugin => ({
  title: 'Query Builder',
  icon: BuilderIcon,
  content: QueryBuilder,
});
