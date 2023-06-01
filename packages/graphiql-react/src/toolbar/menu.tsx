import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { Menu, Tooltip } from '../ui';
import { createComponentGroup } from '../utility/component-group';

import './menu.css';
import { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';

type ToolbarMenuProps = {
  button: ReactNode;
  label: string;
};

const ToolbarMenuRoot = ({
  button,
  children,
  label,
  ...props
}: ToolbarMenuProps & {
  children: ReactNode;
  className?: string;
} & DropdownMenuProps) => (
  <Menu {...props}>
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
);

export const ToolbarMenu = createComponentGroup(ToolbarMenuRoot, {
  Item: Menu.Item,
});
