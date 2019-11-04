const fetch = require('node-fetch')
const { buildSchema } = require('graphql')
const createHttpHandler = require('aws-lambda-graphql/dist/createHttpHandler')

const SCHEMA_URL = 'https://raw.githubusercontent.com/graphql/swapi-graphql/master/schema.graphql'
const getSchema = async () => {
  const rawSchemaPayload = await fetch(SCHEMA_URL)
  const rawSchema = await rawSchemaPayload.text()
  return buildSchema(rawSchema);
}


const handler = async (event, context) => {
  const schema = await getSchema()
  const httpHandler = createHttpHandler({
    connectionManager: {},
    schema,
  });
  // event is http event from api gateway v1
  return httpHandler(event, context)
}

module.exports = { handler }
