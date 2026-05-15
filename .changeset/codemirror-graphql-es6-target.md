---
'codemirror-graphql': patch
---

Bump TypeScript emit target from `es5` to `es6`.

The published JavaScript now uses ES6 syntax (`const`, arrow functions, native destructuring) instead of down-leveled ES5. In practice this is consumed via a bundler in every real-world setup (and paired with CodeMirror 5, which already requires an ES6 runtime), so this changes the intermediate emit but not what consumers end up shipping. Code that loads the published `.js` directly in a strictly ES5-only environment (e.g. IE11 without transpilation) is no longer supported. CodeMirror 5 itself does not support that configuration.
