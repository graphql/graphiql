import { forwardRef } from 'react';
import { clsx } from 'clsx';
import { Reorder } from 'framer-motion';
import { CloseIcon } from '../icons';
import { createComponentGroup } from '../utility/component-group';
import { UnStyledButton } from './button';
import { Tooltip } from './tooltip';

import './tabs.css';

type TabProps = {
  isActive?: boolean;
  key: string;
  value: object;
};

const TabRoot = forwardRef<
  HTMLDivElement,
  TabProps & JSX.IntrinsicElements['div']
>(({ isActive, key, value, ...props }, ref) => (
  <Reorder.Item key={key} value={value} className="graphiql-reorder-tab">
    <div
      {...props}
      ref={ref}
      role="tab"
      aria-selected={isActive}
      className={clsx(
        'graphiql-tab',
        isActive && 'graphiql-tab-active',
        props.className,
      )}
    >
      {props.children}
    </div>
  </Reorder.Item>
));
TabRoot.displayName = 'Tab';

const TabButton = forwardRef<
  HTMLButtonElement,
  JSX.IntrinsicElements['button']
>((props, ref) => (
  <UnStyledButton
    {...props}
    ref={ref}
    type="button"
    className={clsx('graphiql-tab-button', props.className)}
  >
    {props.children}
  </UnStyledButton>
));
TabButton.displayName = 'Tab.Button';

const TabClose = forwardRef<HTMLButtonElement, JSX.IntrinsicElements['button']>(
  (props, ref) => (
    <Tooltip label="Close Tab">
      <UnStyledButton
        aria-label="Close Tab"
        {...props}
        ref={ref}
        type="button"
        className={clsx('graphiql-tab-close', props.className)}
      >
        <CloseIcon />
      </UnStyledButton>
    </Tooltip>
  ),
);
TabClose.displayName = 'Tab.Close';

export const Tab = createComponentGroup(TabRoot, {
  Button: TabButton,
  Close: TabClose,
});

type TabsProps = {
  values: object[];
  onReorder: (newOrder: any[]) => void;
};

export const Tabs = forwardRef<
  HTMLDivElement,
  TabsProps & JSX.IntrinsicElements['div']
>(({ values, onReorder, ...props }, ref) => (
  <Reorder.Group
    axis="x"
    values={values}
    onReorder={onReorder}
    className="graphiql-reorder-tabs"
  >
    <div
      {...props}
      ref={ref}
      role="tablist"
      className={clsx('graphiql-tabs', props.className)}
    >
      {props.children}
    </div>
  </Reorder.Group>
));
Tabs.displayName = 'Tabs';
