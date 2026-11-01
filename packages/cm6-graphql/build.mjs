import { fileURLToPath } from 'node:url';
import { build } from '@marijn/buildtool';
import { lezer } from '@lezer/generator/rollup';

const built = await build(
  fileURLToPath(new URL('./src/index.ts', import.meta.url)),
  {
    expandLink: anchor => `https://codemirror.net/6/docs/ref/#${anchor}`,
    pureTopCalls: true,
    outputPlugin: () => lezer(),
  },
);

if (!built) {
  process.exitCode = 1;
}
