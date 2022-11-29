import { defineConfig } from 'vite';
import type { PluginOption } from 'vite';

// constants
import { BUILD_DIR } from './constants';

// plugins
import { GraphiQLHTMLPlugin } from './GraphiQLHTMLPlugin';
import { visualizer } from "rollup-plugin-visualizer";

// shared config
import { sharedCSSConfig } from './sharedCSSConfig';

export default defineConfig(({ mode }) => {
  return {
    css: {
      ...sharedCSSConfig, 
    },      
    plugins: [
      visualizer({
        filename: `${BUILD_DIR}/analyzer.html`,
      }) as PluginOption,
      GraphiQLHTMLPlugin({ mode }),    
    ],  
    build: {
      outDir: BUILD_DIR,
      emptyOutDir: false,
    },   
  }  
});