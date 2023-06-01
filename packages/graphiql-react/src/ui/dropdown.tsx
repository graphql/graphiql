import { ComponentProps, forwardRef, ReactElement } from 'react';
import { clsx } from 'clsx';
import { createComponentGroup } from '../utility/component-group';
import * as DM from '@radix-ui/react-dropdown-menu';

import './dropdown.css';

const Button = forwardRef<HTMLButtonElement, ComponentProps<'button'>>(
  (props, ref) => (
    <DM.Trigger asChild>
      <button
        {...props}
        ref={ref}
        className={clsx('graphiql-un-styled', props.className)}
      />
    </DM.Trigger>
  ),
);
Button.displayName = 'DropdownMenuButton';

function Content({
  children,
  align = 'start',
  sideOffset = 5,
  className,
  ...props
}: DM.DropdownMenuContentProps): ReactElement {
  return (
    <DM.Portal>
      <DM.Content
        align={align}
        sideOffset={sideOffset}
        className={clsx('graphiql-dropdown-content', className)}
        {...props}
      >
        {children}
      </DM.Content>
    </DM.Portal>
  );
}

const Item = ({ className, children, ...props }: DM.DropdownMenuItemProps) => (
  <DM.Item className={clsx('graphiql-dropdown-item', className)} {...props}>
    {children}
  </DM.Item>
);

export const DropdownMenu = createComponentGroup(DM.Root, {
  Button,
  Item,
  Content,
});
