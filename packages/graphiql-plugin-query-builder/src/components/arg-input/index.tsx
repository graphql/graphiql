import { type FC } from 'react';
import type { GraphQLArgument, GraphQLInputField } from 'graphql';
import { type ArgValue } from '../../lib/document-mutator';
import { ArgInputByType, rendersAsInputObject } from './arg-input-by-type';

export { rendersAsInputObject };

type ArgInputProps = {
  arg: GraphQLArgument | GraphQLInputField;
  value: ArgValue;
  onChange: (v: ArgValue) => void;
  /** When set, a "use as variable" toggle is rendered for scalar/enum args. */
  isVariable?: boolean;
  /** The variable name currently bound to this arg (only meaningful when `isVariable` is true). */
  variableName?: string;
  /** Called when the user clicks "use as variable". */
  onPromote?: (argName: string, suggestedName: string) => void;
  /** Called when the user clicks the active variable badge to demote back to a literal. */
  onDemote?: (argName: string, varName: string) => void;
};

/**
 * Renders an appropriate input control for a single GraphQL argument or input
 * field. Handles scalars, enums, lists (repeat add/remove UI), and input
 * objects (recursive nested fields via a collapsible disclosure). Returns null
 * for any types not yet supported.
 *
 * When `onPromote` is supplied, scalar and enum inputs show a "use as variable"
 * toggle button. Clicking it calls `onPromote`; when `isVariable` is true the
 * button shows the bound variable name and clicking it calls `onDemote`.
 */
export const ArgInput: FC<ArgInputProps> = ({
  arg,
  value,
  onChange,
  isVariable = false,
  variableName,
  onPromote,
  onDemote,
}) => {
  return (
    <ArgInputByType
      type={arg.type}
      name={arg.name}
      value={value}
      onChange={onChange}
      isVariable={isVariable}
      variableName={variableName}
      onPromote={onPromote}
      onDemote={onDemote}
    />
  );
};
