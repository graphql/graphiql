require('dotenv').config();
const queries = require('./src/utils/algolia');
const config = require('./config');
const plugins = [
  'gatsby-plugin-sitemap',
  'gatsby-plugin-sharp',
  {
    resolve: `gatsby-plugin-layout`,
    options: {
      component: require.resolve(`./src/templates/docs.js`),
    },
  },
  'gatsby-plugin-emotion',
  'gatsby-plugin-remove-trailing-slashes',
  'gatsby-plugin-react-helmet',
  {
    resolve: 'gatsby-source-filesystem',
    options: {
      name: 'docs',
      path: `${__dirname}/../docs/`,
    },
  },
  {
    resolve: 'gatsby-plugin-mdx',
    options: {
      gatsbyRemarkPlugins: [
        {
          resolve: 'gatsby-remark-images',
          options: {
            maxWidth: 1035,
            sizeByPixelDensity: true,
          },
        },
        {
          resolve: 'gatsby-remark-copy-linked-files',
        },
        {
          resolve: 'gatsby-remark-embed-markdown',
          options: {
            // Example code links are relative to this dir.
            // eg examples/path/to/file.js
            directory: `${__dirname}/../`,
          },
        },
        {
          resolve: `gatsby-remark-embed-snippet`,
          options: {
            directory: `${__dirname}/../examples/`,
          },
        },
        {
          resolve: `gatsby-remark-vscode`,
          // All options are optional. Defaults shown here.
          options: {
            colorTheme: {
              defaultTheme: 'Solarized Light', // Required
              prefersDarkTheme: 'Monokai Dimmed', // Optional: used with `prefers-color-scheme: dark`
              prefersLightTheme: 'Quiet Light', // Optional: used with `prefers-color-scheme: light`
            },
            logLevel: 'error', // Set to 'warn' to debug if something looks wrong
          },
        },
      ],
      extensions: ['.mdx', '.md'],
    },
  },
  {
    resolve: `gatsby-plugin-gtag`,
    options: {
      // your google analytics tracking id
      trackingId: config.gatsby.gaTrackingId,
      // Puts tracking script in the head instead of the body
      head: true,
      // enable ip anonymization
      anonymize: false,
    },
  },
];
// check and add algolia
if (
  config.header.search &&
  config.header.search.enabled &&
  config.header.search.algoliaAppId &&
  config.header.search.algoliaAdminKey
) {
  plugins.push({
    resolve: `gatsby-plugin-algolia`,
    options: {
      appId: config.header.search.algoliaAppId, // algolia application id
      apiKey: config.header.search.algoliaAdminKey, // algolia admin key to index
      queries,
      chunkSize: 10000, // default: 1000
    },
  });
}
// check and add pwa functionality
if (config.pwa && config.pwa.enabled && config.pwa.manifest) {
  plugins.push({
    resolve: `gatsby-plugin-manifest`,
    options: { ...config.pwa.manifest },
  });
  plugins.push({
    resolve: 'gatsby-plugin-offline',
    options: {
      appendScript: require.resolve(`./src/custom-sw-code.js`),
    },
  });
} else {
  plugins.push('gatsby-plugin-remove-serviceworker');
}
module.exports = {
  pathPrefix: config.gatsby.pathPrefix,
  siteMetadata: {
    title: config.siteMetadata.title,
    description: config.siteMetadata.description,
    docsLocation: config.siteMetadata.docsLocation,
    ogImage: config.siteMetadata.ogImage,
    favicon: config.siteMetadata.favicon,
    logo: {
      link: config.header.logoLink ? config.header.logoLink : '/',
      image: config.header.logo,
    }, // backwards compatible
    headerTitle: config.header.title,
    githubUrl: config.header.githubUrl,
    helpUrl: config.header.helpUrl,
    tweetText: config.header.tweetText,
    headerLinks: config.header.links,
    siteUrl: config.gatsby.siteUrl,
  },
  plugins,
};
