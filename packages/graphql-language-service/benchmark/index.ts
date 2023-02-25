/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';
import Benchmark from 'benchmark';
import { parse } from 'graphql';
import { onlineParser, CharacterStream } from '../src';

interface IStats {
  mean: number;
  rme: number;
  variance: number;
}

const printResult = (stats: IStats, name: string, schema: string) => {
  console.log({
    name,
    mean: `${1 / stats.mean} ops / sec`,
    variance: stats.variance,
    rme: `${stats.rme}%`,
    lines: schema.split('\n').length,
  });

  console.log(`Completed test suite: ${name}`);
};

const runSplitTest = (name: string, schema: string) => {
  const stats: IStats[] = [];

  const suite = new Benchmark.Suite();
  const parser = onlineParser();
  let state: any = parser.startState();

  schema.split('\n').forEach((line, index) => {
    let prevState: any;
    let completeState: any;

    suite.add({
      maxTime: 0.1,
      onStart: () => {
        prevState = { ...state };
      },
      fn: () => {
        const stream = new CharacterStream(line);

        while (!stream.eol()) {
          parser.token(stream, state);
          if (state.kind === 'Invalid') {
            console.log(state.kind, line, index);
            throw new Error('Invalid');
          }
        }

        completeState = state;
        state = { ...prevState };
      },
      onError: console.log,
      onComplete: (e: any) => {
        state = completeState;
        stats.push(e.target.stats);
      },
    });
  });

  console.log(`Started test suite: ${name}`);

  suite.run();

  const results = stats.reduce(
    (result, stat) => {
      result.mean += stat.mean / stats.length;
      result.rme += stat.rme / stats.length;
      result.variance += stat.variance / stats.length;

      return result;
    },
    { mean: 0, variance: 0, rme: 0 },
  );

  printResult(results, name, schema);
};

const runWholeTest = (name: string, schema: string) => {
  const suite = new Benchmark.Suite('', {
    onComplete: (e: any) => printResult(e.target.stats, name, schema),
  });

  const parser = onlineParser();
  const state: any = parser.startState();

  suite.add(() => {
    const stream = new CharacterStream(schema);

    while (!stream.eol()) {
      parser.token(stream, state);
      if (state.kind === 'Invalid') {
        console.log(state.kind);
        throw new Error('Invalid');
      }
    }
  });

  console.log(`Started test suite: ${name}`);
  suite.run();
};

const runGraphqlParserTest = (name: string, schema: string) => {
  const suite = new Benchmark.Suite('', {
    onComplete: (e: any) => printResult(e.target.stats, name, schema),
  });

  suite.add({
    fn() {
      try {
        parse(schema);
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
  });

  console.log(`Started test suite: ${name}`);
  suite.run();
};

const kitchenSchema = fs.readFileSync(
  path.resolve(__dirname, './fixtures/kitchen-sink.graphql'),
  {
    encoding: 'utf8',
  },
);
const githubSchema = fs.readFileSync(
  path.resolve(__dirname, './fixtures/github.graphql'),
  {
    encoding: 'utf8',
  },
);

runWholeTest('kitchen-sink:whole', kitchenSchema);
runSplitTest('kitchen-sink:split', kitchenSchema);

runWholeTest('github:whole', githubSchema);

runGraphqlParserTest('kitchen-sink:graphql-js', kitchenSchema);
runGraphqlParserTest('github:graphql-js', githubSchema);
