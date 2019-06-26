import "babel-polyfill";
import { startServer } from "graphql-language-service-server";
import { patchConfig } from "graphql-config-extension-prisma";

(async () => {
  try {
    await startServer({
      method: "node",
      extensions: [patchConfig]
    });
  } catch (err) {
    console.error(err);
  }
})();
