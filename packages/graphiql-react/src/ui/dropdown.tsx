import { ComponentProps, forwardRef, ReactElement } from 'react';
import { clsx } from 'clsx';
import { createComponentGroup } from '../utility/component-group';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

import './dropdown.css';

const MenuButton = forwardRef<HTMLButtonElement, ComponentProps<'button'>>(
  (props, ref) => (
    <DropdownMenu.Trigger asChild>
      <button
        {...props}
        ref={ref}
        className={clsx('graphiql-un-styled', props.className)}
      />
    </DropdownMenu.Trigger>
  ),
);
MenuButton.displayName = 'MenuButton';

function MenuList({
  children,
  align = 'start',
  sideOffset = 5,
  ...props
}: DropdownMenu.DropdownMenuContentProps): ReactElement {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content align={align} sideOffset={sideOffset} {...props}>
        {children}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  );
}

export const Menu = createComponentGroup(DropdownMenu.Root, {
  Button: MenuButton,
  Item: DropdownMenu.Item,
  List: MenuList,
});
