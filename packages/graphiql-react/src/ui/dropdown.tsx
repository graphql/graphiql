import {
  Listbox as ListboxRoot,
  ListboxButton as ReachListboxButton,
  ListboxInput,
  ListboxOption,
  ListboxPopover,
} from '@reach/listbox';
import {
  Menu as MenuRoot,
  MenuButton as ReachMenuButton,
  MenuItem,
  MenuList,
} from '@reach/menu-button';
import { ComponentProps, forwardRef } from 'react';
import { clsx } from 'clsx';
import { createComponentGroup } from '../utility/component-group';

import './dropdown.css';

const MenuButton = forwardRef<
  HTMLButtonElement,
  ComponentProps<typeof ReachMenuButton>
>((props, ref) => (
  <ReachMenuButton
    {...props}
    ref={ref}
    className={clsx('graphiql-un-styled', props.className)}
  />
));
MenuButton.displayName = 'MenuButton';

export const Menu: typeof MenuRoot & {
  Button: typeof MenuButton;
  Item: typeof MenuItem;
  List: typeof MenuList;
} = createComponentGroup(MenuRoot, {
  Button: MenuButton,
  Item: MenuItem,
  List: MenuList,
});

const ListboxButton = forwardRef<
  HTMLDivElement,
  ComponentProps<typeof ReachListboxButton>
>((props, ref) => (
  <ReachListboxButton
    {...props}
    ref={ref}
    className={clsx('graphiql-un-styled', props.className)}
  />
));
ListboxButton.displayName = 'ListboxButton';

export const Listbox: typeof ListboxRoot & { 
  Button: typeof ListboxButton,
  Input: typeof ListboxInput,
  Option: typeof ListboxOption,
  Popover: typeof ListboxPopover
} = createComponentGroup(ListboxRoot, {
  Button: ListboxButton,
  Input: ListboxInput,
  Option: ListboxOption,
  Popover: ListboxPopover,
});
