'use no memo';

import type { FC, RefObject } from 'react';
import { Dialog } from '../dialog';
import { SegmentedControl } from '../segmented-control';
import { useGraphiQL, useGraphiQLActions } from '../provider';
import {
  useGraphiQLSettings,
  type Theme,
  type Density,
  type FontSize,
} from '../../hooks/use-graphiql-settings';
import { useMonaco } from '../../stores';
import { useEffect, useState } from 'react';
import './index.css';

// Time the clear-storage button shows its checkmark confirmation before it
// reverts, mirroring the collections plugin's copy/share confirmation.
const CLEAR_STORAGE_CONFIRMATION_MS = 1500;

const CheckIcon: FC = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 16 16"
    fill="none"
    className="graphiql-settings-check-icon"
  >
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
      d="m3.5 8.5 3 3 6-7"
    />
  </svg>
);

const FONT_SIZE_PX: Record<FontSize, number> = {
  compact: 12,
  default: 13,
  large: 14,
  xl: 16,
};

const FORCED_THEME_TO_SETTING: Record<'light' | 'dark' | 'system', Theme> = {
  light: 'light',
  dark: 'dark',
  system: 'auto',
};

const PERSIST_HEADERS_OPTIONS: { value: 'on' | 'off'; label: string }[] = [
  { value: 'on', label: 'On' },
  { value: 'off', label: 'Off' },
];

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const DENSITY_OPTIONS: { value: Density; label: string }[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'spacious', label: 'Spacious' },
];

const FONT_SIZE_OPTIONS: { value: FontSize; label: string }[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'default', label: 'Default' },
  { value: 'large', label: 'Large' },
  { value: 'xl', label: 'Extra Large' },
];

export interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Enforce a specific theme. When set, the theme control is hidden.
   */
  forcedTheme?: 'light' | 'dark' | 'system';
  /**
   * Whether the "persist headers" control is shown.
   */
  showPersistHeadersSettings?: boolean;
  /**
   * The element focus should return to when the dialog closes, usually the
   * button that opened it.
   */
  restoreFocusRef?: RefObject<HTMLElement | null>;
}

/**
 * Settings dialog with controls for theme, density, font size, and header
 * persistence. Reads and writes appearance settings via `useGraphiQLSettings`.
 * Monaco editor font size is updated to match the active font-size preset.
 */
export const SettingsDialog: FC<SettingsDialogProps> = ({
  open,
  onOpenChange,
  forcedTheme,
  showPersistHeadersSettings,
  restoreFocusRef,
}) => {
  const { theme, setTheme, density, setDensity, fontSize, setFontSize } =
    useGraphiQLSettings();
  const monaco = useMonaco(state => state.monaco);
  const shouldPersistHeaders = useGraphiQL(state => state.shouldPersistHeaders);
  const storage = useGraphiQL(state => state.storage);
  const { setShouldPersistHeaders } = useGraphiQLActions();
  const [isDataCleared, setIsDataCleared] = useState(false);

  // Reset the clear-storage confirmation when the dialog closes.
  useEffect(() => {
    if (!open) {
      setIsDataCleared(false);
    }
  }, [open]);

  // The confirmation is transient: flash the checkmark, then hide it again,
  // mirroring the collections plugin's share confirmation.
  useEffect(() => {
    if (!isDataCleared) {
      return;
    }
    const timer = setTimeout(
      () => setIsDataCleared(false),
      CLEAR_STORAGE_CONFIRMATION_MS,
    );
    return () => clearTimeout(timer);
  }, [isDataCleared]);

  function handleClearData() {
    storage.clear();
    setIsDataCleared(true);
  }

  // Keep Monaco editor font size in sync with the active preset.
  useEffect(() => {
    if (!monaco) {
      return;
    }
    const px = FONT_SIZE_PX[fontSize];
    monaco.editor.getEditors().forEach(editor => {
      editor.updateOptions({ fontSize: px });
    });
  }, [fontSize, monaco]);

  // Resolve to a valid setting; an unrecognized `forcedTheme` (e.g. from a URL
  // param) maps to `undefined` and is ignored, leaving the theme control shown.
  const forcedThemeSetting = forcedTheme
    ? FORCED_THEME_TO_SETTING[forcedTheme]
    : undefined;

  // Enforce a forced theme when provided. The equality guard keeps `setTheme`
  // (recreated each render) from looping, so all deps can be listed honestly.
  useEffect(() => {
    if (forcedThemeSetting && theme !== forcedThemeSetting) {
      setTheme(forcedThemeSetting);
    }
  }, [forcedThemeSetting, theme, setTheme]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      restoreFocusRef={restoreFocusRef}
    >
      <div className="graphiql-settings-dialog">
        <Dialog.Header>Settings</Dialog.Header>

        <div className="graphiql-settings-dialog-body">
          {!forcedThemeSetting && (
            <section className="graphiql-settings-section">
              <h3 className="graphiql-settings-section-title">Theme</h3>
              <SegmentedControl
                value={theme}
                onChange={setTheme}
                ariaLabel="Theme"
                options={THEME_OPTIONS}
              />
            </section>
          )}

          <section className="graphiql-settings-section">
            <h3 className="graphiql-settings-section-title">Density</h3>
            <SegmentedControl
              value={density}
              onChange={setDensity}
              ariaLabel="Density"
              options={DENSITY_OPTIONS}
            />
          </section>

          <section className="graphiql-settings-section">
            <h3 className="graphiql-settings-section-title">Font size</h3>
            <SegmentedControl
              value={fontSize}
              onChange={setFontSize}
              ariaLabel="Font size"
              options={FONT_SIZE_OPTIONS}
            />
          </section>

          {showPersistHeadersSettings && (
            <section className="graphiql-settings-section">
              <div className="graphiql-settings-section-label">
                <h3 className="graphiql-settings-section-title">
                  Persist headers
                </h3>
                <p className="graphiql-settings-section-caption">
                  Save headers upon reloading. Only enable if you trust this
                  device.
                </p>
              </div>
              <SegmentedControl
                value={shouldPersistHeaders ? 'on' : 'off'}
                onChange={value => setShouldPersistHeaders(value === 'on')}
                ariaLabel="Persist headers"
                options={PERSIST_HEADERS_OPTIONS}
              />
            </section>
          )}

          <section className="graphiql-settings-section">
            <div className="graphiql-settings-section-label">
              <h3 className="graphiql-settings-section-title">Clear storage</h3>
              <p className="graphiql-settings-section-caption">
                Remove all locally stored data and start fresh.
              </p>
            </div>
            <button
              type="button"
              className="graphiql-settings-clear-button"
              onClick={handleClearData}
              data-confirmed={isDataCleared || undefined}
            >
              <span className="graphiql-settings-clear-button-label">
                Clear data
              </span>
              <span
                className="graphiql-settings-clear-button-check"
                aria-hidden="true"
              >
                <CheckIcon />
              </span>
            </button>
            <span className="graphiql-settings-sr-only" role="status">
              {isDataCleared ? 'Data cleared' : ''}
            </span>
          </section>
        </div>
      </div>
    </Dialog>
  );
};
