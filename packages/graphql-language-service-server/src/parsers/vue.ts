import { parse, compileScript, SFCScriptBlock } from '@vue/compiler-sfc';
import { RangeMapper, SourceParser } from './types';
import { Position, Range } from 'graphql-language-service';
import { BlockStatement, Statement } from '@babel/types';

type ParseVueSFCResult =
  | { type: 'error'; errors: Error[] }
  | {
      type: 'ok';
      scriptOffset: number;
      scriptSetupAst?: import('@babel/types').Statement[];
      scriptAst?: import('@babel/types').Statement[];
    };

export function parseVueSFC(source: string): ParseVueSFCResult {
  const { errors, descriptor } = parse(source);

  if (errors.length !== 0) {
    return { type: 'error', errors };
  }

  let scriptBlock: SFCScriptBlock | null = null;
  try {
    scriptBlock = compileScript(descriptor, { id: 'foobar' });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === '[@vue/compiler-sfc] SFC contains no <script> tags.'
    ) {
      return {
        type: 'ok',
        scriptSetupAst: [],
        scriptAst: [],
        scriptOffset: 0,
      };
    }
    return { type: 'error', errors: [error as Error] };
  }

  return {
    type: 'ok',
    scriptOffset: scriptBlock.loc.start.line - 1,
    scriptSetupAst: scriptBlock?.scriptSetupAst as Statement[],
    scriptAst: scriptBlock?.scriptAst as BlockStatement[],
  };
}

export const vueParser: SourceParser = (text, uri, logger) => {
  const asts = [];
  const parseVueSFCResult = parseVueSFC(text);
  if (parseVueSFCResult.type === 'error') {
    logger.error(
      `Could not parse the vue file at ${uri} to extract the graphql tags:`,
    );
    for (const error of parseVueSFCResult.errors) {
      logger.error(String(error));
    }
    return null;
  }

  if (parseVueSFCResult.scriptAst !== undefined) {
    asts.push(...parseVueSFCResult.scriptAst);
  }
  if (parseVueSFCResult.scriptSetupAst !== undefined) {
    asts.push(...parseVueSFCResult.scriptSetupAst);
  }

  const rangeMapper: RangeMapper = range => {
    return new Range(
      new Position(
        range.start.line + parseVueSFCResult.scriptOffset,
        range.start.character,
      ),
      new Position(
        range.end.line + parseVueSFCResult.scriptOffset,
        range.end.character,
      ),
    );
  };
  return { asts, rangeMapper };
};
