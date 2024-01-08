import { parse, ParserPlugin } from '@babel/parser';
import { BABEL_PLUGINS, PARSER_OPTIONS } from '../constants';
import { SourceParser } from './types';

export const babelParser = (text: string, plugins?: ParserPlugin[]) => {
  const babelPlugins = BABEL_PLUGINS.slice(0, BABEL_PLUGINS.length);
  if (plugins) {
    babelPlugins.push(...plugins);
  }
  PARSER_OPTIONS.plugins = babelPlugins;
  return parse(text, PARSER_OPTIONS);
};

export const ecmaParser: SourceParser = (text, uri, logger) => {
  try {
    return { asts: [babelParser(text, ['flow', 'flowComments'])] };
  } catch (error) {
    logger.error(
      `Could not parse the JavaScript file at ${uri} to extract the graphql tags:`,
    );
    logger.error(String(error));
    return null;
  }
};

export const tsParser: SourceParser = (text, uri, logger) => {
  try {
    return { asts: [babelParser(text, ['typescript'])] };
  } catch (error) {
    logger.error(
      `Could not parse the TypeScript file at ${uri} to extract the graphql tags:`,
    );
    logger.error(String(error));
    return null;
  }
};
