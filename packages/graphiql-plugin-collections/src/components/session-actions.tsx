import { useEffect } from 'react';
import { useGraphiQLActions } from '@graphiql/react';
import { collectionsStore } from '../store';
import { localStorageAdapter } from '../storage/local-storage';
import { SaveDialog } from './save-dialog';
import type { CollectionsStorage } from '../types';

type CollectionsSessionActionsProps = {
  storage?: CollectionsStorage;
  readOnly?: boolean;
  allowImportExport?: boolean;
  allowReplace?: boolean;
};

export const CollectionsSessionActions = ({
  storage,
  readOnly = false,
  allowImportExport = true,
  allowReplace = true,
}: CollectionsSessionActionsProps) => {
  useEffect(() => {
    void collectionsStore
      .getState()
      .actions.init(storage ?? localStorageAdapter, {
        readOnly,
        allowImportExport,
        allowReplace,
      });
    // storage/config are intentionally only read on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { registerSaveHandler } = useGraphiQLActions();

  useEffect(() => {
    if (readOnly) {
      return;
    }
    return registerSaveHandler(tab =>
      collectionsStore.getState().actions.requestSave(tab),
    );
  }, [readOnly, registerSaveHandler]);

  return <SaveDialog />;
};
