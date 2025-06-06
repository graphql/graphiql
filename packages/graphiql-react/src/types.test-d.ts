import type {
  EditorSlice,
  ExecutionSlice,
  PluginSlice,
  SchemaSlice,
} from './stores';
import { AllSlices } from './types';

describe('Types', () => {
  it('should not have conflicting types', () => {
    type OverlapError<K extends PropertyKey> = {
      ERROR: 'Conflicting keys found';
      CONFLICT_KEYS: K;
    };

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

    type Actual = MergeMany<
      [EditorSlice, ExecutionSlice, PluginSlice, SchemaSlice]
    >;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    expectTypeOf<Actual>().toEqualTypeOf<AllSlices>;
  });
});
