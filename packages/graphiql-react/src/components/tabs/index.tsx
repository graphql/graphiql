import { ComponentPropsWithoutRef, forwardRef, ReactNode } from 'react';
import { cn } from '../../utility';
import { Reorder } from 'framer-motion';
import { CloseIcon } from '../../icons';
import { UnStyledButton } from '../button';
import './index.css';

interface TabProps extends ComponentPropsWithoutRef<typeof Reorder.Item> {
  isActive?: boolean;
}

const TabRoot = forwardRef<HTMLLIElement, TabProps>(
  ({ isActive, value, children, className, ...props }, ref) => (
    <Reorder.Item
      {...props}
      ref={ref}
      value={value}
      aria-selected={isActive}
      dragElastic={false} // Prevent over scrolling of container
      role="tab"
      className={cn(
        'graphiql-tab',
        isActive && 'graphiql-tab-active',
        className,
      )}
    >
      {children}
    </Reorder.Item>
  ),
);
TabRoot.displayName = 'Tab';

const TabButton = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<'button'>
>(({ children, className, ...props }, ref) => (
  <UnStyledButton
    {...props}
    ref={ref}
    type="button"
    className={cn('graphiql-tab-button', className)}
  >
    {children}
  </UnStyledButton>
));
TabButton.displayName = 'Tab.Button';

const TabClose = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<'button'>
>((props, ref) => (
  <UnStyledButton
    aria-label="Close Tab"
    {...props}
    ref={ref}
    type="button"
    className={cn('graphiql-tab-close', props.className)}
  >
    <CloseIcon />
  </UnStyledButton>
));
TabClose.displayName = 'Tab.Close';

export const Tab = Object.assign(TabRoot, {
  Button: TabButton,
  Close: TabClose,
});

interface TabsProps {
  values: object[];
  onReorder: (newOrder: any[]) => void;
  className?: string;
  children: ReactNode;
}

export const Tabs = forwardRef<HTMLUListElement, TabsProps>(
  ({ values, onReorder, children, className, ...props }, ref) => (
    <Reorder.Group
      {...props}
      ref={ref}
      values={values}
      onReorder={onReorder}
      axis="x"
      role="tablist"
      className={cn('graphiql-tabs', className)}
    >
      {children}
    </Reorder.Group>
  ),
);
Tabs.displayName = 'Tabs';
