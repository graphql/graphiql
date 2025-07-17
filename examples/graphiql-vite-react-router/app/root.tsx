import type { FC } from 'react';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';

const Root: FC = () => {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <noscript>You need to enable JavaScript to run this app.</noscript>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
};

export default Root;
