import type { FC, ReactNode } from 'react';
import { Trigger, type DropdownMenuProps } from '@radix-ui/react-dropdown-menu';
import { DropdownMenu } from '../dropdown-menu';

interface ToolbarMenuProps extends DropdownMenuProps {
  button: ReactNode;
}

const ToolbarMenuRoot: FC<ToolbarMenuProps> = ({
  button,
  children,
  ...props
}) => {
  return (
    <DropdownMenu {...props}>
      <Trigger asChild>{button}</Trigger>
      <DropdownMenu.Content>{children}</DropdownMenu.Content>
    </DropdownMenu>
  );
};

export const ToolbarMenu = Object.assign(ToolbarMenuRoot, {
  Item: DropdownMenu.Item,
});
