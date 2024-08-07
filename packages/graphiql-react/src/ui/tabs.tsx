import { forwardRef, ReactNode } from 'react';
import { clsx } from 'clsx';
import { Reorder } from 'framer-motion';
import { CloseIcon } from '../icons';
import { UnStyledButton } from './button';

import './tabs.css';

type TabProps = {
  isActive?: boolean;
  value: object;
  className?: string;
  children: ReactNode;
};

const TabRoot = forwardRef<HTMLLIElement, TabProps>(
  ({ isActive, value, children, className, ...props }, ref) => (
    <Reorder.Item
      {...props}
      ref={ref}
      value={value}
      aria-selected={isActive}
      role="tab"
      className={clsx(
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
  JSX.IntrinsicElements['button']
>(({ children, className, ...props }, ref) => (
  <UnStyledButton
    {...props}
    ref={ref}
    type="button"
    className={clsx('graphiql-tab-button', className)}
  >
    {children}
  </UnStyledButton>
));
TabButton.displayName = 'Tab.Button';

const TabClose = forwardRef<HTMLButtonElement, JSX.IntrinsicElements['button']>(
  (props, ref) => (
    <UnStyledButton
      aria-label="Close Tab"
      {...props}
      ref={ref}
      type="button"
      className={clsx('graphiql-tab-close', props.className)}
    >
      <CloseIcon />
    </UnStyledButton>
  ),
);
TabClose.displayName = 'Tab.Close';

export const Tab = Object.assign(TabRoot, {
  Button: TabButton,
  Close: TabClose,
});

type TabsProps = {
  values: object[];
  onReorder: (newOrder: any[]) => void;
  className?: string;
  children: ReactNode;
};

export const Tabs = forwardRef<HTMLUListElement, TabsProps>(
  ({ values, onReorder, children, className, ...props }, ref) => (
    <Reorder.Group
      {...props}
      ref={ref}
      values={values}
      onReorder={onReorder}
      axis="x"
      role="tablist"
      className={clsx('graphiql-tabs', className)}
    >
      {children}
    </Reorder.Group>
  ),
);
Tabs.displayName = 'Tabs';
