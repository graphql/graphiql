import type { FC } from 'react';
import './index.css';

export type Operation = 'query' | 'mutation' | 'subscription';

const LABELS: Record<Operation, string> = {
  query: 'QRY',
  mutation: 'MUT',
  subscription: 'SUB',
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
