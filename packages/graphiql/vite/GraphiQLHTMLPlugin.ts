import type { Plugin } from 'vite';

// constants
import { BUILD_DIR } from './constants';

// utils
// import fs from 'fs';
import { writeFile } from 'fs/promises';
import pkg from '../package.json';

export const GraphiQLHTMLPlugin = ({ mode }:{ mode: string }): Plugin => {

  return {
    name: 'graphiql-html-plugin',

    transformIndexHtml: (html) => {

      // we override vite's "mode" when we're developing or running e2e tests
      const isDevOrE2e = ["GRAPHIQL_DEV", "GRAPHIQL_E2E"].includes(mode);

      const doReplace = ({ min }:{ min: boolean }): string => {
        let replaced = html;

        const replacements = {
          "<graphiqlversion/>": `${JSON.stringify(pkg.devDependencies.graphql)}`,
          "<graphiqljs/>": `<script src='${isDevOrE2e ? "build/" : ""}graphiql${min ? '.min' : ''}.js'></script>`,
          "<graphiqlcss/>": `<link href='${isDevOrE2e ? "build/" : ""}graphiql${min ? '.min' : ''}.css' rel="stylesheet">`,
          "<renderExample/>": `<script defer src='${isDevOrE2e ? "" : ".."}/resources/renderExample.js' type="application/javascript"></script>`
        };
       
        replaced = html.replace(/<graphiqlversion\/>|<graphiqljs\/>|<graphiqlcss\/>|<renderExample\/>/gi, (matched) => {
          return replacements[matched];
        });   
       
        return replaced;
      }

      let index: string;

      if (isDevOrE2e) {
        // this is "hot-replacing" within our root "index.html" file
        index = doReplace({min: false});
      } else {
        // we're in vite's "production" mode, so this is replacing/building/writing build/index.html
        index = doReplace({min: true});

        // we have to handle on our own the writing of our "dev.html" file
        // this "dev.html" is used for the uncompressed netlify deployment
        // i wonder if this might not be relevant any longer...?
        const dev = doReplace({min: false});

        writeFile(`${BUILD_DIR}/dev.html`, dev)
        // eslint-disable-next-line no-console
        .catch((e) => console.log(e));
      }

      return index;
    }  
  }
};