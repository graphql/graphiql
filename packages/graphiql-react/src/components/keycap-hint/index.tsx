import type { FC } from 'react';
import { isMacOs } from '../../constants';
import './index.css';

/**
 * Semantic modifier keys for `KeycapHint`.
 *
 * - `Meta` is the OS-appropriate shortcut modifier: ⌘ on macOS, Ctrl elsewhere.
 * - `Ctrl`/`Alt`/`Shift` render as Mac glyphs (⌃/⌥/⇧) on macOS and as plain
 *   text on other platforms.
 * - `Enter` always renders as ⏎ (the symbol is widely recognized cross-platform).
 */
export const MODIFIER = Object.freeze({
  Meta: 'Meta',
  Ctrl: 'Ctrl',
  Alt: 'Alt',
  Shift: 'Shift',
  Enter: 'Enter',
} as const);

export type ModifierKey = (typeof MODIFIER)[keyof typeof MODIFIER];

export type KeycapHintProps = {
  /** Keys to render. Use `MODIFIER.*` for OS-aware modifiers; other strings render as-is. */
  keys: Array<ModifierKey | (string & {})>;
  ariaLabel: string;
};

const MAC_DISPLAY: Record<string, string> = {
  Meta: '⌘',
  Ctrl: '⌃',
  Alt: '⌥',
  Shift: '⇧',
  Enter: '⏎',
};

const NON_MAC_DISPLAY: Record<string, string> = {
  Meta: 'Ctrl',
  Enter: '⏎',
};

export const KeycapHint: FC<KeycapHintProps> = ({ keys, ariaLabel }) => {
  const display = isMacOs ? MAC_DISPLAY : NON_MAC_DISPLAY;
  return (
    <span className="graphiql-keycap-hint" aria-label={ariaLabel}>
      {keys.map((k, i) => (
        <kbd key={`${k}-${i}`} className="graphiql-keycap">
          <span className="graphiql-keycap-glyph">{display[k] ?? k}</span>
        </kbd>
      ))}
    </span>
  );
};
