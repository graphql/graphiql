import { CloseIcon } from '../icons';
import { compose } from '../utility/compose';
import { UnStyledButton } from './button';

import './tabs.css';

type TabProps = {
  isActive?: boolean;
};

export function Tab(props: TabProps & JSX.IntrinsicElements['div']) {
  return (
    <div
      {...props}
      aria-selected={props.isActive}
      className={compose(
        'graphiql-tab',
        props.isActive ? 'graphiql-tab-active' : '',
        props.className,
      )}>
      {props.children}
    </div>
  );
}

function TabButton(props: JSX.IntrinsicElements['button']) {
  return (
    <UnStyledButton
      {...props}
      type="button"
      className={compose('graphiql-tab-button', props.className)}>
      {props.children}
    </UnStyledButton>
  );
}

Tab.Button = TabButton;

function TabClose(props: JSX.IntrinsicElements['button']) {
  return (
    <UnStyledButton
      aria-label="Close Tab"
      title="Close Tab"
      {...props}
      type="button"
      className={compose('graphiql-tab-close', props.className)}>
      <CloseIcon />
    </UnStyledButton>
  );
}

Tab.Close = TabClose;

export function Tabs(props: JSX.IntrinsicElements['div']) {
  return (
    <div
      {...props}
      role="tablist"
      className={compose('graphiql-tabs', props.className)}>
      {props.children}
    </div>
  );
}
