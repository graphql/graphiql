module VideoGames = [%graphql
  {|
  query VideoGames {
    videoGames {
      id
      title
      developer
      completed
    }
  }
|}
];

module VideoGamesQuery = ReasonApollo.CreateQuery(VideoGames);
