import type { GraphiQLProps } from "graphiql";

export function createFetcher(apiUrl: string): GraphiQLProps["fetcher"] {
  return async function (graphQLParams, opts) {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        ...opts?.headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(graphQLParams),
    });

    return response.json();
  };
}
