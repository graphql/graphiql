workbox.routing.registerRoute(
  new RegExp('https:.*min.(css|js)'),
  workbox.strategies.staleWhileRevalidate({
    cacheName: 'cdn-cache',
  }),
);
