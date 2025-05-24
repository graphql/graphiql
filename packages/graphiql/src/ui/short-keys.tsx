import { FC, Fragment } from 'react';
import { isMacOs, KEY_MAP } from '@graphiql/react';

function withMacOS(key: string) {
  return isMacOs ? key.replace('Ctrl', '⌘') : key;
}

const SHORT_KEYS = Object.entries({
  'Search in editor': withMacOS(KEY_MAP.searchInEditor.key),
  'Search in documentation': withMacOS(KEY_MAP.searchInDocs.key),
  'Execute query': withMacOS(KEY_MAP.runQuery.key),
  'Prettify editors': KEY_MAP.prettify.key,
  'Merge fragments definitions into operation definition':
    KEY_MAP.mergeFragments.key,
  'Copy query': KEY_MAP.copyQuery.key,
  'Re-fetch schema using introspection': KEY_MAP.refetchSchema.key,
});

interface ShortKeysProps {
  /**
   * @default 'sublime'
   * @deprecated
   */
  keyMap?: string;
}

export const ShortKeys: FC<ShortKeysProps> = () =>
  // { keyMap = 'sublime' }
  {
    return (
      <div>
        <table className="graphiql-table">
          <thead>
            <tr>
              <th>Short Key</th>
              <th>Function</th>
            </tr>
          </thead>
          <tbody>
            {SHORT_KEYS.map(([title, keys]) => (
              <tr key={title}>
                <td>
                  {keys.split('-').map((key, index, array) => (
                    <Fragment key={key}>
                      <code className="graphiql-key">{key}</code>
                      {index !== array.length - 1 && ' + '}
                    </Fragment>
                  ))}
                </td>
                <td>{title}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          This Graph<em>i</em>QL editor uses{' '}
          <a
            href="https://code.visualstudio.com/docs/reference/default-keybindings"
            target="_blank"
            rel="noreferrer"
          >
            Monaco editor shortcuts
          </a>
          , with keybindings similar to VS Code. See the full list of shortcuts
          for{' '}
          <a
            href="https://code.visualstudio.com/shortcuts/keyboard-shortcuts-macos.pdf"
            target="_blank"
            rel="noreferrer"
          >
            macOS
          </a>{' '}
          or{' '}
          <a
            href="https://code.visualstudio.com/shortcuts/keyboard-shortcuts-windows.pdf"
            target="_blank"
            rel="noreferrer"
          >
            Windows
          </a>
          .
        </p>
      </div>
    );
  };
