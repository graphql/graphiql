// @flow
type Range = {
  start: number,
  end: number,
  line: number,
};

type Location = {
  line: number,
  column: number,
  character: number,
};

export function getLocator(source: string) {
  const offsetLine = 0;
  const offsetColumn = 0;

  const originalLines = source.split('\n');

  let start = 0;
  const lineRanges = originalLines.map((line, i) => {
    const end = start + line.length + 1;
    const range: Range = { start, end, line: i };

    start = end;
    return range;
  });

  let i = 0;

  function rangeContains(range: Range, index: number) {
    return range.start <= index && index < range.end;
  }

  function getLocation(range: Range, index: number): Location {
    return {
      line: offsetLine + range.line,
      column: offsetColumn + index - range.start,
      character: index,
    };
  }

  function locateStr(search: number): Location {
    let range = lineRanges[i];

    const d = search >= range.end ? 1 : -1;

    while (range) {
      if (rangeContains(range, search)) {
        return getLocation(range, search);
      }

      i += d;
      range = lineRanges[i];
    }

    throw new Error('Location not found.');
  }

  return locateStr;
}

export function locate(source: string, search: any): Location {
  return getLocator(source)(search);
}
