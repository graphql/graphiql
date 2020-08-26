import "babel-polyfill"
import { startServer } from "graphql-language-service-server"
// import { patchConfig } from "graphql-config-extension-prisma"

const start = () => {
  startServer({
    method: "node",
  })
    .then(() => {})
    .catch(err => {
      console.error(err)
    })
}

start()
