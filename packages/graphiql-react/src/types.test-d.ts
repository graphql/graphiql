import type {
  EditorSlice,
  ExecutionSlice,
  PluginSlice,
  SchemaSlice,
  ThemeSlice,
  //
  EditorActions,
  ExecutionActions,
  PluginActions,
  SchemaActions,
  ThemeActions,
} from './stores';
import type { AllSlices, AllActions } from './types';

describe('Should not have conflicting types', () => {
  interface OverlapError<K extends PropertyKey> {
    ERROR: 'Conflicting keys found';
    CONFLICT_KEYS: K;
  }

  type MergeWithoutOverlap<A, B> = keyof A & keyof B extends never
    ? A & B
    : OverlapError<keyof A & keyof B>;

  type MergeMany<T extends any[], Acc = unknown> = T extends [
    infer Head,
    ...infer Tail,
  ]
    ? MergeWithoutOverlap<Acc, Head> extends infer Merged
      ? Merged extends OverlapError<any>
        ? Merged
        : MergeMany<Tail, Merged>
      : never
    : Acc;

  it('AllSlices', () => {
    type Actual = MergeMany<
      [EditorSlice, ExecutionSlice, PluginSlice, SchemaSlice, ThemeSlice]
    >;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    expectTypeOf<Actual>().toEqualTypeOf<AllSlices>;
  });

  it('AllActions', () => {
    type Actual = MergeMany<
      [
        EditorActions,
        ExecutionActions,
        PluginActions,
        SchemaActions,
        ThemeActions,
      ]
    >;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    expectTypeOf<Actual>().toEqualTypeOf<AllActions>;
  });
});
