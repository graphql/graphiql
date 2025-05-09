import { GraphiQLPlugin, HistoryIcon } from '@graphiql/react';
import './style.css';

import { History } from './components';

export const HISTORY_PLUGIN: GraphiQLPlugin = {
  title: 'History',
  icon: HistoryIcon,
  content: History,
};

export { History };

export { HistoryContextProvider, useHistory, useHistoryActions } from './context';
