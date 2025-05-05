import { ComponentProps, FC, forwardRef } from 'react';
import { clsx } from 'clsx';
import {
  Trigger,
  Portal,
  Content as RadixContent,
  Item as RadixItem,
  DropdownMenuContentProps,
  DropdownMenuItemProps,
  Root,
} from '@radix-ui/react-dropdown-menu';
import './dropdown.css';

const Button = forwardRef<HTMLButtonElement, ComponentProps<'button'>>(
  (props, ref) => (
    <Trigger asChild>
      <button
        {...props}
        ref={ref}
        className={clsx('graphiql-un-styled', props.className)}
      />
    </Trigger>
  ),
);
Button.displayName = 'DropdownMenuButton';

const Content: FC<DropdownMenuContentProps> = ({
  children,
  align = 'start',
  sideOffset = 5,
  className,
  ...props
}) => {
  return (
    <Portal>
      <RadixContent
        align={align}
        sideOffset={sideOffset}
        className={clsx('graphiql-dropdown-content', className)}
        {...props}
      >
        {children}
      </RadixContent>
    </Portal>
  );
};

const Item: FC<DropdownMenuItemProps> = ({ className, children, ...props }) => (
  <RadixItem className={clsx('graphiql-dropdown-item', className)} {...props}>
    {children}
  </RadixItem>
);

export const DropdownMenu = Object.assign(Root, {
  Button,
  Item,
  Content,
});
