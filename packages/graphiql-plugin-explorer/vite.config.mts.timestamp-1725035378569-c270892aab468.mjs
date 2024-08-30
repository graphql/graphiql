// vite.config.mts
import { createRequire } from "node:module";
import { defineConfig } from "file:///home/rikki/projects/graphiql/node_modules/vite/dist/node/index.js";
import react from "file:///home/rikki/projects/graphiql/node_modules/@vitejs/plugin-react/dist/index.mjs";
import svgr from "file:///home/rikki/projects/graphiql/node_modules/vite-plugin-svgr/dist/index.js";
import dts from "file:///home/rikki/projects/graphiql/node_modules/vite-plugin-dts/dist/index.mjs";

// package.json
var package_default = {
  name: "@graphiql/plugin-explorer",
  version: "4.0.0-alpha.2",
  repository: {
    type: "git",
    url: "https://github.com/graphql/graphiql",
    directory: "packages/graphiql-plugin-explorer"
  },
  main: "dist/index.js",
  module: "dist/index.mjs",
  types: "dist/index.d.ts",
  license: "MIT",
  keywords: [
    "react",
    "graphql",
    "graphiql",
    "plugin",
    "explorer"
  ],
  files: [
    "dist"
  ],
  exports: {
    "./package.json": "./package.json",
    "./style.css": "./dist/style.css",
    ".": {
      import: "./dist/index.mjs",
      require: "./dist/index.js",
      types: "./dist/index.d.ts"
    }
  },
  scripts: {
    dev: "vite build --watch",
    build: "vite build && UMD=true vite build",
    postbuild: "cp src/graphiql-explorer.d.ts dist/graphiql-explorer.d.ts",
    prebuild: "yarn types:check",
    "types:check": "tsc --noEmit"
  },
  dependencies: {
    "graphiql-explorer": "^0.9.0"
  },
  peerDependencies: {
    "@graphiql/react": "^1.0.0-alpha.0",
    graphql: "^15.5.0 || ^16.0.0 || ^17.0.0-alpha.2",
    react: "^16.8.0 || ^17 || ^18",
    "react-dom": "^16.8.0 || ^17 || ^18"
  },
  devDependencies: {
    "@graphiql/react": "^1.0.0-alpha.3",
    "@vitejs/plugin-react": "^4.3.1",
    graphql: "^17.0.0-alpha.7",
    react: "^18.2.0",
    "react-dom": "^18.2.0",
    typescript: "^4.6.3",
    vite: "^5.4.0",
    "vite-plugin-dts": "^4.0.1",
    "vite-plugin-svgr": "^4.2.0"
  }
};

// vite.config.mts
var __vite_injected_original_import_meta_url = "file:///home/rikki/projects/graphiql/packages/graphiql-plugin-explorer/vite.config.mts";
var IS_UMD = process.env.UMD === "true";
var vite_config_default = defineConfig({
  plugins: [
    react({ jsxRuntime: "classic" }),
    svgr({
      exportAsDefault: true,
      svgrOptions: {
        titleProp: true
      }
    }),
    !IS_UMD && [dts({ rollupTypes: true }), htmlPlugin()]
  ],
  build: {
    minify: IS_UMD ? "terser" : false,
    // avoid clean cjs/es builds
    emptyOutDir: !IS_UMD,
    lib: {
      entry: "src/index.tsx",
      fileName: "index",
      name: "GraphiQLPluginExplorer",
      formats: IS_UMD ? ["umd"] : ["cjs", "es"]
    },
    rollupOptions: {
      external: [
        // Exclude peer dependencies and dependencies from bundle
        ...Object.keys(package_default.peerDependencies),
        ...IS_UMD ? [] : Object.keys(package_default.dependencies)
      ],
      output: {
        chunkFileNames: "[name].[format].js",
        globals: {
          "@graphiql/react": "GraphiQL.React",
          graphql: "GraphiQL.GraphQL",
          react: "React",
          "react-dom": "ReactDOM"
        }
      }
    },
    commonjsOptions: {
      esmExternals: true,
      requireReturnsDefault: "auto"
    }
  }
});
function htmlPlugin() {
  const require2 = createRequire(__vite_injected_original_import_meta_url);
  const graphiqlPath = require2.resolve("graphiql/package.json").replace("/package.json", "");
  const htmlForVite = `<link rel="stylesheet" href="${graphiqlPath}/src/style.css" />
<script type="module">
import React from 'react';
import ReactDOM from 'react-dom/client';
import GraphiQL from '${graphiqlPath}/src/cdn';
import * as GraphiQLPluginExplorer from './src';

Object.assign(globalThis, { React, ReactDOM, GraphiQL, GraphiQLPluginExplorer });
</script>`;
  return {
    name: "html-replace-umd-with-src",
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        const start = "</style>";
        const end = "<body>";
        const contentToReplace = html.slice(
          html.indexOf(start) + start.length,
          html.indexOf(end)
        );
        return html.replace(contentToReplace, htmlForVite);
      }
    }
  };
}
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubXRzIiwgInBhY2thZ2UuanNvbiJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL3Jpa2tpL3Byb2plY3RzL2dyYXBoaXFsL3BhY2thZ2VzL2dyYXBoaXFsLXBsdWdpbi1leHBsb3JlclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvcmlra2kvcHJvamVjdHMvZ3JhcGhpcWwvcGFja2FnZXMvZ3JhcGhpcWwtcGx1Z2luLWV4cGxvcmVyL3ZpdGUuY29uZmlnLm10c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9yaWtraS9wcm9qZWN0cy9ncmFwaGlxbC9wYWNrYWdlcy9ncmFwaGlxbC1wbHVnaW4tZXhwbG9yZXIvdml0ZS5jb25maWcubXRzXCI7aW1wb3J0IHsgY3JlYXRlUmVxdWlyZSB9IGZyb20gJ25vZGU6bW9kdWxlJztcbmltcG9ydCB7IGRlZmluZUNvbmZpZywgUGx1Z2luT3B0aW9uIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHN2Z3IgZnJvbSAndml0ZS1wbHVnaW4tc3Zncic7XG5pbXBvcnQgZHRzIGZyb20gJ3ZpdGUtcGx1Z2luLWR0cyc7XG5pbXBvcnQgcGFja2FnZUpTT04gZnJvbSAnLi9wYWNrYWdlLmpzb24nO1xuXG5jb25zdCBJU19VTUQgPSBwcm9jZXNzLmVudi5VTUQgPT09ICd0cnVlJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KHsganN4UnVudGltZTogJ2NsYXNzaWMnIH0pLFxuICAgIHN2Z3Ioe1xuICAgICAgZXhwb3J0QXNEZWZhdWx0OiB0cnVlLFxuICAgICAgc3Znck9wdGlvbnM6IHtcbiAgICAgICAgdGl0bGVQcm9wOiB0cnVlLFxuICAgICAgfSxcbiAgICB9KSxcbiAgICAhSVNfVU1EICYmIFtkdHMoeyByb2xsdXBUeXBlczogdHJ1ZSB9KSwgaHRtbFBsdWdpbigpXSxcbiAgXSxcbiAgYnVpbGQ6IHtcbiAgICBtaW5pZnk6IElTX1VNRFxuICAgICAgPyAndGVyc2VyJyAvLyBwcm9kdWNlIGJldHRlciBidW5kbGUgc2l6ZSB0aGFuIGVzYnVpbGRcbiAgICAgIDogZmFsc2UsXG4gICAgLy8gYXZvaWQgY2xlYW4gY2pzL2VzIGJ1aWxkc1xuICAgIGVtcHR5T3V0RGlyOiAhSVNfVU1ELFxuICAgIGxpYjoge1xuICAgICAgZW50cnk6ICdzcmMvaW5kZXgudHN4JyxcbiAgICAgIGZpbGVOYW1lOiAnaW5kZXgnLFxuICAgICAgbmFtZTogJ0dyYXBoaVFMUGx1Z2luRXhwbG9yZXInLFxuICAgICAgZm9ybWF0czogSVNfVU1EID8gWyd1bWQnXSA6IFsnY2pzJywgJ2VzJ10sXG4gICAgfSxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBleHRlcm5hbDogW1xuICAgICAgICAvLyBFeGNsdWRlIHBlZXIgZGVwZW5kZW5jaWVzIGFuZCBkZXBlbmRlbmNpZXMgZnJvbSBidW5kbGVcbiAgICAgICAgLi4uT2JqZWN0LmtleXMocGFja2FnZUpTT04ucGVlckRlcGVuZGVuY2llcyksXG4gICAgICAgIC4uLihJU19VTUQgPyBbXSA6IE9iamVjdC5rZXlzKHBhY2thZ2VKU09OLmRlcGVuZGVuY2llcykpLFxuICAgICAgXSxcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBjaHVua0ZpbGVOYW1lczogJ1tuYW1lXS5bZm9ybWF0XS5qcycsXG4gICAgICAgIGdsb2JhbHM6IHtcbiAgICAgICAgICAnQGdyYXBoaXFsL3JlYWN0JzogJ0dyYXBoaVFMLlJlYWN0JyxcbiAgICAgICAgICBncmFwaHFsOiAnR3JhcGhpUUwuR3JhcGhRTCcsXG4gICAgICAgICAgcmVhY3Q6ICdSZWFjdCcsXG4gICAgICAgICAgJ3JlYWN0LWRvbSc6ICdSZWFjdERPTScsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gICAgY29tbW9uanNPcHRpb25zOiB7XG4gICAgICBlc21FeHRlcm5hbHM6IHRydWUsXG4gICAgICByZXF1aXJlUmV0dXJuc0RlZmF1bHQ6ICdhdXRvJyxcbiAgICB9LFxuICB9LFxufSk7XG5cbmZ1bmN0aW9uIGh0bWxQbHVnaW4oKTogUGx1Z2luT3B0aW9uIHtcbiAgY29uc3QgcmVxdWlyZSA9IGNyZWF0ZVJlcXVpcmUoaW1wb3J0Lm1ldGEudXJsKTtcblxuICBjb25zdCBncmFwaGlxbFBhdGggPSByZXF1aXJlXG4gICAgLnJlc29sdmUoJ2dyYXBoaXFsL3BhY2thZ2UuanNvbicpXG4gICAgLnJlcGxhY2UoJy9wYWNrYWdlLmpzb24nLCAnJyk7XG5cbiAgY29uc3QgaHRtbEZvclZpdGUgPSBgPGxpbmsgcmVsPVwic3R5bGVzaGVldFwiIGhyZWY9XCIke2dyYXBoaXFsUGF0aH0vc3JjL3N0eWxlLmNzc1wiIC8+XG48c2NyaXB0IHR5cGU9XCJtb2R1bGVcIj5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUmVhY3RET00gZnJvbSAncmVhY3QtZG9tL2NsaWVudCc7XG5pbXBvcnQgR3JhcGhpUUwgZnJvbSAnJHtncmFwaGlxbFBhdGh9L3NyYy9jZG4nO1xuaW1wb3J0ICogYXMgR3JhcGhpUUxQbHVnaW5FeHBsb3JlciBmcm9tICcuL3NyYyc7XG5cbk9iamVjdC5hc3NpZ24oZ2xvYmFsVGhpcywgeyBSZWFjdCwgUmVhY3RET00sIEdyYXBoaVFMLCBHcmFwaGlRTFBsdWdpbkV4cGxvcmVyIH0pO1xuPC9zY3JpcHQ+YDtcblxuICByZXR1cm4ge1xuICAgIG5hbWU6ICdodG1sLXJlcGxhY2UtdW1kLXdpdGgtc3JjJyxcbiAgICB0cmFuc2Zvcm1JbmRleEh0bWw6IHtcbiAgICAgIG9yZGVyOiAncHJlJyxcbiAgICAgIGhhbmRsZXIoaHRtbCkge1xuICAgICAgICBjb25zdCBzdGFydCA9ICc8L3N0eWxlPic7XG4gICAgICAgIGNvbnN0IGVuZCA9ICc8Ym9keT4nO1xuICAgICAgICBjb25zdCBjb250ZW50VG9SZXBsYWNlID0gaHRtbC5zbGljZShcbiAgICAgICAgICBodG1sLmluZGV4T2Yoc3RhcnQpICsgc3RhcnQubGVuZ3RoLFxuICAgICAgICAgIGh0bWwuaW5kZXhPZihlbmQpLFxuICAgICAgICApO1xuICAgICAgICByZXR1cm4gaHRtbC5yZXBsYWNlKGNvbnRlbnRUb1JlcGxhY2UsIGh0bWxGb3JWaXRlKTtcbiAgICAgIH0sXG4gICAgfSxcbiAgfTtcbn1cbiIsICJ7XG4gIFwibmFtZVwiOiBcIkBncmFwaGlxbC9wbHVnaW4tZXhwbG9yZXJcIixcbiAgXCJ2ZXJzaW9uXCI6IFwiNC4wLjAtYWxwaGEuMlwiLFxuICBcInJlcG9zaXRvcnlcIjoge1xuICAgIFwidHlwZVwiOiBcImdpdFwiLFxuICAgIFwidXJsXCI6IFwiaHR0cHM6Ly9naXRodWIuY29tL2dyYXBocWwvZ3JhcGhpcWxcIixcbiAgICBcImRpcmVjdG9yeVwiOiBcInBhY2thZ2VzL2dyYXBoaXFsLXBsdWdpbi1leHBsb3JlclwiXG4gIH0sXG4gIFwibWFpblwiOiBcImRpc3QvaW5kZXguanNcIixcbiAgXCJtb2R1bGVcIjogXCJkaXN0L2luZGV4Lm1qc1wiLFxuICBcInR5cGVzXCI6IFwiZGlzdC9pbmRleC5kLnRzXCIsXG4gIFwibGljZW5zZVwiOiBcIk1JVFwiLFxuICBcImtleXdvcmRzXCI6IFtcbiAgICBcInJlYWN0XCIsXG4gICAgXCJncmFwaHFsXCIsXG4gICAgXCJncmFwaGlxbFwiLFxuICAgIFwicGx1Z2luXCIsXG4gICAgXCJleHBsb3JlclwiXG4gIF0sXG4gIFwiZmlsZXNcIjogW1xuICAgIFwiZGlzdFwiXG4gIF0sXG4gIFwiZXhwb3J0c1wiOiB7XG4gICAgXCIuL3BhY2thZ2UuanNvblwiOiBcIi4vcGFja2FnZS5qc29uXCIsXG4gICAgXCIuL3N0eWxlLmNzc1wiOiBcIi4vZGlzdC9zdHlsZS5jc3NcIixcbiAgICBcIi5cIjoge1xuICAgICAgXCJpbXBvcnRcIjogXCIuL2Rpc3QvaW5kZXgubWpzXCIsXG4gICAgICBcInJlcXVpcmVcIjogXCIuL2Rpc3QvaW5kZXguanNcIixcbiAgICAgIFwidHlwZXNcIjogXCIuL2Rpc3QvaW5kZXguZC50c1wiXG4gICAgfVxuICB9LFxuICBcInNjcmlwdHNcIjoge1xuICAgIFwiZGV2XCI6IFwidml0ZSBidWlsZCAtLXdhdGNoXCIsXG4gICAgXCJidWlsZFwiOiBcInZpdGUgYnVpbGQgJiYgVU1EPXRydWUgdml0ZSBidWlsZFwiLFxuICAgIFwicG9zdGJ1aWxkXCI6IFwiY3Agc3JjL2dyYXBoaXFsLWV4cGxvcmVyLmQudHMgZGlzdC9ncmFwaGlxbC1leHBsb3Jlci5kLnRzXCIsXG4gICAgXCJwcmVidWlsZFwiOiBcInlhcm4gdHlwZXM6Y2hlY2tcIixcbiAgICBcInR5cGVzOmNoZWNrXCI6IFwidHNjIC0tbm9FbWl0XCJcbiAgfSxcbiAgXCJkZXBlbmRlbmNpZXNcIjoge1xuICAgIFwiZ3JhcGhpcWwtZXhwbG9yZXJcIjogXCJeMC45LjBcIlxuICB9LFxuICBcInBlZXJEZXBlbmRlbmNpZXNcIjoge1xuICAgIFwiQGdyYXBoaXFsL3JlYWN0XCI6IFwiXjEuMC4wLWFscGhhLjBcIixcbiAgICBcImdyYXBocWxcIjogXCJeMTUuNS4wIHx8IF4xNi4wLjAgfHwgXjE3LjAuMC1hbHBoYS4yXCIsXG4gICAgXCJyZWFjdFwiOiBcIl4xNi44LjAgfHwgXjE3IHx8IF4xOFwiLFxuICAgIFwicmVhY3QtZG9tXCI6IFwiXjE2LjguMCB8fCBeMTcgfHwgXjE4XCJcbiAgfSxcbiAgXCJkZXZEZXBlbmRlbmNpZXNcIjoge1xuICAgIFwiQGdyYXBoaXFsL3JlYWN0XCI6IFwiXjEuMC4wLWFscGhhLjNcIixcbiAgICBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI6IFwiXjQuMy4xXCIsXG4gICAgXCJncmFwaHFsXCI6IFwiXjE3LjAuMC1hbHBoYS43XCIsXG4gICAgXCJyZWFjdFwiOiBcIl4xOC4yLjBcIixcbiAgICBcInJlYWN0LWRvbVwiOiBcIl4xOC4yLjBcIixcbiAgICBcInR5cGVzY3JpcHRcIjogXCJeNC42LjNcIixcbiAgICBcInZpdGVcIjogXCJeNS40LjBcIixcbiAgICBcInZpdGUtcGx1Z2luLWR0c1wiOiBcIl40LjAuMVwiLFxuICAgIFwidml0ZS1wbHVnaW4tc3ZnclwiOiBcIl40LjIuMFwiXG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBaVgsU0FBUyxxQkFBcUI7QUFDL1ksU0FBUyxvQkFBa0M7QUFDM0MsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixPQUFPLFNBQVM7OztBQ0poQjtBQUFBLEVBQ0UsTUFBUTtBQUFBLEVBQ1IsU0FBVztBQUFBLEVBQ1gsWUFBYztBQUFBLElBQ1osTUFBUTtBQUFBLElBQ1IsS0FBTztBQUFBLElBQ1AsV0FBYTtBQUFBLEVBQ2Y7QUFBQSxFQUNBLE1BQVE7QUFBQSxFQUNSLFFBQVU7QUFBQSxFQUNWLE9BQVM7QUFBQSxFQUNULFNBQVc7QUFBQSxFQUNYLFVBQVk7QUFBQSxJQUNWO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQVM7QUFBQSxJQUNQO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBVztBQUFBLElBQ1Qsa0JBQWtCO0FBQUEsSUFDbEIsZUFBZTtBQUFBLElBQ2YsS0FBSztBQUFBLE1BQ0gsUUFBVTtBQUFBLE1BQ1YsU0FBVztBQUFBLE1BQ1gsT0FBUztBQUFBLElBQ1g7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFXO0FBQUEsSUFDVCxLQUFPO0FBQUEsSUFDUCxPQUFTO0FBQUEsSUFDVCxXQUFhO0FBQUEsSUFDYixVQUFZO0FBQUEsSUFDWixlQUFlO0FBQUEsRUFDakI7QUFBQSxFQUNBLGNBQWdCO0FBQUEsSUFDZCxxQkFBcUI7QUFBQSxFQUN2QjtBQUFBLEVBQ0Esa0JBQW9CO0FBQUEsSUFDbEIsbUJBQW1CO0FBQUEsSUFDbkIs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
