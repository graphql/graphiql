import { babelParser } from './babel';
import { svelte2tsx } from 'svelte2tsx';
import { SourceMapConsumer } from 'source-map-js';
import { Position, Range } from 'graphql-language-service';
import type { RangeMapper, SourceParser } from './types';

export const svelteParser: SourceParser = (text, uri, logger) => {
  const svelteResult = svelte2tsx(text, {
    filename: uri,
  });

  const consumer = new SourceMapConsumer({
    ...svelteResult.map,
    version: String(svelteResult.map.version),
  });

  const rangeMapper: RangeMapper = range => {
    const start = consumer.originalPositionFor({
      line: range.start.line,
      column: range.start.character,
    });

    const end = consumer.originalPositionFor({
      line: range.end.line,
      column: range.end.character,
    });

    return new Range(
      new Position(start.line, start.column),
      new Position(end.line, end.column),
    );
  };
  try {
    return {
      asts: [babelParser(svelteResult.code, ['typescript'])],
      rangeMapper,
    };
  } catch (error) {
    logger.error(
      `Could not parse the Svelte file at ${uri} to extract the graphql tags:`,
    );
    logger.error(String(error));
    return null;
  }
};
