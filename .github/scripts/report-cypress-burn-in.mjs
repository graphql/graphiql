#!/usr/bin/env node

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const label = 'cypress-flake';
const cleanRunsToClose = 3;
const statePattern = /<!-- cypress-burn-in-state\n([\s\S]*?)\n-->/;

function requiredEnvironment(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

async function findResults(directory) {
  const results = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await findResults(entryPath)));
    } else if (entry.name === 'result.json') {
      results.push(JSON.parse(await readFile(entryPath, 'utf8')));
    }
  }
  return results;
}

function parseState(issue) {
  const match = issue.body?.match(statePattern);
  if (!match) {
    return null;
  }

  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function formatBody(state) {
  const recentRuns = state.recentRuns
    .map(
      run =>
        `- [${run.date}](${run.url}): ${run.occurrences} occurrence(s) on ${run.targets.join(', ')}`,
    )
    .join('\n');

  return `This issue is maintained by the scheduled Cypress burn-in workflow.

- **Spec:** \`${state.spec}\`
- **Normalized signature:** \`${state.signature}\`
- **First seen:** [${state.firstSeen.date}](${state.firstSeen.url})
- **Last seen:** [${state.lastSeen.date}](${state.lastSeen.url})
- **Total occurrences:** ${state.occurrences}
- **Clean burn-in streak:** ${state.cleanStreak}/${cleanRunsToClose}

Recent failing runs:

${recentRuns || '- None'}

The workflow closes this issue after ${cleanRunsToClose} consecutive complete burn-in runs do not reproduce the signature. A later recurrence reopens this issue.

<!-- cypress-burn-in-state
${JSON.stringify(state)}
-->`;
}

const token = requiredEnvironment('GITHUB_TOKEN');
const repository = requiredEnvironment('GITHUB_REPOSITORY');
const runId = requiredEnvironment('GITHUB_RUN_ID');
const serverUrl = process.env.GITHUB_SERVER_URL ?? 'https://github.com';
const runUrl = `${serverUrl}/${repository}/actions/runs/${runId}`;
const now = new Date().toISOString();
const [owner, repo] = repository.split('/');
const apiBase = `${process.env.GITHUB_API_URL ?? 'https://api.github.com'}/repos/${owner}/${repo}`;

async function github(endpoint, options = {}) {
  const response = await fetch(`${apiBase}${endpoint}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(
      `GitHub API ${options.method ?? 'GET'} ${endpoint} failed (${response.status}): ${await response.text()}`,
    );
  }

  return response.status === 204 ? null : response.json();
}

async function ensureLabel() {
  const labels = await github('/labels?per_page=100');
  if (!labels.some(candidate => candidate.name === label)) {
    await github('/labels', {
      method: 'POST',
      body: JSON.stringify({
        name: label,
        color: 'd73a4a',
        description: 'Reproduced by the scheduled Cypress burn-in',
      }),
    });
  }
}

const resultDirectory = path.resolve(process.argv[2] ?? 'burn-in-results');
const results = await findResults(resultDirectory);
if (results.length === 0) {
  throw new Error(`No result.json files found below ${resultDirectory}.`);
}
const expectedResults = Number(process.env.EXPECTED_RESULTS ?? results.length);
const completeRun = results.length === expectedResults;
const advanceCleanStreak = process.env.ADVANCE_CLEAN_STREAK === 'true';

await ensureLabel();
const issues = await github(
  `/issues?state=all&labels=${encodeURIComponent(label)}&per_page=100`,
);
const trackedIssues = issues
  .filter(issue => !issue.pull_request)
  .map(issue => ({ issue, state: parseState(issue) }))
  .filter(item => item.state);
const failures = new Map();
const testedSpecs = new Set(results.map(result => result.spec));

for (const result of results) {
  for (const failure of result.failures) {
    const key = `${result.spec}\0${failure.signatureHash}`;
    const group = failures.get(key) ?? {
      spec: result.spec,
      signature: failure.signature,
      signatureHash: failure.signatureHash,
      occurrences: 0,
      targets: new Set(),
    };
    group.occurrences += 1;
    group.targets.add(result.target);
    failures.set(key, group);
  }
}

for (const [key, failure] of failures) {
  const existing = trackedIssues.find(
    item => `${item.state.spec}\0${item.state.signatureHash}` === key,
  );
  const run = {
    date: now,
    url: runUrl,
    occurrences: failure.occurrences,
    targets: [...failure.targets].sort(),
  };
  const state = existing?.state ?? {
    spec: failure.spec,
    signature: failure.signature,
    signatureHash: failure.signatureHash,
    firstSeen: { date: now, url: runUrl },
    occurrences: 0,
    recentRuns: [],
  };
  state.lastSeen = { date: now, url: runUrl };
  state.occurrences += failure.occurrences;
  state.cleanStreak = 0;
  state.recentRuns = [
    run,
    ...state.recentRuns.filter(item => item.url !== runUrl),
  ].slice(0, 10);

  const title = `[Cypress flake] ${path.basename(failure.spec)}: ${failure.signature.slice(0, 80)}`;
  const body = formatBody(state);
  if (existing) {
    await github(`/issues/${existing.issue.number}`, {
      method: 'PATCH',
      body: JSON.stringify({ title, body, state: 'open' }),
    });
  } else {
    await github('/issues', {
      method: 'POST',
      body: JSON.stringify({ title, body, labels: [label] }),
    });
  }
}

for (const { issue, state } of trackedIssues) {
  const key = `${state.spec}\0${state.signatureHash}`;
  if (
    issue.state !== 'open' ||
    failures.has(key) ||
    !completeRun ||
    !advanceCleanStreak ||
    !testedSpecs.has(state.spec)
  ) {
    continue;
  }

  state.cleanStreak = (state.cleanStreak ?? 0) + 1;
  await github(`/issues/${issue.number}`, {
    method: 'PATCH',
    body: JSON.stringify({
      body: formatBody(state),
      ...(state.cleanStreak >= cleanRunsToClose
        ? { state: 'closed', state_reason: 'completed' }
        : {}),
    }),
  });
}

process.stdout.write(
  `Processed ${results.length}/${expectedResults} burn-in result(s) with ${failures.size} unique failure signature(s).${completeRun && advanceCleanStreak ? '' : ' This run did not advance clean streaks.'}\n`,
);
