import type { FC, ReactNode } from 'react';
import * as T from '@radix-ui/react-tooltip';
import './index.css';

export const TooltipRoot: FC<T.TooltipContentProps & { label: ReactNode }> = ({
  children,
  align = 'start',
  side = 'bottom',
  sideOffset = 5,
  label,
}) => {
  return (
    <T.Root>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content
          className="graphiql-tooltip"
          align={align}
          side={side}
          sideOffset={sideOffset}
        >
          {label}
        </T.Content>
      </T.Portal>
    </T.Root>
  );
};

export const Tooltip = Object.assign(TooltipRoot, {
  Provider: T.Provider,
});
