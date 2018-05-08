declare module "graphql-language-service-server" {
 interface Options {
  method?: "socket" | "stream" | "node";
 }

 function startServer(options: Options): Promise<void>;
}
