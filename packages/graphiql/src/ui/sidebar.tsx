import { FC, type MouseEventHandler, useEffect, useState } from 'react';
import {
  Button,
  ButtonGroup,
  cn,
  Dialog,
  isMacOs,
  KEY_MAP,
  KeyboardShortcutIcon,
  pick,
  ReloadIcon,
  SettingsIcon,
  Tooltip,
  UnStyledButton,
  useDragResize,
  useGraphiQL,
  useGraphiQLActions,
  VisuallyHidden,
} from '@graphiql/react';
import { ShortKeys } from './short-keys';

type ButtonHandler = MouseEventHandler<HTMLButtonElement>;

const LABEL = {
  refetchSchema: `Re-fetch GraphQL schema (${KEY_MAP.refetchSchema.key})`,
  shortCutDialog: 'Open short keys dialog',
  settingsDialogs: 'Open settings dialog',
};

const THEMES = ['light', 'dark', 'system'] as const;

interface SidebarProps {
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

export const Sidebar: FC<SidebarProps> = ({
  forcedTheme: $forcedTheme,
  showPersistHeadersSettings,
  setHiddenElement,
}) => {
  const forcedTheme =
    $forcedTheme && THEMES.includes($forcedTheme) ? $forcedTheme : undefined;
  const { setShouldPersistHeaders, introspect, setVisiblePlugin, setTheme } =
    useGraphiQLActions();
  const {
    shouldPersistHeaders,
    isIntrospecting,
    visiblePlugin,
    plugins,
    theme,
    storage,
  } = useGraphiQL(
    pick(
      'shouldPersistHeaders',
      'isIntrospecting',
      'visiblePlugin',
      'plugins',
      'theme',
      'storage',
    ),
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
        event.preventDefault(); // prevent default browser settings dialog
        setShowDialog(prev => (prev === 'settings' ? null : 'settings'));
      }
    }

    window.addEventListener('keydown', openSettings);
    return () => {
      window.removeEventListener('keydown', openSettings);
    };
  }, []);

  function handleOpenShortKeysDialog(isOpen: boolean) {
    if (!isOpen) {
      setShowDialog(null);
    }
  }

  function handleOpenSettingsDialog(isOpen: boolean) {
    if (!isOpen) {
      setShowDialog(null);
      setClearStorageStatus(undefined);
    }
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

  const handleShowDialog: ButtonHandler = event => {
    setShowDialog(
      event.currentTarget.dataset.value as 'short-keys' | 'settings',
    );
  };

  const handlePluginClick: ButtonHandler = event => {
    const pluginIndex = Number(event.currentTarget.dataset.index!);
    const plugin = plugins.find((_, index) => pluginIndex === index)!;
    const isVisible = plugin === visiblePlugin;
    if (isVisible) {
      setVisiblePlugin(null);
      setHiddenElement('first');
    } else {
      setVisiblePlugin(plugin);
      setHiddenElement(null);
    }
  };

  return (
    <div className="graphiql-sidebar">
      {plugins.map((plugin, index) => {
        const isVisible = plugin === visiblePlugin;
        const label = `${isVisible ? 'Hide' : 'Show'} ${plugin.title}`;
        return (
          <Tooltip key={plugin.title} label={label}>
            <UnStyledButton
              type="button"
              className={cn(isVisible && 'active')}
              onClick={handlePluginClick}
              data-index={index}
              aria-label={label}
            >
              <plugin.icon aria-hidden="true" />
            </UnStyledButton>
          </Tooltip>
        );
      })}
      <Tooltip label={LABEL.refetchSchema}>
        <UnStyledButton
          type="button"
          disabled={isIntrospecting}
          onClick={introspect}
          aria-label={LABEL.refetchSchema}
          style={{ marginTop: 'auto' }}
        >
          <ReloadIcon
            className={cn(isIntrospecting && 'graphiql-spin')}
            aria-hidden="true"
          />
        </UnStyledButton>
      </Tooltip>
      <Tooltip label={LABEL.shortCutDialog}>
        <UnStyledButton
          type="button"
          data-value="short-keys"
          onClick={handleShowDialog}
          aria-label={LABEL.shortCutDialog}
        >
          <KeyboardShortcutIcon aria-hidden="true" />
        </UnStyledButton>
      </Tooltip>
      <Tooltip label={LABEL.settingsDialogs}>
        <UnStyledButton
          type="button"
          data-value="settings"
          onClick={handleShowDialog}
          aria-label={LABEL.settingsDialogs}
        >
          <SettingsIcon aria-hidden="true" />
        </UnStyledButton>
      </Tooltip>
      <Dialog
        open={showDialog === 'short-keys'}
        onOpenChange={handleOpenShortKeysDialog}
      >
        <div className="graphiql-dialog-header">
          <Dialog.Title className="graphiql-dialog-title">
            Short Keys
          </Dialog.Title>
          <VisuallyHidden>
            {/* Fixes Warning: Missing `Description` or `aria-describedby={undefined}` for {DialogContent} */}
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
            {/* Fixes Warning: Missing `Description` or `aria-describedby={undefined}` for {DialogContent} */}
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
    </div>
  );
};
