import { FC, Fragment } from 'react';
import { isMacOs, KEY_MAP } from '@graphiql/react';

function withMacOS(key: string) {
  return isMacOs ? key.replace('Ctrl', '⌘') : key;
}

const SHORT_KEYS = Object.entries({
  'Search in editor': withMacOS(KEY_MAP.searchInEditor[0]),
  'Search in documentation': withMacOS(KEY_MAP.searchInDocs[0]),
  'Execute query': withMacOS(KEY_MAP.runQuery[0]),
  'Prettify editors': KEY_MAP.prettify[0],
  'Merge fragments definitions into operation definition':
    KEY_MAP.mergeFragments[0],
  'Copy query': KEY_MAP.copyQuery[0],
  'Re-fetch schema using introspection': KEY_MAP.refetchSchema[0],
});

interface ShortKeysProps {
  /** @default 'sublime' */
  keyMap?: string;
}

export const ShortKeys: FC<ShortKeysProps> = ({ keyMap = 'sublime' }) => {
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
        The editors use{' '}
        <a
          href="https://codemirror.net/5/doc/manual.html#keymaps"
          target="_blank"
          rel="noopener noreferrer"
        >
          CodeMirror Key Maps
        </a>{' '}
        that add more short keys. This instance of Graph<em>i</em>QL uses{' '}
        <code>{keyMap}</code>.
      </p>
    </div>
  );
};
