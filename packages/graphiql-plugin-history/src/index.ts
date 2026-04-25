import { GraphiQLPlugin, HistoryIcon } from '@graphiql/react';
import './style.css';

import { History } from './components';

export const HISTORY_PLUGIN: GraphiQLPlugin = {
  title: 'History',
  icon: HistoryIcon,
  content: History,
};

export { History };

export { HistoryStore, useHistory, useHistoryActions } from './context';
export * from './deprecated';
