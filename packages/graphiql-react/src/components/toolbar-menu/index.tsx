import type { FC, ReactNode } from 'react';
import { cn } from '../../utility';
import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';
import { DropdownMenu } from '../dropdown-menu';
import { Tooltip } from '../tooltip';
import './index.css';

interface ToolbarMenuProps {
  button: ReactNode;
  label: string;
}

const ToolbarMenuRoot: FC<
  ToolbarMenuProps & {
    children: ReactNode;
    className?: string;
  } & DropdownMenuProps
> = ({ button, children, label, ...props }) => {
  return (
    <DropdownMenu {...props}>
      <Tooltip label={label}>
        <DropdownMenu.Button
          className={cn(
            'graphiql-un-styled graphiql-toolbar-menu',
            props.className,
          )}
          aria-label={label}
        >
          {button}
        </DropdownMenu.Button>
      </Tooltip>
      <DropdownMenu.Content>{children}</DropdownMenu.Content>
    </DropdownMenu>
  );
};

export const ToolbarMenu = Object.assign(ToolbarMenuRoot, {
  Item: DropdownMenu.Item,
});
