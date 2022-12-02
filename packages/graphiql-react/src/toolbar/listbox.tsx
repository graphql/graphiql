import { ComponentProps, forwardRef, ReactNode } from 'react';
import { clsx } from 'clsx';
import { Listbox, Tooltip } from '../ui';
import { createComponentGroup } from '../utility/component-group';

import './listbox.css';

type ToolbarListboxProps = {
  button: ReactNode;
  label: string;
};

const ToolbarListboxRoot = forwardRef<
  HTMLDivElement,
  ToolbarListboxProps & ComponentProps<typeof Listbox.Input>
>(({ button, children, label, ...props }, ref) => {
  const labelWithValue = `${label}${props.value ? `: ${props.value}` : ''}`;
  return (
    <Listbox.Input
      {...props}
      ref={ref}
      className={clsx('graphiql-toolbar-listbox', props.className)}
      aria-label={labelWithValue}
    >
      <Tooltip label={labelWithValue}>
        <Listbox.Button>{button}</Listbox.Button>
      </Tooltip>
      <Listbox.Popover>{children}</Listbox.Popover>
    </Listbox.Input>
  );
});
ToolbarListboxRoot.displayName = 'ToolbarListbox';

export const ToolbarListbox = createComponentGroup(ToolbarListboxRoot, {
  Option: Listbox.Option,
});
