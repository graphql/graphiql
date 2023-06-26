export default {
   extensions: {
      endpoints: {
         default: { url: "https://graphiql-test.netlify.app/.netlify/functions/schema-demo" }
      },
   },
   schema: "src/schema/schema.graphql",
   documents: "src/queries/**/*.ts",
   // schema: "https://graphiql-test.netlify.app/.netlify/functions/schema-demo",
};
