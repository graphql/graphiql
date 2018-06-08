const fs = require('fs');

const readFileAsJSON = (path) => {
  const json = fs.readFileSync(path, 'utf8');
  return JSON.parse(json);
};

if (
  readFileAsJSON('package.json').version !==
  readFileAsJSON('ts-graphql-plugin/package.json').version
) {
  throw new Error('Package versions are out of sync');
}
