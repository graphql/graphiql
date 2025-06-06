import { isMacOs } from '../constants';

export function formatShortcutForOS(key: string, replaced = '⌘') {
  return isMacOs ? key.replace('Ctrl', replaced) : key;
}
