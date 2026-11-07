# Packaged VS Code compatibility

The language and execution extensions require VS Code 1.100.3. The syntax extension retains its independent 1.63.0 minimum. These are supported, tested editor floors, not claims about the first releases on which any extension feature can activate. This work does not establish a repository-wide Node support policy.

## Run the checks

Use the repository's development Node version and install dependencies with `pnpm install --frozen-lockfile`. Build workspace dependencies and package the extensions through their release packaging commands:

```sh
pnpm exec turbo run build --filter=vscode-graphql... --filter=vscode-graphql-execution...
pnpm test:vscode --package-only
```

On Linux, use `xvfb-run -a` before each test command. These commands open isolated VS Code windows on macOS and Windows, so use CI when local windows would interrupt your work:

```sh
pnpm test:vscode --extension runtime --version minimum
pnpm test:vscode --extension runtime --version stable
pnpm test:vscode --extension syntax --version minimum
```

`--version minimum` reads each selected extension's `engines.vscode`. An explicit editor version, such as `--version 1.104.0`, supports diagnostic runs. `--extension` accepts `all`, `runtime`, `language`, `execution`, or `syntax`. The runner installs VSIX files from `out/vsix`; `--artifacts-dir` selects another directory, including the release workflow's `packages` directory. Testing does not rebuild the supplied artifacts.

Each run creates a temporary profile, installed-extension directory, and fixture workspace outside the repository. A separate test driver verifies that the subject extensions load from the installed VSIX files. The fixture server runs in the parent development Node process; the config fixture records `process.versions` from the actual extension host or language-server process loading it.

Reports in `out/vscode-tests` include the checkout SHA, VSIX SHA-256 checksums, requested and actual editor versions, host and config-process runtimes, per-check results, and known limitations. Failed runs also retain VS Code logs. Setup, host startup, and extension-test failures are distinguished. `--output-dir` changes the report location.

## Coverage and limits

Required language checks cover natural activation, IPC and stdio, local configuration/schema loading, completion, diagnostics, embedded TypeScript/Vue/Svelte/Astro GraphQL, schema watching, and restart with HTTP schema introspection. Execution checks cover natural activation, CodeLens, HTTP execution, local fragments, response rendering, and WebSocket subscription delivery. Syntax checks cover packaged grammar/configuration assets and GraphQL language registration; the existing syntax unit tests check tokenization.

PR CI builds VSIX files once, then tests those same bytes at the runtime extensions' minimum and current stable on Linux, macOS, and Windows. The syntax minimum runs on Linux; syntax stable runs on all three platforms. The release workflow tests its own VSIX files before attaching them to releases or publishing to either registry. Reports and failing release artifacts are retained for inspection.

Two limitations remain separate from the editor minimum:

- Closing the execution results panel does not cancel its subscription. The test records the observed result without treating this existing behavior as a host incompatibility.
- These are local extension-host tests. SSH, WSL, Dev Containers, and Codespaces require additional real remote-host validation; local hosts and standalone Node probes do not establish that coverage.

VS Code 1.63.0 and 1.67.0 could not start their CLI binaries on the development Mac, even before installing an extension. This is recorded as a host failure, not evidence that extension activation fails. No older extension release is recommended without testing its VSIX.

## Initial artifact evidence

The November 7, 2026 investigation used macOS arm64. The baseline source was `ad1da4cba69e072d49b0774d89456a5314c19c94`; the packaging correction source was `dcb653b7516dfe919639720ad235dd3d1b314815`. Baseline and corrected language packages contain the same runtime dependency graph. The correction adds the compiler's missing `out/astro.wasm` file.

| Artifact        | Source               | SHA-256                                                            |
| --------------- | -------------------- | ------------------------------------------------------------------ |
| Language 1.0.1  | Baseline             | `e46fee25ee60ae16452a17d4cbebbb69f1a0f76236145ed2cc6418e43191a2c4` |
| Execution 1.0.1 | Baseline             | `2c912c04ec4cb5d153164eae05d743af3acc15350653cc221bee0d7bf7f3218c` |
| Syntax 1.3.13   | Baseline             | `06a6954184cc644f37a54b25f2345d2253b2872ac7d55df1f5e89a68c59a081c` |
| Language 1.0.1  | Packaging correction | `9a1ba443872bdbb51c824f828880ff4cb5e33d23f029a0356601cfee1a2b785a` |

| Editor                          | Actual Node | Language, IPC and stdio                          | Execution                       |
| ------------------------------- | ----------- | ------------------------------------------------ | ------------------------------- |
| 1.63.0                          | Unavailable | Host failed before tests                         | Host failed before tests        |
| 1.67.0                          | Unavailable | Host failed before tests                         | Host failed before tests        |
| 1.100.3                         | 20.19.0     | Corrected artifact passed all checks             | Baseline passed required checks |
| 1.101.0                         | 22.15.1     | Baseline failed Astro completion                 | Baseline passed required checks |
| 1.103.2                         | 22.17.0     | Baseline failed Astro completion                 | Not exercised                   |
| 1.104.0                         | 22.18.0     | Baseline failed Astro; corrected artifact passed | Not exercised                   |
| 1.145.2 (stable during testing) | 24.22.1     | Baseline failed Astro; corrected artifact passed | Baseline passed required checks |

The successful packaged language checks on Node 20.19 justify using the same 1.100.3 floor as execution instead of the issue's conservative 1.104.0 candidate. Upstream package engine declarations alone did not predict the behavior of the bundled artifacts. CI reports record the final metadata and explicit bundling target changes as well as the artifacts that will be released.
