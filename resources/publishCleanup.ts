import { Octokit } from '@octokit/rest';

const owner = 'graphql';
const repo = 'graphiql';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN || process.env.GH_TOKEN,
  log: {
    debug: () => {},
    info: console.log,
    warn: console.warn,
    error: console.error,
  },
});

async function run() {
  const releases = await octokit.repos.listReleases({
    owner,
    repo,
    per_page: 100,
  });
  const exampleReleases = releases.data.filter(
    ({ name }) => name && (name.includes('example') || name.includes('rfc')),
  );

  console.log(
    `deleting ${exampleReleases.length} errant releases created by lerna publish`,
  );

  await Promise.all(
    exampleReleases.map(async release => {
      await octokit.repos.deleteRelease({
        owner,
        repo,
        release_id: release.id,
      });
      await octokit.git.deleteRef({
        owner,
        repo,
        ref: `tags/${release.tag_name}`,
      });
    }),
  );
}

(async () => {
  try {
    await run();
  } catch (err) {
    console.error(err);
  }
})();
