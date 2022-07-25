import { astFromValue, print, ValueNode } from 'graphql';

import { ExplorerFieldDef } from '../context';

import './default-value.css';

const printDefault = (ast?: ValueNode | null): string => {
  if (!ast) {
    return '';
  }
  return print(ast);
};

type DefaultValueProps = {
  field: ExplorerFieldDef;
};

export function DefaultValue({ field }: DefaultValueProps) {
  if (!('defaultValue' in field) || field.defaultValue === undefined) {
    return null;
  }
  const ast = astFromValue(field.defaultValue, field.type);
  if (!ast) {
    return null;
  }
  return (
    <>
      {' = '}
      <span className="graphiql-doc-explorer-default-value">
        {printDefault(ast)}
      </span>
    </>
  );
}
