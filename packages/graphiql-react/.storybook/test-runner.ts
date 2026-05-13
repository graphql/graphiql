import type { TestRunnerConfig } from '@storybook/test-runner';
import { getStoryContext } from '@storybook/test-runner';
import { injectAxe, configureAxe, getViolations } from 'axe-playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const baselinePath = join(__dirname, 'a11y-baseline.json');
const baseline = JSON.parse(readFileSync(baselinePath, 'utf-8')) as {
  stories: Record<string, { violations: any[] }>;
};
const updateBaseline = process.env.A11Y_UPDATE_BASELINE === '1';

const config: TestRunnerConfig = {
  async preVisit(page) {
    await injectAxe(page);
  },
  async postVisit(page, context) {
    const storyContext = await getStoryContext(page, context);
    if (storyContext.parameters?.a11y?.disable) {
      return;
    }

    await configureAxe(page, {
      rules: storyContext.parameters?.a11y?.config?.rules ?? [],
    });

    const violations = await getViolations(page);
    const storyId = context.id;

    if (updateBaseline) {
      baseline.stories[storyId] = { violations };
      writeFileSync(baselinePath, JSON.stringify(baseline, null, 2) + '\n');
      return;
    }

    const baselineViolations = baseline.stories[storyId]?.violations ?? [];
    const toKey = (v: { id: string; nodes: unknown[] }) =>
      `${v.id}:${v.nodes.length}`;
    const baselineKeys = new Set(baselineViolations.map(toKey));
    const newViolations = violations.filter(v => !baselineKeys.has(toKey(v)));

    if (newViolations.length > 0) {
      const summary = newViolations
        .map(v => `  - ${v.id}: ${v.help} (${v.nodes.length} node(s))`)
        .join('\n');
      throw new Error(`New a11y violations in "${storyId}":\n${summary}`);
    }
  },
};

export default config;
