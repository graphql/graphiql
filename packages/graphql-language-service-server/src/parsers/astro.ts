import { Position, Range } from 'graphql-language-service';
import { RangeMapper, SourceParser } from './types';
import { babelParser } from './babel';
import { parse } from '@astrojs/compiler';

type ParseAstroResult =
  | { type: 'error'; errors: string[] }
  | {
      type: 'ok';
      scriptOffset: number;
      scriptAst: any[];
    };

async function parseAstro(source: string): Promise<ParseAstroResult> {
  const { ast, diagnostics } = await parse(source, {
    position: false, // defaults to `true`
  });

  if (diagnostics.some(d => d.severity === /* Error */ 1)) {
    return {
      type: 'error',
      errors: diagnostics.map(d => JSON.stringify(d)),
    };
  }

  for (const node of ast.children) {
    if (node.type === 'frontmatter') {
      try {
        return {
          type: 'ok',
          scriptOffset: (node.position?.start.line ?? 1) - 1,
          scriptAst: [babelParser(node.value, ['typescript'])],
        };
      } catch (error) {
        return {
          type: 'error',
          errors: [String(error)],
        };
      }
    }
  }

  return { type: 'error', errors: ['Could not find frontmatter block'] };
}

export const astroParser: SourceParser = async (text, uri, logger) => {
  const parseAstroResult = await parseAstro(text);
  if (parseAstroResult.type === 'error') {
    logger.info(
      `Could not parse the astro file at ${uri} to extract the graphql tags:`,
    );
    for (const error of parseAstroResult.errors) {
      logger.info(String(error));
    }
    return null;
  }

  const rangeMapper: RangeMapper = range => {
    return new Range(
      new Position(
        range.start.line + parseAstroResult.scriptOffset,
        range.start.character,
      ),
      new Position(
        range.end.line + parseAstroResult.scriptOffset,
        range.end.character,
      ),
    );
  };
  return { asts: parseAstroResult.scriptAst, rangeMapper };
};
