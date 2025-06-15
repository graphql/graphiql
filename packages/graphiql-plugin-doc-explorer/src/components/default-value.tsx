import { FC } from 'react';
import { astFromValue, print, ValueNode } from 'graphql';
import { DocExplorerFieldDef } from '../context';
import './default-value.css';

const printDefault = (ast?: ValueNode | null): string => {
  if (!ast) {
    return '';
  }
  return print(ast);
};

type DefaultValueProps = {
  /**
   * The field or argument for which to render the default value.
   */
  field: DocExplorerFieldDef;
};

export const DefaultValue: FC<DefaultValueProps> = ({ field }) => {
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
};
