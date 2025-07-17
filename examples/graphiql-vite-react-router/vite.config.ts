import { reactRouter } from "@react-router/dev/vite";
import monacoEditorPlugin from "vite-plugin-monaco-editor";
import { defineConfig } from "vite";
// import path from 'node:path'
export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    reactRouter(),
    // @ts-ignore
    monacoEditorPlugin.default({
      customWorkers: [
        {
          label: "graphql",
          entry: "monaco-graphql/esm/graphql.worker.js",
        },
      ],
      languageWorkers: ["editorWorkerService", "json"],
      customDistPath: (root: string, buildOutDir: string, base: string) => {
        console.log({root, buildOutDir, base})
          return '/Users/dmytro/Desktop/repros/graphiql-issue-4038/build/client/workers'
        // return buildOutDir
        // if (buildOutDir.endsWith('server')) {
        // }
        // console.log({buildOutDir})
        // return buildOutDir
      }
    }),
    {
      transformIndexHtml(html) {
        console.log({html})
        // Inject any tag/script/meta in dev on the SPA shell
        return html
        //   .replace(
        //   '</head>',
        //   `  <meta name="robots" content="noindex, nofollow">\n</head>`
        // );
      },
    }
    // {
    //   closeBundle() {
    //     const works = getWorks(options);
    //     const workerPaths = getWorkPath(works, options, resolvedConfig);
    //   }
    // }
  ],
  // worker: {
  //   format: "es",
  // },
  optimizeDeps: {
    force: true
  }
});
