/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import initStoryshots from '@storybook/addon-storyshots';
import path from 'path';

initStoryshots({
  configPath: path.resolve(__dirname, '../../../.storybook'),
});
