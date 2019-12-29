import { RenderGraphiQLOptions } from '@graphql/render-graphiql';
import { renderGraphiQLToSTring } from '@graphql/render-graphiql/server';

export const graphiQLExpress = (opts: RenderGraphiQLOptions) => (
  req,
  res,
  next,
) => {
  if (req.method === 'GET') {
    res.set('Content-Type', 'text/html');
    res.send(Buffer.from(renderGraphiQLToSTring(opts)));
    next();
  }
};
