import type { GraphiQLPlugin } from '@graphiql/react';
import { CollectionsPanel } from './components/collections-panel';
import CollectionsIcon from './icons/collections.svg?react';
import type { CollectionsStorage } from './types';
import './index.css';

export type { CollectionsStorage, Collection, CollectionItem } from './types';
export {
  collectionsStore,
  useCollectionsStore,
  type ActiveOperation,
} from './store';
export {
  createLocalStorageAdapter,
  localStorageAdapter,
} from './storage/local-storage';
export { SaveDialog as CollectionsSaveDialog } from './components/save-dialog';

export type CollectionsPluginOptions = {
  /** Custom storage adapter. Defaults to localStorage with key 'graphiql:collections'. */
  storage?: CollectionsStorage;
};

export const collectionsPlugin = (
  options?: CollectionsPluginOptions,
): GraphiQLPlugin => {
  function CollectionsPanelWithOptions() {
    return <CollectionsPanel storage={options?.storage} />;
  }
  return {
    title: 'Collections',
    icon: CollectionsIcon,
    content: CollectionsPanelWithOptions,
  };
};
