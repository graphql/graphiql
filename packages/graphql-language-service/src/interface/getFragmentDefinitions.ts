import { FragmentDefinitionNode, Kind, VariableDefinitionNode } from 'graphql';
import {
  getDefinitionState,
  parseDocument,
  RuleKind,
  RuleKinds,
  runOnlineParser,
  State,
} from '../parser';
import type { GraphQLLanguageServiceOptions } from '../types';

type FragmentDefinitionWithVariables = FragmentDefinitionNode & {
  readonly variableDefinitions?: ReadonlyArray<VariableDefinitionNode>;
};

function findState(state: State, kind: RuleKind): State | undefined {
  let current: State | null | undefined = state;
  while (current?.kind) {
    if (current.kind === kind) {
      return current;
    }
    current = current.prevState;
  }
}

/** Collect fragment definitions from complete or partially typed documents. */
export function getFragmentDefinitions(
  queryText: string,
  options?: GraphQLLanguageServiceOptions,
): Array<FragmentDefinitionNode> {
  try {
    return parseDocument(queryText, options).definitions.filter(
      definition => definition.kind === Kind.FRAGMENT_DEFINITION,
    );
  } catch {
    // The document is commonly incomplete during completion. Fall back to the
    // error-tolerant online parser below.
  }

  const fragments = new Map<string, FragmentDefinitionWithVariables>();
  const variables = new Map<string, ReadonlyArray<VariableDefinitionNode>>();
  let activeVariables:
    | { fragmentName: string; source: string; line: number }
    | undefined;
  let previousPosition = '';

  runOnlineParser(
    queryText,
    (stream, state: State, _style, line) => {
      const position = `${line}:${stream.getCurrentPosition()}`;
      if (position === previousPosition) {
        return;
      }
      previousPosition = position;

      const token = stream.current();
      const definitionState = getDefinitionState(state);
      const fragmentState =
        definitionState?.kind === RuleKinds.FRAGMENT_DEFINITION
          ? definitionState
          : undefined;
      const variableDefinitionsState = findState(
        state,
        RuleKinds.VARIABLE_DEFINITIONS,
      );

      if (
        !activeVariables &&
        fragmentState?.name &&
        variableDefinitionsState &&
        token.trim() === '('
      ) {
        activeVariables = {
          fragmentName: fragmentState.name,
          source: token,
          line,
        };
      } else if (activeVariables) {
        if (line !== activeVariables.line) {
          activeVariables.source += '\n';
          activeVariables.line = line;
        }
        if (
          variableDefinitionsState ||
          (fragmentState?.name === activeVariables.fragmentName &&
            token.trim() === ')')
        ) {
          activeVariables.source += token;
        }
        if (!variableDefinitionsState && token.trim() === ')') {
          try {
            const operation = parseDocument(
              `query${activeVariables.source} { __typename }`,
            ).definitions[0];
            if (operation.kind === Kind.OPERATION_DEFINITION) {
              variables.set(
                activeVariables.fragmentName,
                operation.variableDefinitions ?? [],
              );
            }
          } catch {
            // Keep the fragment usable for name completion even when its
            // variable definitions are incomplete.
          }
          activeVariables = undefined;
        }
      }

      if (fragmentState?.name && fragmentState.type) {
        fragments.set(fragmentState.name, {
          kind: RuleKinds.FRAGMENT_DEFINITION,
          name: {
            kind: Kind.NAME,
            value: fragmentState.name,
          },
          variableDefinitions: variables.get(fragmentState.name),
          selectionSet: {
            kind: RuleKinds.SELECTION_SET,
            selections: [],
          },
          typeCondition: {
            kind: RuleKinds.NAMED_TYPE,
            name: {
              kind: Kind.NAME,
              value: fragmentState.type,
            },
          },
        });
      }
    },
    options,
  );

  return [...fragments.values()];
}
