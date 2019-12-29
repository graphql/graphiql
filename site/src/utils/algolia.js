const config = require('../../config.js');

const pageQuery = `{
  pages: allMdx {
    edges {
      node {
        objectID: id
        fields {
          slug
        }
        headings {
          value
        }
        frontmatter {
          title
          metaDescription 
        }
        excerpt(pruneLength: 50000)
      }
    }
  }
}`;

const flatten = arr =>
  arr.map(({ node: { frontmatter, fields, ...rest } }) => ({
    ...frontmatter,
    ...fields,
    ...rest,
  }));
const settings = { attributesToSnippet: [`excerpt:20`] };

const indexName = config.header.search ? config.header.search.indexName : '';

const queries = [
  {
    query: pageQuery,
    transformer: ({ data }) => flatten(data.pages.edges),
    indexName: `${indexName}`,
    settings,
  },
];

module.exports = queries;
