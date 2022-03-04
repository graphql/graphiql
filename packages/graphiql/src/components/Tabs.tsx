import React from 'react';

function TabCloseButton(props: { onClick: () => void }) {
  return (
    <button
      className="close"
      aria-label="Close Tab"
      onClick={ev => {
        ev.stopPropagation();
        props.onClick();
      }}
    />
  );
}

export function Tab(props: {
  isActive: boolean;
  title: string;
  isCloseable: boolean;
  onSelect: () => void;
  onClose: () => void;
}): React.ReactElement {
  return (
    <div
      role="button"
      className={`tab${props.isActive ? ' active' : ''}`}
      onClick={props.onSelect}>
      {props.title}
      {props.isCloseable ? (
        <TabCloseButton onClick={() => props.onClose()} />
      ) : null}
    </div>
  );
}

export function TabAddButton(props: { onClick: () => void }) {
  return (
    <button
      onClick={props.onClick}
      className="toolbar-button tab-add"
      title="Create new tab">
      {'+'}
    </button>
  );
}

export function Tabs(props: { children: Array<React.ReactNode> }) {
  return <div className="tabs">{props.children}</div>;
}
