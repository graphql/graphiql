/* eslint-disable */
// cSpell:disable

import * as React from 'react';
import { StyleConfig } from './types';

export function Checkbox(props: {
  checked: boolean;
  styleConfig: StyleConfig;
}): React.ReactElement {
  return props.checked
    ? props.styleConfig.checkboxChecked
    : props.styleConfig.checkboxUnchecked;
}
