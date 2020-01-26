<!-- @format -->

# GraphQL IDE Monorepo

> **Looking for the [GraphiQL Docs?](packages/graphiql/README.md)**: This is the root of the monorepo! The full GraphiQL docs are located at [`packages/graphiql`](packages/graphiql)

[![Build Status](https://travis-ci.org/graphql/graphiql.svg?branch=master)](https://travis-ci.org/graphql/graphiql)
[![Discord](https://img.shields.io/discord/586999333447270440.svg)](https://discord.gg/RfY2dvr)
[![Code Coverage](https://img.shields.io/codecov/c/github/graphql/graphiql)](https://codecov.io/gh/graphql/graphiql)
![GitHub top language](https://img.shields.io/github/languages/top/graphql/graphiql)
![GitHub language count](https://img.shields.io/github/languages/count/graphql/graphiql)
[![Snyk Vulnerabilities for GitHub Repo](https://img.shields.io/snyk/vulnerabilities/github/graphql/graphiql)](https://snyk.io/test/github/graphql/graphiql)
![LGTM Grade](https://img.shields.io/lgtm/grade/javascript/github/graphql/graphiql)
![LGTM Alerts](https://img.shields.io/lgtm/alerts/github/graphql/graphiql)

## Overview

GraphiQL is the reference implementation of this monorepo, GraphQL IDE, an official project under the GraphQL Foundation. The code uses the permissive MIT license.

Whether you want a simple GraphiQL IDE instance for your server, or a more advanced web or desktop GraphQL IDE experience for your framework or plugin, or you want to build an IDE extension or plugin, you've come to the right place!

The purpose of this monorepo is to give the GraphQL Community:

- a solid, to-specification official language service (see: [API Docs](https://graphiql-test.netlify.com/lsp))
- a comprehensive LSP server and CLI service for use with IDEs
- a codemirror mode
- a monaco mode (in the works)
- an example of how to use this ecosystem with GraphiQL.
- examples of how to implement or extend GraphiQL.

## [GraphiQL](packages/graphiql#readme)

<!-- prettier-ignore -->
> [![NPM](https://img.shields.io/npm/v/graphiql.svg)](https://npmjs.com/graphiql)
> ![jsDelivr hits (npm)](https://img.shields.io/jsdelivr/npm/hm/graphiql)
> ![npm downloads](https://img.shields.io/npm/dm/graphiql?label=npm%20downloads)
> ![Snyk Vulnerabilities for npm package](https://img.shields.io/snyk/vulnerabilities/npm/graphiql)
> ![npm bundle size (version)](https://img.shields.io/bundlephobia/min/graphiql/latest)
> ![npm bundle size (version)](https://img.shields.io/bundlephobia/minzip/graphiql/latest)

![https://raw.githubusercontent.com/graphql/graphiql/master/packages/graphiql/resources/graphiql.jpg](https://raw.githubusercontent.com/graphql/graphiql/master/packages/graphiql/resources/graphiql.jpg)

_/ˈɡrafək(ə)l/_ A graphical interactive in-browser GraphQL IDE. [Try the live demo](http://graphql.org/swapi-graphql). We also have [a demo using our latest netlify build](http://graphiql-test.netlify.com) for the master branch.

The GraphiQL IDE, implemented in React, currently using [GraphQL mode for CodeMirror](packages/codemirror-graphql#readme) & [GraphQL Language Service](packages/graphql-language-service#readme).

**Learn more about [GraphiQL in packagages/graphiql/README.md](packages/graphiql#readme)**

### How To Setup/Implement GraphiQL

[![Edit graphiql-example](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/graphiql-example-nhzvc)

(This example shows that GraphiQL works with `create-react-app` without requiring additional configuration)

**The full [GraphiQL Readme](packages/graphiql#readme) explains** some of the ways to implement GraphiQL, and we also have the [examples](examples) directory as well!

## [CodeMirror GraphQL](packages/codemirror-graphql#readme)

[![NPM](https://img.shields.io/npm/v/codemirror-graphql.svg)](https://npmjs.com/codemirror-graphql)
![jsDelivr hits (npm)](https://img.shields.io/jsdelivr/npm/hm/graphiql)
![npm downloads](https://img.shields.io/npm/dm/codemirror-graphql?label=npm%20downloads)
![Snyk Vulnerabilities for npm package](https://img.shields.io/snyk/vulnerabilities/npm/codemirror-graphql)

![https://raw.githubusercontent.com/graphql/graphiql/master/packages/codemirror-graphql/resources/example.gifg](https://raw.githubusercontent.com/graphql/graphiql/master/packages/codemirror-graphql/resources/example.gif)

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

## Development

To get setup for local development of this monorepo, refer to [DEVELOPMENT.md](./DEVELOPMENT.md)

## Contributing

This is an open source project, and we welcome contributions. Please see
[CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute.

## Initiatives

Lots of activity lately! These things are in progress currently:

- making web and IDE services 100% [LSP](https://langserver.org) specification complete
- a monaco editor mode
- extensions and themes to make GraphiQL a multipurpose tool for building GraphQL IDEs

### Fielding Proposals!

The door is open for proposals for the new GraphiQL Plugin API, and other ideas on how to make the rest of the IDE ecosystem more performant, scaleable, interoperable and extensible.
Feel free to open a PR to create a document in the `/proposals/` directory.
Eventually we hope to move these to a repo that serves this purpose.

## Community

- **Discord** [![Discord](https://img.shields.io/discord/586999333447270440.svg)](https://discord.gg/RfY2dvr) - Most discussion outside of github happens on our [Discord Server](https://discord.gg/eNuu9Cb)
- **Twitter** - [@GraphiQL](https://twitter.com/@GraphiQL) and [#GraphiQL](https://twitter.com/hashtag/GraphiQL)
- **GitHub** - Create feature requests, discussions issues and bugs above
