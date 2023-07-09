import { defineConfig } from 'vite';

import { graphiqlVitePlugin } from '@graphiql/plugin-utils';

export default defineConfig({
  plugins: graphiqlVitePlugin({ umdExportName: 'GraphiQLPluginCodeExporter' }),
});
