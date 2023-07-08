import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import postCssNestingPlugin from 'postcss-nesting';
import dts from 'vite-plugin-dts';
import type { Plugin, UserConfig } from 'vite';

const IS_UMD = process.env.UMD === 'true';

type PluginOptions = {
  /**
   * The plugin name used by the UMD global
   */
  pluginName: string;
};

function graphiqlPluginConfig({ pluginName }: PluginOptions): Plugin {
  return {
    name: 'vite-plugin-graphiql-plugin:build',
    enforce: 'pre',
    async config(config) {
      const packageJSON = await import(`${process.env.PWD}/package.json`);
      const external = [];
      const userExternal = config.build?.rollupOptions?.external;
      if (userExternal) {
        if (Array.isArray(userExternal)) {
          external.push(...userExternal);
        } else if (typeof userExternal === 'string') {
          external.push(userExternal);
        }
      }
      if (typeof config.css?.postcss === 'string') {
        throw new Error('config.css.postcss passed as string, must be object');
      }
      return {
        ...config,
        css: {
          ...config?.css,
          postcss: {
            ...config?.css?.postcss,
            plugins: [
              ...(config?.css?.postcss?.plugins ?? []),
              postCssNestingPlugin(),
            ],
          },
        },
        esbuild: {
          ...config?.esbuild,
          // We use function names for generating readable error messages, so we want
          // them to be preserved when building and minifying.
          keepNames: true,
        },
        build: {
          ...config?.build,
          emptyOutDir: !IS_UMD,
          lib: {
            ...config?.build?.lib,
            entry: 'src/index.tsx',
            fileName: 'index',
            name: pluginName,
            formats: IS_UMD ? ['umd'] : ['cjs', 'es'],
          },
          rollupOptions: {
            ...config?.build?.rollupOptions,
            external: [
              ...external,
              // Exclude peer dependencies and dependencies from bundle
              ...Object.keys(packageJSON.peerDependencies),
              ...(IS_UMD ? [] : Object.keys(packageJSON.dependencies)),
            ],
            output: {
              chunkFileNames: '[name].[format].js',
              globals: {
                '@graphiql/react': 'GraphiQL.React',
                graphql: 'GraphiQL.GraphQL',
                react: 'React',
                'react-dom': 'ReactDOM',
              },
            },
          },
          commonjsOptions: {
            esmExternals: true,
            requireReturnsDefault: 'auto',
          },
        },
      } as UserConfig;
    },
  };
}

/**
 * @type import("vite").Plugin
 */
export function graphiqlVitePlugin(config: PluginOptions) {
  const plugins = [];
  if (!IS_UMD) {
    plugins.push(
      dts({
        cleanVueFileName: true,
        copyDtsFiles: true,
        outDir: 'types',
        staticImport: true,
      }),
    );
  }
  return [
    graphiqlPluginConfig(config),
    react(),
    ...plugins,
    svgr({
      exportAsDefault: true,
      svgrOptions: {
        titleProp: true,
      },
    }),
  ];
}
