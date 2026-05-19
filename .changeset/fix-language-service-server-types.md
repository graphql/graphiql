---
'graphql-language-service-server': patch
---

Point the package's `types` field at `dist/index.d.ts`, matching the CJS build output. The previous `typings: esm/index.d.ts` referenced the ESM build's output, which is emitted by a separate tsgo invocation that doesn't coordinate with the CJS project reference graph dependents rely on. `tsc` tolerated the misaligned path by falling back to `dist/index.d.ts` next to `main`; `tsgo` resolves project references more strictly and surfaced the misalignment as a "Could not find a declaration file" error during cold builds.
