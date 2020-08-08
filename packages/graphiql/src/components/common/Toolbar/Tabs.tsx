/** @jsx jsx */
import React from 'react';
import { jsx } from 'theme-ui';
import WithDividers from './support/WithDividers';
import { ReactNodeLike } from '../../../types';

export type TabProps = { active: boolean } & React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>;

const Tab = ({ active, ...props }: TabProps) => (
  <button
    sx={{
      padding: ({ spaces }) => spaces.rowPadding,
      outline: 'none',
      textAlign: 'end',
      verticalAlign: 'baseline',
      transition: ({ transitions }) => transitions[0],
      cursor: 'pointer',
      ':focus, :hover': {
        boxShadow: active ? 'primaryUnderline' : 'underline',
        color: active ? 'primary' : 'darkText',
      },
      boxShadow: active ? 'primaryUnderline' : 'inset 0 0 0 transparent',
      color: active ? 'primary' : 'text',
    }}
    {...props}
  />
);

export type TabsProps = {
  tabs: ReactNodeLike[];
  active: number;
  onChange?: (idx: number) => void;
  children?: ReactNodeLike[];
};

const Tabs = ({ tabs, active, onChange, children }: TabsProps) => {
  return (
    <React.Fragment>
      <WithDividers>
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            active={active === index}
            onClick={() => onChange?.(index)}>
            {tab}
          </Tab>
        ))}
      </WithDividers>
      {children && children[active]}
    </React.Fragment>
  );
};

export default Tabs;
