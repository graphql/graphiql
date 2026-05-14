# Cutting New Releases

TODO: Redo for `changesets`. See [`Changesets Readme`](./.changeset/README.md)

## VSCode extension releases

After Changesets publishes the npm packages, the release workflow hands the
VSCode extension pipeline to [`scripts/release-vscode.mts`](./scripts/release-vscode.mts).
It exposes four commands — `build`, `attach`, `publish-vsce`, `publish-ovsx` —
each of which operates only on the extensions actually released in this run
(filtered from the Changesets `publishedPackages` output).

### Why attach to GitHub Releases

We upload each built `.vsix` to its GitHub Release tag in addition to
publishing to the VSCode Marketplace and Open VSX. That makes the artifact
downloadable directly from GitHub — useful when a registry is degraded, when
a PAT has expired and a manual re-upload is needed, or for anyone who wants
the exact bits we shipped without going through a marketplace.

### Why a TS script, not workflow shell

Per-package iteration, version lookups, and registry-API calls are tidier
(and safer) in a type-checked TS file than spread across `run:` blocks of
bash in `release.yml`. The script type-checks under `scripts/tsconfig.json`,
can be run locally with a mocked `PUBLISHED_PACKAGES` env var, and aggregates
failures across packages rather than short-circuiting on the first error.
