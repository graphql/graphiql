<!-- @format -->
> # Black Lives Matter 🖤 Free Palestine 🇵🇸 Stand with Israel 🇮🇱

# GraphQL IDE Monorepo

> **Note:** The primary maintainer @acao is on hiatus until December 2020
> **Looking for the [GraphiQL Docs?](packages/graphiql/README.md)**: This is the root of the monorepo! The full GraphiQL docs are located at [`packages/graphiql`](packages/graphiql)

[![Build Status](https://github.com/graphql/graphiql/workflows/Node.JS%20CI/badge.svg)](https://github.com/graphql/graphiql/actions?query=workflow%3A%22Node.JS+CI%22)
[![Discord](https://img.shields.io/discord/586999333447270440.svg)](https://discord.gg/fHje6QG)
[![Code Coverage](https://img.shields.io/codecov/c/github/graphql/graphiql)](https://codecov.io/gh/graphql/graphiql)
![GitHub top language](https://img.shields.io/github/languages/top/graphql/graphiql)
![GitHub language count](https://img.shields.io/github/languages/count/graphql/graphiql)
[![Snyk Vulnerabilities for GitHub Repo](https://img.shields.io/snyk/vulnerabilities/github/graphql/graphiql)](https://snyk.io/test/github/graphql/graphiql)
![LGTM Grade](https://img.shields.io/lgtm/grade/javascript/github/graphql/graphiql)
![LGTM Alerts](https://img.shields.io/lgtm/alerts/github/graphql/graphiql)
[![CII Best Practices](https://bestpractices.coreinfrastructure.org/projects/3887/badge)](https://bestpractices.coreinfrastructure.org/projects/3887)

## Overview

GraphiQL is the reference implementation of this monorepo, GraphQL IDE, an official project under the GraphQL Foundation. The code uses the permissive MIT license.

Whether you want a simple GraphiQL IDE instance for your server, or a more advanced web or desktop GraphQL IDE experience for your framework or plugin, or you want to build an IDE extension or plugin, you've come to the right place!

The purpose of this monorepo is to give the GraphQL Community:

- a to-specification official language service (see: [API Docs](https://graphiql-test.netlify.app/typedoc))
- a comprehensive LSP server and CLI service for use with IDEs
- a codemirror mode
- a monaco mode (in the works)
- an example of how to use this ecosystem with GraphiQL.
- examples of how to implement or extend GraphiQL.

### Latest Stable Ecosystem

`graphiql@1.0.x` and ecosystem are organized as below. Any further changes to `graphiql@1.0.x` are made against `1.0.0` branch

![Diagram of the current Monorepo and third party ecosystem](https://raw.githubusercontent.com/graphql/graphiql/main/resources/images/current-ecosystem.jpg)

### Proposed Ecosystem

As we re-write for `graphiql@2.x` ecosystem, this monorepo will contain an sdk and plugins.

![Diagram of the proposed Monorepo and third party ecosystem](https://raw.githubusercontent.com/graphql/graphiql/main/resources/images/proposed-ecosystem.jpg)

## [GraphiQL](packages/graphiql#readme)

> **Breaking Changes & Improvements:** several interfaces are being dropped for new ones are arriving for GraphiQL 1.0.0! Read more in [this issue](https://github.com/graphql/graphiql/issues/1165)

<!-- prettier-ignore -->
> [![NPM](https://img.shields.io/npm/v/graphiql.svg)](https://npmjs.com/graphiql)
> ![jsDelivr hits (npm)](https://img.shields.io/jsdelivr/npm/hm/graphiql)
> ![npm downloads](https://img.shields.io/npm/dm/graphiql?label=npm%20downloads)
> ![Snyk Vulnerabilities for npm package](https://img.shields.io/snyk/vulnerabilities/npm/graphiql)
> ![npm bundle size (version)](https://img.shields.io/bundlephobia/min/graphiql/latest)
> ![npm bundle size (version)](https://img.shields.io/bundlephobia/minzip/graphiql/latest)

![Screenshot of GraphiQL with Doc Explorer Open](https://raw.githubusercontent.com/graphql/graphiql/main/packages/graphiql/resources/graphiql.jpg)

_/ˈɡrafək(ə)l/_ A graphical interactive in-browser GraphQL IDE. [Try the live demo](http://graphql.org/swapi-graphql). We also have [a demo using our latest netlify build](http://graphiql-test.netlify.com) for the `main` branch.

The GraphiQL IDE, implemented in React, currently using [GraphQL mode for CodeMirror](packages/codemirror-graphql#readme) & [GraphQL Language Service](packages/graphql-language-service#readme).

**Learn more about [GraphiQL in `packages/graphiql/README.md`](packages/graphiql#readme)**

### How To Setup/Implement GraphiQL

[![Edit graphiql-example](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/graphiql-js-next-example-qsh7h?file=/src/index.js)

**The [GraphiQL Readme](packages/graphiql#readme) explains** some of the ways to implement GraphiQL, and we also have the [examples](examples) directory as well!

## [Monaco GraphQL](packages/monaco-graphql#readme)

[![NPM](https://img.shields.io/npm/v/monaco-graphql.svg)](https://npmjs.com/monaco-graphql)
![jsDelivr hits (npm)](https://img.shields.io/jsdelivr/npm/hm/graphiql)
![npm downloads](https://img.shields.io/npm/dm/monaco-graphql?label=npm%20downloads)
![Snyk Vulnerabilities for npm package](https://img.shields.io/snyk/vulnerabilities/npm/monaco-graphql)

Provides monaco editor with a powerful, schema-driven graphql language mode.

See the [webpack example](examples/monaco-graphql-webpack#readme) for a plain javascript demo using github API

## [CodeMirror GraphQL](packages/codemirror-graphql#readme)

[![NPM](https://img.shields.io/npm/v/codemirror-graphql.svg)](https://npmjs.com/codemirror-graphql)
![jsDelivr hits (npm)](https://img.shields.io/jsdelivr/npm/hm/graphiql)
![npm downloads](https://img.shields.io/npm/dm/codemirror-graphql?label=npm%20downloads)
![Snyk Vulnerabilities for npm package](https://img.shields.io/snyk/vulnerabilities/npm/codemirror-graphql)

![Animated Codemirror GraphQL Completion Example](https://raw.githubusercontent.com/graphql/graphiql/main/packages/codemirror-graphql/resources/example.gif)

Provides CodeMirror with a parser mode for GraphQL along with a live linter and typeahead hinter powered by your GraphQL Schema

## [GraphQL Language Service](packages/graphql-language-service#readme)

[![NPM](https://img.shields.io/npm/v/graphql-language-service.svg)](https://npmjs.com/graphql-language-service)
![npm downloads](https://img.shields.io/npm/dm/graphql-language-service?label=npm%20downloads)
![Snyk Vulnerabilities for npm package](https://img.shields.io/snyk/vulnerabilities/npm/codemirror-graphql)

Provides a command-line interface for running [GraphQL Language Service Server](packages/graphql-language-service-server#readme) for various IDEs.

## [GraphQL Language Service Server](packages/graphql-language-service-server#readme)

[![NPM](https://img.shields.io/npm/v/graphql-language-service.svg)](https://npmjs.com/graphql-language-service)
![npm downloads](https://img.shields.io/npm/dm/graphql-language-service-server?label=npm%20downloads)
![Snyk Vulnerabilities for npm package](https://img.shields.io/snyk/vulnerabilities/npm/codemirror-graphql)

An almost fully LSP compliant server process backing the [GraphQL Language Service](packages/graphql-language-service#readme).

## [GraphQL Language Service Interface](packages/graphql-language-service-interface#readme)

[![NPM](https://img.shields.io/npm/v/graphql-language-service-interface.svg)](https://npmjs.com/graphql-language-service-interface)
![jsDelivr hits (npm)](https://img.shields.io/jsdelivr/npm/hm/graphql-language-service-interface)
![npm downloads](https://img.shields.io/npm/dm/graphql-language-service-interface?label=npm%20downloads)
![Snyk Vulnerabilities for npm package](https://img.shields.io/snyk/vulnerabilities/npm/codemirror-graphql)

Runtime agnostic Language Service used by [GraphQL mode for CodeMirror](packages/codemirror-graphql#readme) and [GraphQL Language Service Server](packages/graphql-language-service-server#readme)

## [GraphQL Language Service Parser](packages/graphql-language-service-parser#readme)

[![NPM](https://img.shields.io/npm/v/graphql-language-service-parser.svg)](https://npmjs.com/graphql-language-service-parser)
![npm downloads](https://img.shields.io/npm/dm/graphql-language-service-parser?label=npm%20downloads)
![Snyk Vulnerabilities for npm package](https://img.shields.io/snyk/vulnerabilities/npm/codemirror-graphql)

An online immutable parser for [GraphQL](http://graphql.org/), designed to be used as part of syntax-highlighting and code intelligence tools such as for the [GraphQL Language Service](packages/graphql-language-service#readme) and [codemirror-graphql](packages/codemirror-graphql#readme).

## [GraphQL Language Service Types](packages/graphql-language-service-types#readme)

[![NPM](https://img.shields.io/npm/v/graphql-language-service-types.svg)](https://npmjs.com/graphql-language-service-types)
![npm downloads](https://img.shields.io/npm/dm/graphql-language-service-types?label=npm%20downloads)

[Flow](https://flowtype.org/) and Typescript type definitions for the [GraphQL Language Service](packages/graphql-language-service#readme).

## [GraphQL Language Service Utilities](packages/graphql-language-service-utils#readme)

[![NPM](https://img.shields.io/npm/v/graphql-language-service-utils.svg)](https://npmjs.com/graphql-language-service-utils)
![npm downloads](https://img.shields.io/npm/dm/graphql-language-service-parser?label=npm%20downloads)
![Snyk Vulnerabilities for npm package](https://img.shields.io/snyk/vulnerabilities/npm/codemirror-graphql)

Utilities to support the [GraphQL Language Service](packages/graphql-language-service#readme).

## Browser & Runtime Support

Many of these packages need to work in multiple environments.

By default, all typescript packages target `es6`.

`graphql-language-service-server` and `graphql-language-service-cli` are made for the node runtime, so they target `es2017`

`codemirror-graphql` and the `graphiql` browser bundle use the [`.browserslistrc`](./.browserlistrc), which targets modern browsers to keep bundle size small and keep the language services performant where async/await is used, and especially to avoid the requirement of `rengenerator-runtime` or special babel configuration.

### [`.browserslistrc`](./.browserlistrc):

```
last 2 versions
Firefox ESR
not dead
not IE 11
not ios 10
maintained node versions
```

To be clear, we do _not_ support Internet Explorer or older versions of evergreen browsers.

## Development

To get setup for local development of this monorepo, refer to [DEVELOPMENT.md](./DEVELOPMENT.md)

# Contributing to this repo

This is an open source project, and we welcome contributions. Please see
[CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute.

This repository is managed by EasyCLA. Project participants must sign the free [GraphQL Specification Membership agreement](https://preview-spec-membership.graphql.org) before making a contribution. You only need to do this one time, and it can be signed by [individual contributors](http://individual-spec-membership.graphql.org/) or their [employers](http://corporate-spec-membership.graphql.org/).

To initiate the signature process please open a PR against this repo. The EasyCLA bot will block the merge if we still need a membership agreement from you.

Please note that EasyCLA is configured to accept commits from certain GitHub bots. These are approved on an exception basis once we are confident that any content they create is either generated by the bot itself or written by someone who has already signed the CLA (e.g., a project maintainer).

Please note that EasyCLA is configured to accept commits from certain GitHub bots. These are approved on an exception basis once we are confident that any content they create is either unlikely to consist of copyrightable content or else was written by someone who has already signed the CLA (e.g., a project maintainer). The bots that have currently been approved as exceptions are:

- github-actions (exclusively for the `changesets` Action)

You can find [detailed information here](https://github.com/graphql/graphql-wg/tree/main/membership). If you have issues, please email [operations@graphql.org](mailto:operations@graphql.org).

## Maintainers

Maintainers of this repository regulary review PRs and issues and help advance the GraphiQL roadmap

### Alumni

Originally this was three seperate repositories

- [@leebyron](https://github.com/leebyron) - original author of all libraries
- [@asiandrummer](https://github.com/asiandrummer) - original creator of GraphiQL
- [@wincent](https://github.com/wincent) - early co-author and maintainer
- [@lostplan](https://github.com/lostplan) - maintained the language service ecosystem until about 2017
- [@IvanGoncharov](https://github.com/ivangoncharov) -

### Active

- [@acao](https://github.com/acao)
- [@imolorhe](https://github.com/imolorhe)
- [@yoshiakis](https://github.com/yoshiakis)

### Fielding Proposals!

The door is open for proposals for the new GraphiQL Plugin API, and other ideas on how to make the rest of the IDE ecosystem more performant, scaleable, interoperable and extensible.
Feel free to open a PR to create a document in the `/proposals/` directory.
Eventually we hope to move these to a repo that serves this purpose.

## Community

- **Discord** [![Discord](https://img.shields.io/discord/586999333447270440.svg)](https://discord.gg/fHje6QG) - Most discussion outside of github happens on our [Discord Server](https://discord.gg/eNuu9Cb)
- **Twitter** - [@GraphiQL](https://twitter.com/@GraphiQL) and [#GraphiQL](https://twitter.com/hashtag/GraphiQL)
- **GitHub** - Create feature requests, discussions issues and bugs above
- **Working Group** - Yes, you're invited! Monthly planning/decision making meetings, and working sessions every two weeks on zoom! [Learn more.](working-group#readme)
