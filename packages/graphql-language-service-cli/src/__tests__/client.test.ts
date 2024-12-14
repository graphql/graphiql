/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import main from '../client';

describe('process.stderr.write', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is passed information on error of string type', () => {
    const argv = {
      schemaPath: '...',
      text: 'foo',
    };
    const mockStdErrWrite = vi
      .spyOn(process.stderr, 'write')
      .mockImplementation();
    vi.spyOn(process, 'exit').mockImplementation(() => {});
    const undefinedWithNewLine = /^undefined\n$/;

    main('autocomplete', argv);
    expect(mockStdErrWrite).toHaveBeenLastCalledWith(expect.any(String));
    expect(mockStdErrWrite).toHaveBeenLastCalledWith(
      expect.not.stringMatching(undefinedWithNewLine),
    );

    main('outline', argv);
    expect(mockStdErrWrite).toHaveBeenLastCalledWith(expect.any(String));
    expect(mockStdErrWrite).toHaveBeenLastCalledWith(
      expect.not.stringMatching(undefinedWithNewLine),
    );

    main('validate', argv);
    expect(mockStdErrWrite).toHaveBeenLastCalledWith(expect.any(String));
    expect(mockStdErrWrite).toHaveBeenLastCalledWith(
      expect.not.stringMatching(undefinedWithNewLine),
    );
  });
});
