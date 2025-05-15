'use no memo';

import { KeyMap } from './types';
import { isMacOs } from '../utility/is-macos';

export const DEFAULT_EDITOR_THEME = 'graphiql';
export const DEFAULT_KEY_MAP: KeyMap = 'sublime';

export const commonKeys = {
  // Persistent search box in Query Editor
  [isMacOs ? 'Cmd-F' : 'Ctrl-F']: 'findPersistent',
  'Cmd-G': 'findPersistent',
  'Ctrl-G': 'findPersistent',

  // Editor improvements
  'Ctrl-Left': 'goSubwordLeft',
  'Ctrl-Right': 'goSubwordRight',
  'Alt-Left': 'goGroupLeft',
  'Alt-Right': 'goGroupRight',
};
