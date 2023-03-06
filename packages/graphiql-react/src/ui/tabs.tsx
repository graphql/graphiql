import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { CloseIcon } from '../icons';
import { createComponentGroup } from '../utility/component-group';
import { UnStyledButton } from './button';
import { Tooltip } from './tooltip';

import './tabs.css';

type TabProps = {
  isActive?: boolean;
};

const TabRoot = forwardRef<
  HTMLDivElement,
  TabProps & JSX.IntrinsicElements['div']
>(({ isActive, ...props }, ref) => (
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

export const Tabs = forwardRef<HTMLDivElement, JSX.IntrinsicElements['div']>(
  (props, ref) => (
    <div
      {...props}
      ref={ref}
      role="tablist"
      className={clsx('graphiql-tabs', props.className)}
    >
      {props.children}
    </div>
  ),
);
Tabs.displayName = 'Tabs';
