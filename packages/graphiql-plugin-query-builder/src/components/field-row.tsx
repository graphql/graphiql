import {
  ChevronDownIcon,
  MarkdownContent,
  MergeIcon,
  Tooltip,
  typeCategory,
} from '@graphiql/react';
import type { GraphQLField } from 'graphql';
import type { FC } from 'react';
import type { ArgValue } from '../lib/document-mutator';
import type { PathSegment } from '../lib/ast-path';
import { ArgInput, rendersAsInputObject } from './arg-input';

type FieldRowProps = {
  field: GraphQLField<unknown, unknown>;
  path: PathSegment[];
  selected: boolean;
  hasChildren: boolean;
  expanded: boolean;
  /** Briefly highlight the row when it comes into view via cursor tracking. */
  flash?: boolean;
  /** Persistent highlight while the editor cursor sits on this field. */
  current?: boolean;
  argValues?: Record<string, ArgValue>;
  /**
   * Map of arg name → variable name for args that have been promoted to
   * variables. When an arg name is present here, its input shows as a variable
   * badge instead of the literal input control.
   */
  argVariables?: Record<string, string>;
  /**
   * When set, this field's selection has been extracted to (or replaced with) a
   * spread of this named fragment. The row shows `...fragmentSpread` in place of
   * its expand chrome.
   */
  fragmentSpread?: string;
  /**
   * Extracts the current selection into a new fragment. Present only on a
   * composite row that is expanded with a non-empty selection to lift out.
   */
  onExtractFragment?: () => void;
  onToggle: (path: PathSegment[]) => void;
  onExpand: (path: PathSegment[]) => void;
  onSetArg?: (path: PathSegment[], argName: string, value: ArgValue) => void;
  onPromoteArg?: (
    path: PathSegment[],
    argName: string,
    suggestedName: string,
  ) => void;
  onDemoteArg?: (path: PathSegment[], argName: string, varName: string) => void;
};

export const FieldRow: FC<FieldRowProps> = ({
  field,
  path,
  selected,
  hasChildren,
  expanded,
  flash = false,
  current = false,
  argValues = {},
  argVariables = {},
  fragmentSpread,
  onExtractFragment,
  onToggle,
  onExpand,
  onSetArg,
  onPromoteArg,
  onDemoteArg,
}) => {
  const fullPath = [...path, { kind: 'field' as const, name: field.name }];
  const indent = path.length * 12;
  const hasArgs = field.args.length > 0;
  const deprecated = Boolean(field.deprecationReason);
  const nameClassName = `graphiql-qb-field-name${
    deprecated ? ' graphiql-qb-field-name--deprecated' : ''
  }`;
  const typeColorCategory = typeCategory(field.type);

  return (
    <div
      className={`graphiql-qb-field-row${flash ? ' graphiql-qb-flash' : ''}${
        current ? ' graphiql-qb-current' : ''
      }`}
      style={{ paddingLeft: indent }}
      data-testid="field-row"
      data-selected={selected ? 'true' : 'false'}
    >
      <div className="graphiql-qb-field-header">
        {hasChildren ? (
          // Composite fields (object/interface/union) can't be selected on
          // their own — a bare composite is an invalid selection. They are
          // expand-only; checking a nested scalar is what adds them, keeping
          // the document valid at all times. The whole label toggles expansion.
          <button
            type="button"
            className="graphiql-qb-field-toggle"
            onClick={() => onExpand(fullPath)}
            aria-expanded={expanded}
            aria-label={`${expanded ? 'Collapse' : 'Expand'} ${field.name}`}
          >
            <span
              className={
                expanded
                  ? 'graphiql-qb-chevron-expanded'
                  : 'graphiql-qb-chevron-collapsed'
              }
            >
              <ChevronDownIcon />
            </span>
            <span className={nameClassName}>{field.name}</span>
          </button>
        ) : (
          <label className="graphiql-qb-field-toggle">
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggle(fullPath)}
              aria-label={`Toggle ${field.name}`}
              className="graphiql-qb-field-checkbox"
            />
            <span className={nameClassName}>{field.name}</span>
          </label>
        )}
        {deprecated && (
          <Tooltip
            label={
              <MarkdownContent
                type="deprecation"
                className="graphiql-qb-deprecation-tooltip"
              >
                {field.deprecationReason ?? ''}
              </MarkdownContent>
            }
          >
            <span
              className="graphiql-qb-field-deprecated"
              aria-label="deprecated"
            >
              DEP
            </span>
          </Tooltip>
        )}
        {fragmentSpread && (
          <span className="graphiql-qb-field-spread" data-testid="field-spread">
            <span className="graphiql-qb-spread">...</span>
            {fragmentSpread}
          </span>
        )}
        {onExtractFragment && (
          <span className="graphiql-qb-field-actions">
            <button
              type="button"
              className="graphiql-qb-extract-fragment-btn"
              onClick={onExtractFragment}
              aria-label={`Extract ${field.name} to a fragment`}
            >
              <MergeIcon />
              <span>Extract to fragment</span>
            </button>
          </span>
        )}
        <span
          className={`graphiql-qb-field-type graphiql-qb-field-type--${typeColorCategory}`}
        >
          {String(field.type)}
        </span>
      </div>
      {selected && hasArgs && (
        <div className="graphiql-qb-field-args">
          {field.args.map(arg => {
            const varName = argVariables[arg.name];
            const isVariable = varName !== undefined;
            // Input-object args label themselves via their disclosure header;
            // others get a `name:` label here.
            const isObjectArg = rendersAsInputObject(arg.type);
            return (
              <div key={arg.name} className="graphiql-qb-arg-row">
                {!isObjectArg && (
                  <span className="graphiql-qb-arg-name">{arg.name}:</span>
                )}
                <ArgInput
                  arg={arg}
                  value={argValues[arg.name] ?? ''}
                  onChange={v => onSetArg?.(fullPath, arg.name, v)}
                  isVariable={isVariable}
                  variableName={varName}
                  onPromote={
                    onPromoteArg
                      ? (argName, suggested) =>
                          onPromoteArg(fullPath, argName, suggested)
                      : undefined
                  }
                  onDemote={
                    onDemoteArg
                      ? (argName, vName) =>
                          onDemoteArg(fullPath, argName, vName)
                      : undefined
                  }
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
