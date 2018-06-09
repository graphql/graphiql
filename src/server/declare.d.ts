declare module "@divyenduz/graphql-language-service-server" {
  interface Options {
    method?: "socket" | "stream" | "node";
    extensions?: Array<any>;
  }

  function startServer(options: Options): Promise<void>;
}
