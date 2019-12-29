import { RenderGraphiQLOptions } from './types';
import { generateFetcher } from './fetcher';

const stringifyConfig = (opts: RenderGraphiQLOptions) => {
  return JSON.stringify(opts, function(_key, value) {
    if (typeof value === 'function') {
      return value.toString();
    } else {
      return value;
    }
  });
};

export default function renderGraphiQLToSTring(
  opts: RenderGraphiQLOptions,
): string {
  return `
  <html>
    <head>
      <title>GraphiQL</title>
    </head>
    <script>
    window.gConfig = ${stringifyConfig({
      ...opts,
      fetcher: opts.fetcher || generateFetcher(opts),
    })}
    </script>
    <body style="height: '100vh'">
      <script crossorigin src="https://unpkg.com/react@16/umd/react.production.min.js"></script>
      <script crossorigin src="https://unpkg.com/react-dom@16/umd/react-dom.production.min.js"></script>
      <script crossorigin src="https://unpkg.com/graphiql@0.17.5/graphiql.min.js" />
      <script>
      </script>
      <main id="root"></main>
    </body>,
  </html>`;
}
