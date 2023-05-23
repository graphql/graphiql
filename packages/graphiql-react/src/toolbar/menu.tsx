import { forwardRef, ReactNode } from 'react';
import { clsx } from 'clsx';
import { Menu, Tooltip } from '../ui';
import { createComponentGroup } from '../utility/component-group';

import './menu.css';

type ToolbarMenuProps = {
  button: ReactNode;
  label: string;
};

const ToolbarMenuRoot = forwardRef<
  HTMLDivElement,
  ToolbarMenuProps & JSX.IntrinsicElements['div']
>(({ button, children, label, ...props }, ref) => (
  // @ts-expect-error -- Should I remove ref? got Property 'ref' does not exist on type 'IntrinsicAttributes & DropdownMenuProps & { children?: ReactNode; }'
  <Menu {...props} ref={ref}>
    <Tooltip label={label}>
      <Menu.Button
        className={clsx(
          'graphiql-un-styled graphiql-toolbar-menu',
          props.className,
        )}
        aria-label={label}
      >
        {button}
      </Menu.Button>
    </Tooltip>
    <Menu.List>{children}</Menu.List>
  </Menu>
));
ToolbarMenuRoot.displayName = 'ToolbarMenu';

export const ToolbarMenu = createComponentGroup(ToolbarMenuRoot, {
  Item: Menu.Item,
});
