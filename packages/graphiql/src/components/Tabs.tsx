import React from 'react';

/**
 * TODO: extract with other components to @graphiql/react
 */

function TabCloseButton(props: { onClick: () => void }) {
  return (
    <div
      role="button"
      aria-pressed={false}
      className="close"
      aria-label="Close Tab"
      title="Close Tab"
      onClick={ev => {
        ev.stopPropagation();
        props.onClick();
      }}
    />
  );
}

export type TabProps = {
  isActive: boolean;
  title: string;
  isCloseable: boolean;
  onSelect: () => void;
  onClose: () => void;
  tabProps?: React.ButtonHTMLAttributes<{}>;
};

/**
 * Generic tab component that implements wai-aria tab spec
 */
export function Tab(props: TabProps): React.ReactElement {
  return (
    <button
      {...props.tabProps}
      role="tab"
      type="button"
      aria-selected={props.isActive}
      title={props.title}
      className={`tab${props.isActive ? ' active' : ''}`}
      onClick={props.onSelect}
    >
      {props.title}
      {props.isCloseable ? (
        <TabCloseButton onClick={() => props.onClose()} />
      ) : null}
    </button>
  );
}

export function TabAddButton(props: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className="tab-add"
      title="Create new tab"
    >
      <span>+</span>
    </button>
  );
}

export type TabsProps = {
  children: Array<React.ReactNode>;
  tabsProps?: React.HTMLAttributes<{}>;
};
/**
 * Generic tablist component that implements wai-aria tab spec
 */
export function Tabs(props: TabsProps) {
  return (
    <div role="tablist" className="tabs" {...props.tabsProps}>
      {props.children}
    </div>
  );
}
