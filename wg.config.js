// @ts-check

/** @type {import('wgutils').Config} */
const config = {
  name: 'GraphiQL WG',
  repoUrl: 'https://github.com/graphql/graphiql',
  repoSubpath: 'working-group',
  videoConferenceDetails: `https://zoom.us/j/760146252
  - _Password:_ graphiql`,
  liveNotesUrl:
    'https://docs.google.com/document/d/1AjbUDhfQV2TXn13RZqrmL7PfETTslzkbVZGtNl_SLcU/edit?usp=sharing',
  timezone: 'UTC',
  frequency: 'monthly',
  nth: 2,
  weekday: 'Tu', // M, Tu, W, Th, F, Sa, Su
  time: '16:00-17:00', // 24-hour clock, range
  attendeesTemplate: `\
| Name                       | GitHub               | Organization       | Location                 |
| :------------------------- | :------------------- | :----------------- | :----------------------- |
`,
  agendasFolder: 'agendas',
  dateAndTimeLocations: 'p1=224&p2=24&p3=179&p4=136&p5=37&p6=239&p7=101&p8=152',
  description: `\
To read about the purpose of this subcommittee, please see [the README](../../README.md).
`,
};

module.exports = config;
