import type { Range } from 'graphql-language-service';
import type { NoopLogger, Logger } from '../Logger';

export type RangeMapper = (range: Range) => Range;

export type SourceParser = (
  text: string,
  uri: string,
  logger: Logger | NoopLogger,
) => null | { asts: any[]; rangeMapper?: RangeMapper };
