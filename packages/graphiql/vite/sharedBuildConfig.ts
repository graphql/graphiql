import type { BuildOptions } from 'vite'

// constants
import { BUILD_DIR } from './constants'

export const sharedBuildConfig: BuildOptions =  {
  sourcemap: !!process.env.MIN,
  minify: !!process.env.MIN,
  outDir: BUILD_DIR,
  emptyOutDir: false,
  lib: {
    entry: 'src/cdn.ts',
    // 👇 The name of the exposed global variable. Required when the formats option includes umd or iife
    name: "GraphiQL",
    fileName: () => process.env.MIN ? `graphiql.min.js` : `graphiql.js`,
    formats: ['umd'],
  },
  rollupOptions: {
    external: [
      'react', 
      'react-dom', 
    ],
    output: {
      assetFileNames: process.env.MIN ? `graphiql.min.[ext]` : `graphiql.[ext]`,        
      inlineDynamicImports: true,
      globals: {
        'react': 'React',
        'react-dom': 'ReactDOM',
      }
    }
  }
};