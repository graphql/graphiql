import type { GraphiQLPlugin } from '@graphiql/react';
import { CollectionsPanel } from './components/collections-panel';
import CollectionsIcon from './icons/collections.svg?react';
import type { CollectionsStorage } from './types';
import './index.css';

export type {
  CollectionsStorage,
  CollectionsConfig,
  Collection,
  CollectionItem,
} from './types';
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
  /** Disable all write operations (export & copy still allowed). Default false. */
  readOnly?: boolean;
  /** Master switch for the import/export feature. Default true. */
  allowImportExport?: boolean;
  /** Allow the destructive "Replace" import option. Default true. */
  allowReplace?: boolean;
  /** Allow "Copy to clipboard" / "Copy operation" affordances. Default true. */
  allowCopy?: boolean;
};

export const collectionsPlugin = (
  options?: CollectionsPluginOptions,
): GraphiQLPlugin => {
  function CollectionsPanelWithOptions() {
    return (
      <CollectionsPanel
        storage={options?.storage}
        readOnly={options?.readOnly}
        allowImportExport={options?.allowImportExport}
        allowReplace={options?.allowReplace}
        allowCopy={options?.allowCopy}
      />
    );
  }
  return {
    title: 'Collections',
    icon: CollectionsIcon,
    content: CollectionsPanelWithOptions,
  };
};
