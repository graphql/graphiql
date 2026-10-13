const githubChangelog = require('@changesets/changelog-github').default;

// Prerelease changesets are replayed for the stable release, so omit these in both.
const omittedSummary = '<!-- omit from changelog -->';
const isOmitted = changeset => changeset.summary.trim() === omittedSummary;

module.exports = {
  getReleaseLine(changeset, type, options) {
    return isOmitted(changeset)
      ? ''
      : githubChangelog.getReleaseLine(changeset, type, options);
  },
  getDependencyReleaseLine(changesets, dependenciesUpdated, options) {
    const visibleChangesets = changesets.filter(
      changeset => !isOmitted(changeset),
    );
    if (changesets.length > 0 && visibleChangesets.length === 0) {
      return '';
    }
    return githubChangelog.getDependencyReleaseLine(
      visibleChangesets,
      dependenciesUpdated,
      options,
    );
  },
};
