const config = {
  gatsby: {
    pathPrefix: '/docs',
    siteUrl: 'https://graphiql-test.netlify.com',
    gaTrackingId: null,
  },
  header: {
    logo:
      'https://raw.githubusercontent.com/graphql/graphiql/master/resources/graphiql-logo.png',
    logoLink: 'https://graphiql-test.netlify.com',
    title: 'GraphiQL / GraphQL IDE',
    githubUrl: 'https://github.com/graphql/graphiql',
    helpUrl: '',
    tweetText: '',
    links: [
      {
        text: 'graphql.org',
        link: 'https://graphql.org',
      },
    ],
    search: {
      enabled: false,
      indexName: '',
    },
  },
  sidebar: {
    forcedNavOrder: ['/graphiql', '/codemirror-graphql'],
    collapsedNav: ['/graphiql'],
    links: [
      {
        text: 'GraphQL LSP API Docs',
        link: 'https://graphiql-test.netlify.com/lsp',
      },
      {
        text: 'graphiql.min.js Demo',
        link: 'https://graphiql-test.netlify.com/cdn',
      },
      {
        text: 'graphiql.js Demo',
        link: 'https://graphiql-test.netlify.com/dev',
      },
      { text: 'Hasura', link: 'https://hasura.io' },
    ],
    frontline: false,
    ignoreIndex: true,
  },
  siteMetadata: {
    title: 'GraphiQL / GraphQL IDE',
    description: 'Documentation built with mdx. Powering learn.hasura.io ',
    ogImage: null,
    docsLocation: 'https://github.com/graphql/graphiql/tree/master/docs',
    favicon: 'https://graphql-engine-cdn.hasura.io/img/hasura_icon_black.svg',
  },
  pwa: {
    enabled: false, // disabling this will also remove the existing service worker.
    manifest: {
      name: 'Gatsby Gitbook Starter',
      short_name: 'GitbookStarter',
      start_url: '/',
      background_color: '#6b37bf',
      theme_color: '#6b37bf',
      display: 'standalone',
      crossOrigin: 'use-credentials',
      icons: [
        {
          src: 'src/pwa-512.png',
          sizes: `512x512`,
          type: `image/png`,
        },
      ],
    },
  },
};

module.exports = config;
