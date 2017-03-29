/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

'use strict';

import {join} from 'path';
import {exec} from './util';

exec('babel', 'src', '--ignore', '**/__tests__/**', '--out-dir', 'dist');
