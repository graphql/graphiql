import { describe, it, expect, vi, afterEach } from 'vitest';
/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import main from '../client';

describe('error output', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(['autocomplete', 'outline', 'validate'])(
    'writes the %s error to stderr',
    command => {
      const argv = {
        schemaPath: '...',
        text: 'foo',
      };
      const mockStdErrWrite = vi
        .spyOn(process.stderr, 'write')
        .mockImplementation(() => true);
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {});
      main(command, argv);

      expect(mockStdErrWrite).toHaveBeenCalledOnce();
      expect(mockStdErrWrite).toHaveBeenCalledWith(
        expect.stringMatching(/^(?!undefined\n$).+\n$/s),
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    },
  );
});
