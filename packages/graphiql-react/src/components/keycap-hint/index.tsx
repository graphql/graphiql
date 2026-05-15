import type { FC } from 'react';
import './index.css';

export type KeycapHintProps = {
  keys: string[];
  ariaLabel: string;
};

export const KeycapHint: FC<KeycapHintProps> = ({ keys, ariaLabel }) => (
  <span className="graphiql-keycap-hint" aria-label={ariaLabel}>
    {keys.map((k, i) => (
      <kbd key={`${k}-${i}`} className="graphiql-keycap">
        {k}
      </kbd>
    ))}
  </span>
);
