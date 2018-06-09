import { startServer } from "@divyenduz/graphql-language-service-server";
import "babel-polyfill";
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
