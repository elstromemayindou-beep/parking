const path = require('node:path');
const packageJson = require(path.join(__dirname, 'package.json'));
const repository = process.env.GITHUB_REPOSITORY || '';
const match = repository.match(/^([^/]+)\/([^/]+)$/);

if (!match) {
  throw new Error('GITHUB_REPOSITORY doit contenir owner/repo pour publier une release.');
}

module.exports = {
  ...packageJson.build,
  publish: [{
    provider: 'github',
    owner: match[1],
    repo: match[2],
    releaseType: 'release'
  }]
};
