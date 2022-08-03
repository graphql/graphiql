import {
  Menu as MenuRoot,
  MenuButton,
  MenuItem,
  MenuList,
} from '@reach/menu-button';
import { createComponentGroup } from '../utility/component-group';

import './menu.css';

export const Menu = createComponentGroup(MenuRoot, {
  Button: MenuButton,
  Item: MenuItem,
  List: MenuList,
});
