import { defineConfig } from 'vite';

// plugins
import { GraphiQLHTMLPlugin } from './vite/GraphiQLHTMLPlugin';

// shared
import { sharedBuildConfig } from './vite/sharedBuildConfig';
import { sharedCSSConfig } from './vite/sharedCSSConfig';


export default defineConfig(({ mode }) => {
  return {
    server: {
    // prevent browser window from opening automatically
      open: false,
      proxy: {
        '/graphql': 'http://localhost:8080',
        '/bad/graphql': 'http://localhost:8080',
        '/http-error/graphql': 'http://localhost:8080',
        '/graphql-error/graphql': 'http://localhost:8080',
        '/subscriptions': { 
          target: 'ws://localhost:8081', 
          ws: true
        }
      },    
    },
    css: {
      ...sharedCSSConfig, 
    },  
    plugins: [
      GraphiQLHTMLPlugin({ mode }),
    ],
    build: {
      ...sharedBuildConfig,
    },
  }
});