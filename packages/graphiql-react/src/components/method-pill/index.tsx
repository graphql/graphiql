import type { FC } from 'react';
import type { OperationTypeNode } from 'graphql';
import './index.css';

export type Operation = `${OperationTypeNode}` | 'invalid';

const LABELS: Record<Operation, string> = {
  query: 'QRY',
  mutation: 'MUT',
  subscription: 'SUB',
  invalid: 'ERR',
};

export type MethodPillProps = {
  operation: Operation;
  'aria-hidden'?: boolean;
};

export const MethodPill: FC<MethodPillProps> = ({ operation, ...rest }) => (
  <span
    className={`graphiql-method-pill graphiql-method-pill-${operation}`}
    {...rest}
  >
    {LABELS[operation]}
  </span>
);
