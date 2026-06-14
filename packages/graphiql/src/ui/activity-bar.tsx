import { type FC, useEffect, useState } from 'react';
import {
  ActivityRail,
  Dialog,
  isMacOs,
  SettingsDialog,
  useDragResize,
  VisuallyHidden,
  type GraphiQLPlugin,
} from '@graphiql/react';
import { ShortKeys } from './short-keys';

export interface ActivityBarProps {
  /**
   * Enforce a specific theme; hides the theme control in the settings dialog.
   */
  forcedTheme?: 'light' | 'dark' | 'system';
  /**
   * Whether the "persist headers" control appears in the settings dialog.
   */
  showPersistHeadersSettings?: boolean;
  setHiddenElement: ReturnType<typeof useDragResize>['setHiddenElement'];
}

export const ActivityBar: FC<ActivityBarProps> = ({
  forcedTheme,
  showPersistHeadersSettings,
  setHiddenElement,
}) => {
  const [showDialog, setShowDialog] = useState<
    'settings' | 'short-keys' | null
  >(null);

  useEffect(() => {
    function openSettings(event: KeyboardEvent) {
      if ((isMacOs ? event.metaKey : event.ctrlKey) && event.key === ',') {
        event.preventDefault();
        setShowDialog(prev => (prev === 'settings' ? null : 'settings'));
      }
    }
    window.addEventListener('keydown', openSettings);
    return () => {
      window.removeEventListener('keydown', openSettings);
    };
  }, []);

  function handleOpenSettingsDialog(isOpen: boolean) {
    if (!isOpen) {
      setShowDialog(null);
    }
  }

  function handleOpenShortKeysDialog(isOpen: boolean) {
    if (!isOpen) {
      setShowDialog(null);
    }
  }

  function handlePluginToggle(nextPlugin: GraphiQLPlugin | null) {
    if (nextPlugin === null) {
      setHiddenElement('first');
    } else {
      setHiddenElement(null);
    }
  }

  return (
    <>
      <ActivityRail
        onPluginToggle={handlePluginToggle}
        onSettingsClick={() => setShowDialog('settings')}
      />
      <Dialog
        open={showDialog === 'short-keys'}
        onOpenChange={handleOpenShortKeysDialog}
      >
        <div className="graphiql-dialog-header">
          <Dialog.Title className="graphiql-dialog-title">
            Short Keys
          </Dialog.Title>
          <VisuallyHidden>
            <Dialog.Description>
              This modal provides a list of available keyboard shortcuts and
              their functions.
            </Dialog.Description>
          </VisuallyHidden>
          <Dialog.Close />
        </div>
        <div className="graphiql-dialog-section">
          <ShortKeys />
        </div>
      </Dialog>
      <SettingsDialog
        open={showDialog === 'settings'}
        onOpenChange={handleOpenSettingsDialog}
        forcedTheme={forcedTheme}
        showPersistHeadersSettings={showPersistHeadersSettings}
      />
    </>
  );
};
