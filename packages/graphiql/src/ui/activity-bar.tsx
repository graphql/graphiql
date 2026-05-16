import { type FC, type MouseEventHandler, useEffect, useState } from 'react';
import {
  ActivityRail,
  Button,
  ButtonGroup,
  cn,
  Dialog,
  isMacOs,
  pick,
  useGraphiQL,
  useGraphiQLActions,
  useDragResize,
  VisuallyHidden,
  type GraphiQLPlugin,
} from '@graphiql/react';
import { ShortKeys } from './short-keys';

const THEMES = ['light', 'dark', 'system'] as const;

export interface ActivityBarProps {
  /**
   * `forcedTheme` allows enforcement of a specific theme for GraphiQL.
   * This is useful when you want to make sure that GraphiQL is always
   * rendered with a specific theme.
   */
  forcedTheme?: (typeof THEMES)[number];

  /**
   * Indicates if settings for persisting headers should appear in the
   * settings modal.
   */
  showPersistHeadersSettings?: boolean;

  setHiddenElement: ReturnType<typeof useDragResize>['setHiddenElement'];
}

type ButtonHandler = MouseEventHandler<HTMLButtonElement>;

export const ActivityBar: FC<ActivityBarProps> = ({
  forcedTheme: $forcedTheme,
  showPersistHeadersSettings,
  setHiddenElement,
}) => {
  const forcedTheme =
    $forcedTheme && THEMES.includes($forcedTheme) ? $forcedTheme : undefined;

  const { setShouldPersistHeaders, setTheme } = useGraphiQLActions();
  const { shouldPersistHeaders, theme, storage } = useGraphiQL(
    pick('shouldPersistHeaders', 'theme', 'storage'),
  );

  useEffect(() => {
    if (forcedTheme === 'system') {
      setTheme(null);
    } else if (forcedTheme === 'light' || forcedTheme === 'dark') {
      setTheme(forcedTheme);
    }
  }, [forcedTheme, setTheme]);

  const [showDialog, setShowDialog] = useState<
    'settings' | 'short-keys' | null
  >(null);
  const [clearStorageStatus, setClearStorageStatus] = useState<
    'success' | 'error' | undefined
  >();

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
      setClearStorageStatus(undefined);
    }
  }

  function handleOpenShortKeysDialog(isOpen: boolean) {
    if (!isOpen) setShowDialog(null);
  }

  function handleClearData() {
    try {
      storage.clear();
      setClearStorageStatus('success');
    } catch {
      setClearStorageStatus('error');
    }
  }

  const handlePersistHeaders: ButtonHandler = event => {
    setShouldPersistHeaders(event.currentTarget.dataset.value === 'true');
  };

  const handleChangeTheme: ButtonHandler = event => {
    const selectedTheme = event.currentTarget.dataset.theme as
      | 'light'
      | 'dark'
      | undefined;
    setTheme(selectedTheme || null);
  };

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
      <Dialog
        open={showDialog === 'settings'}
        onOpenChange={handleOpenSettingsDialog}
      >
        <div className="graphiql-dialog-header">
          <Dialog.Title className="graphiql-dialog-title">
            Settings
          </Dialog.Title>
          <VisuallyHidden>
            <Dialog.Description>
              This modal lets you adjust header persistence, interface theme,
              and clear local storage.
            </Dialog.Description>
          </VisuallyHidden>
          <Dialog.Close />
        </div>
        {showPersistHeadersSettings ? (
          <div className="graphiql-dialog-section">
            <div>
              <div className="graphiql-dialog-section-title">
                Persist headers
              </div>
              <div className="graphiql-dialog-section-caption">
                Save headers upon reloading.{' '}
                <span className="graphiql-warning-text">
                  Only enable if you trust this device.
                </span>
              </div>
            </div>
            <ButtonGroup>
              <Button
                type="button"
                id="enable-persist-headers"
                className={cn(shouldPersistHeaders && 'active')}
                data-value="true"
                onClick={handlePersistHeaders}
              >
                On
              </Button>
              <Button
                type="button"
                id="disable-persist-headers"
                className={cn(!shouldPersistHeaders && 'active')}
                onClick={handlePersistHeaders}
              >
                Off
              </Button>
            </ButtonGroup>
          </div>
        ) : null}
        {!forcedTheme && (
          <div className="graphiql-dialog-section">
            <div>
              <div className="graphiql-dialog-section-title">Theme</div>
              <div className="graphiql-dialog-section-caption">
                Adjust how the interface appears.
              </div>
            </div>
            <ButtonGroup>
              <Button
                type="button"
                className={cn(theme === null && 'active')}
                onClick={handleChangeTheme}
              >
                System
              </Button>
              <Button
                type="button"
                className={cn(theme === 'light' && 'active')}
                data-theme="light"
                onClick={handleChangeTheme}
              >
                Light
              </Button>
              <Button
                type="button"
                className={cn(theme === 'dark' && 'active')}
                data-theme="dark"
                onClick={handleChangeTheme}
              >
                Dark
              </Button>
            </ButtonGroup>
          </div>
        )}
        <div className="graphiql-dialog-section">
          <div>
            <div className="graphiql-dialog-section-title">Clear storage</div>
            <div className="graphiql-dialog-section-caption">
              Remove all locally stored data and start fresh.
            </div>
          </div>
          <Button
            type="button"
            state={clearStorageStatus}
            disabled={clearStorageStatus === 'success'}
            onClick={handleClearData}
          >
            {{
              success: 'Cleared data',
              error: 'Failed',
            }[clearStorageStatus!] || 'Clear data'}
          </Button>
        </div>
      </Dialog>
    </>
  );
};
