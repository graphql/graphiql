import { defineConfig, PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import postCssNestingPlugin from 'postcss-nesting';
import packageJSON from './package.json';

const ReactCompilerConfig = {
  target: '17',
  sources(filename) {
    if (filename.includes('__tests__')) return false;
    return filename.includes('graphiql-react');
  },
};

export const plugins: PluginOption[] = [
  react({
    babel: {
      plugins: [['babel-plugin-react-compiler', ReactCompilerConfig]],
    },
  }),
  svgr({
    svgrOptions: {
      titleProp: true,
    },
  }),
];

export default defineConfig({
  plugins,
  css: {
    postcss: {
      plugins: [postCssNestingPlugin()],
    },
  },
  build: {
    minify: false,
    sourcemap: true,
    lib: {
      entry: 'src/index.ts',
      fileName: 'index',
      formats: ['cjs', 'es'],
    },
    rollupOptions: {
      external: [
        'react/jsx-runtime',
        // Exclude peer dependencies and dependencies from bundle
        ...Object.keys(packageJSON.peerDependencies),
        ...Object.keys(packageJSON.dependencies),
        // Exclude `codemirror/...` and `codemirror-graphql/...` but not `../style/codemirror.css`
        /codemirror[/-]/,
      ],
      output: {
        chunkFileNames: '[name].[format].js',
      },
    },
  },
});
