import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin';
import { patchWebpackConfig } from 'next-global-css';

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  trailingSlash: true,
  webpack(config, options) {
    // this fixes some issues with loading web workers
    config.output.publicPath = '/_next/';
    // because next.js doesn't like node_modules that import css files
    // this solves the issue for monaco-editor, which relies on importing css files
    patchWebpackConfig(config, options);
    config.resolve.alias = {
      ...config.resolve.alias,
      // this solves a bug with more recent `monaco-editor` versions in next.js,
      // where vscode contains a version of `marked` with modules pre-transpiled, which seems to break the build.
      //
      // (the error mentions that exports.Lexer is a const that can't be re-declared)
      '../common/marked/marked.js': 'marked',
    };
    if (!options.isServer) {
      config.plugins.push(
        // if you find yourself needing to override
        // MonacoEnvironment.getWorkerUrl or MonacoEnvironment.getWorker,
        // you probably just need to tweak configuration here.
        new MonacoWebpackPlugin({
          // you can add other languages here as needed
          languages: ['json', 'graphql'],
          filename: 'static/[name].worker.js',
          // this is not in the plugin readme, but saves us having to override
          // MonacoEnvironment.getWorkerUrl or similar.
          customLanguages: [
            {
              label: 'graphql',
              worker: {
                id: 'graphql',
                entry: 'monaco-graphql/esm/graphql.worker.js',
              },
            },
          ],
        }),
      );
    }
    // load monaco-editor provided ttf fonts
    config.module.rules.push({ test: /\.ttf$/, type: 'asset/resource' });
    return config;
  },
};

export default nextConfig;
