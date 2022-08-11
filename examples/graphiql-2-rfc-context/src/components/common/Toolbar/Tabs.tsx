/** @jsx jsx */

/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

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
            onClick={() => onChange?.(index)}
          >
            {tab}
          </Tab>
        ))}
      </WithDividers>
      {children?.[active]}
    </React.Fragment>
  );
};

export default Tabs;
