import { defineConfig } from 'vite';

// shared config
import { sharedBuildConfig } from './sharedBuildConfig';
import { sharedCSSConfig } from './sharedCSSConfig';
import { sharedDefineConfig } from './sharedDefineConfig';

export default defineConfig(() => {
  return {  
    css: {
      ...sharedCSSConfig,  
    },  
    define: {
      ...sharedDefineConfig,
    },    
    build: {
      ...sharedBuildConfig,
    },
  }
});