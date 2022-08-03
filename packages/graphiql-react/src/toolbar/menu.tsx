import { forwardRef, ReactNode } from 'react';
import { Menu } from '../ui';
import { createComponentGroup } from '../utility/component-group';
import { compose } from '../utility/compose';

import './menu.css';

type ToolbarMenuProps = {
  button: ReactNode;
};

const ToolbarMenuRoot = forwardRef<
  HTMLDivElement,
  ToolbarMenuProps & JSX.IntrinsicElements['div']
>(({ button, children, ...props }, ref) => (
  <Menu {...props} ref={ref}>
    <Menu.Button
      className={compose(
        'graphiql-un-styled graphiql-toolbar-menu',
        props.className,
      )}>
      {button}
    </Menu.Button>
    <Menu.List>{children}</Menu.List>
  </Menu>
));
ToolbarMenuRoot.displayName = 'ToolbarMenu';

export const ToolbarMenu = createComponentGroup(ToolbarMenuRoot, {
  Item: Menu.Item,
});
