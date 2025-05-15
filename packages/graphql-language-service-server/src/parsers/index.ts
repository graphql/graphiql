import { ecmaParser, tsParser } from './babel';
import { vueParser } from './vue';
import { astroParser } from './astro';
import { svelteParser } from './svelte';
import { DEFAULT_SUPPORTED_EXTENSIONS } from '../constants';
import { SourceParser } from './types';

// ensures that all of the supported extensions have parsers
type ParserMap = {
  [K in (typeof DEFAULT_SUPPORTED_EXTENSIONS)[number]]: SourceParser;
};

export const parserMap: ParserMap = {
  '.js': ecmaParser,
  '.jsx': ecmaParser,
  '.mjs': ecmaParser,
  '.es': ecmaParser,
  '.es6': ecmaParser,
  '.esm': ecmaParser,
  '.cjs': ecmaParser,
  '.ts': tsParser,
  '.tsx': tsParser,
  '.cts': tsParser,
  '.mts': tsParser,
  '.svelte': svelteParser,
  '.vue': vueParser,
  '.astro': astroParser,
};
