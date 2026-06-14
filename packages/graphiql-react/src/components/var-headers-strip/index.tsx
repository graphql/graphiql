import type { FC } from 'react';
import { useState } from 'react';
import { VariablesEditor } from '../variables-editor';
import { RequestHeadersEditor } from '../request-headers-editor';
import { SegmentedControl } from '../segmented-control';
import { useEditorState } from '../../utility/hooks';
import { tryParseJSONC } from '../../utility';
import './index.css';

export type VarTab = 'variables' | 'headers';

const VAR_TAB_OPTIONS: { value: VarTab; label: string }[] = [
  { value: 'variables', label: 'Variables' },
  { value: 'headers', label: 'Headers' },
];

// Plain function (not a hook) so the React Compiler does not try to optimize it.
// The try/catch with conditional chaining inside a hook body is a known compiler
// limitation — keeping the fallible logic here avoids the compile error.
function computeVariablesHint(value: string): string | null {
  if (!value.trim()) {
    return null;
  }
  try {
    const parsed = tryParseJSONC(value);
    const count = parsed ? Object.keys(parsed).length : 0;
    return `${count} var${count === 1 ? '' : 's'} · valid`;
  } catch {
    return 'invalid JSON';
  }
}

function useVariablesHint(): string | null {
  const [value] = useEditorState('variable');
  return computeVariablesHint(value);
}

export type VarHeadersStripProps = {
  /** Which tab is shown initially. @default 'variables' */
  defaultTab?: VarTab;
  /**
   * Whether the headers tab and editor are available.
   * When `false`, only the variables editor is shown.
   * @default true
   */
  headersEditorEnabled?: boolean;
  onEditVariables?: (value: string) => void;
  onEditHeaders?: (value: string) => void;
};

export const VarHeadersStrip: FC<VarHeadersStripProps> = ({
  defaultTab = 'variables',
  headersEditorEnabled = true,
  onEditVariables,
  onEditHeaders,
}) => {
  const [varTab, setVarTab] = useState<VarTab>(
    headersEditorEnabled ? defaultTab : 'variables',
  );
  const hint = useVariablesHint();

  const showHeaders = headersEditorEnabled && varTab === 'headers';
  const options = headersEditorEnabled
    ? VAR_TAB_OPTIONS
    : VAR_TAB_OPTIONS.filter(option => option.value === 'variables');

  return (
    <div className="graphiql-var-headers-strip">
      <div className="graphiql-var-headers-strip-bar">
        <SegmentedControl
          value={showHeaders ? 'headers' : 'variables'}
          onChange={setVarTab}
          options={options}
          ariaLabel="Editor tools"
        />
        {!showHeaders && hint !== null && (
          <span className="graphiql-var-hint" aria-live="polite">
            {hint}
          </span>
        )}
      </div>
      <div className="graphiql-var-headers-strip-content">
        <VariablesEditor
          className={showHeaders ? 'hidden' : ''}
          onEdit={onEditVariables}
        />
        {headersEditorEnabled && (
          <RequestHeadersEditor
            className={showHeaders ? '' : 'hidden'}
            onEdit={onEditHeaders}
          />
        )}
      </div>
    </div>
  );
};
