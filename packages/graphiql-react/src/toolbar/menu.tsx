import React, { forwardRef, ReactNode } from 'react';
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

export const ToolbarMenu: typeof ToolbarMenuRoot = createComponentGroup(
  ToolbarMenuRoot,
  {
    Item: Menu.Item,
  },
);
