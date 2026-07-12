// Barrel re-export — preserves the full public API of the original module so
// all existing `import { ... } from '../document-mutator'` paths keep working.

export type { ArgValue } from './arg-value';
export {
  argValueToValueNode,
  scalarToValueNode,
  valueNodeToArgValue,
} from './arg-value';

export {
  findOperation,
  fieldSegment,
  inlineFragmentSegment,
  segmentsEqual,
  type DefinitionTarget,
  type Path,
  type PathSegment,
} from './ast-path';

export { isFieldSelected, toggleFieldSelection } from './field-selection';

export {
  getFieldArgValues,
  getFieldArgVariables,
  setFieldArgument,
} from './arguments';

export {
  demoteVariable,
  promoteArgToVariable,
  suggestVarName,
} from './variables';

export {
  createFragmentFromSelection,
  listFragments,
  renameFragment,
} from './fragments';

export {
  addInlineFragment,
  isInlineFragmentPresent,
  removeInlineFragment,
} from './inline-fragments';
