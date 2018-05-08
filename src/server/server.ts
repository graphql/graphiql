import { startServer } from "graphql-language-service-server";
import "babel-polyfill";

(async () => {
  try {
    await startServer({ method: "node" });
  } catch (err) {
    console.error(err);
  }
})();
