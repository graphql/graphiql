import type {
  GraphQLArgument,
  GraphQLField,
  GraphQLInputField,
  GraphQLNamedType,
} from 'graphql';
import {
  isEnumType,
  isInputObjectType,
  isInterfaceType,
  isNamedType,
  isObjectType,
  isScalarType,
  isUnionType,
} from 'graphql';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useSchemaContext } from '../schema';
import { createContextHook, createNullableContext } from '../utility/context';

export type ExplorerFieldDef =
  | GraphQLField<{}, {}, {}>
  | GraphQLInputField
  | GraphQLArgument;

export type ExplorerNavStackItem = {
  /**
   * The name of the item.
   */
  name: string;
  /**
   * The definition object of the item, this can be a named type, a field, an
   * input field or an argument.
   */
  def?: GraphQLNamedType | ExplorerFieldDef;
};

// There's always at least one item in the nav stack
export type ExplorerNavStack = [
  ExplorerNavStackItem,
  ...ExplorerNavStackItem[],
];

const initialNavStackItem: ExplorerNavStackItem = { name: 'Docs' };

export type ExplorerContextType = {
  /**
   * A stack of navigation items. The last item in the list is the current one.
   * This list always contains at least one item.
   */
  explorerNavStack: ExplorerNavStack;
  /**
   * Push an item to the navigation stack.
   * @param item The item that should be pushed to the stack.
   */
  push(item: ExplorerNavStackItem): void;
  /**
   * Pop the last item from the navigation stack.
   */
  pop(): void;
  /**
   * Reset the navigation stack to its initial state, this will remove all but
   * the initial stack item.
   */
  reset(): void;
};

export const ExplorerContext =
  createNullableContext<ExplorerContextType>('ExplorerContext');

export type ExplorerContextProviderProps = {
  children: ReactNode;
};

export function ExplorerContextProvider(props: ExplorerContextProviderProps) {
  const { schema, validationErrors } = useSchemaContext({
    nonNull: true,
    caller: ExplorerContextProvider,
  });

  const [navStack, setNavStack] = useState<ExplorerNavStack>([
    initialNavStackItem,
  ]);

  const push = useCallback((item: ExplorerNavStackItem) => {
    setNavStack(currentState => {
      const lastItem = currentState.at(-1)!;
      return lastItem.def === item.def
        ? // Avoid pushing duplicate items
          currentState
        : [...currentState, item];
    });
  }, []);

  const pop = useCallback(() => {
    setNavStack(currentState =>
      currentState.length > 1
        ? (currentState.slice(0, -1) as ExplorerNavStack)
        : currentState,
    );
  }, []);

  const reset = useCallback(() => {
    setNavStack(currentState =>
      currentState.length === 1 ? currentState : [initialNavStackItem],
    );
  }, []);

  useEffect(() => {
    // Whenever the schema changes, we must revalidate/replace the nav stack.
    if (schema == null || validationErrors.length > 0) {
      reset();
    } else {
      // Replace the nav stack with an updated version using the new schema
      setNavStack(oldNavStack => {
        if (oldNavStack.length === 1) {
          return oldNavStack;
        }
        const newNavStack: ExplorerNavStack = [initialNavStackItem];
        let lastEntity: GraphQLNamedType | GraphQLField<any, any, any> | null =
          null;
        for (const item of oldNavStack) {
          if (item === initialNavStackItem) {
            // No need to copy the initial item
            continue;
          }
          if (item.def) {
            // If item.def isn't a named type, it must be a field, inputField, or argument
            if (isNamedType(item.def)) {
              // The type needs to be replaced with the new schema type of the same name
              const newType = schema.getType(item.def.name);
              if (newType) {
                newNavStack.push({
                  name: item.name,
                  def: newType,
                });
                lastEntity = newType;
              } else {
                // This type no longer exists; the stack cannot be built beyond here
                break;
              }
            } else if (lastEntity === null) {
              // We can't have a sub-entity if we have no entity; stop rebuilding the nav stack
              break;
            } else if (
              isObjectType(lastEntity) ||
              isInputObjectType(lastEntity)
            ) {
              // item.def must be a Field / input field; replace with the new field of the same name
              const field = lastEntity.getFields()[item.name];
              if (field) {
                newNavStack.push({
                  name: item.name,
                  def: field,
                });
              } else {
                // This field no longer exists; the stack cannot be built beyond here
                break;
              }
            } else if (
              isScalarType(lastEntity) ||
              isEnumType(lastEntity) ||
              isInterfaceType(lastEntity) ||
              isUnionType(lastEntity)
            ) {
              // These don't (currently) have non-type sub-entries; something has gone wrong.
              // Handle gracefully by discontinuing rebuilding the stack.
              break;
            } else {
              // lastEntity must be a field (because it's not a named type)
              const field: GraphQLField<any, any, any> = lastEntity;
              // Thus item.def must be an argument, so find the same named argument in the new schema
              const arg = field.args.find(a => a.name === item.name);
              if (arg) {
                newNavStack.push({
                  name: item.name,
                  def: field,
                });
              } else {
                // This argument no longer exists; the stack cannot be built beyond here
                break;
              }
            }
          } else {
            lastEntity = null;
            newNavStack.push(item);
          }
        }
        return newNavStack;
      });
    }
  }, [reset, schema, validationErrors]);

  const value = useMemo<ExplorerContextType>(
    () => ({ explorerNavStack: navStack, push, pop, reset }),
    [navStack, push, pop, reset],
  );

  return (
    <ExplorerContext.Provider value={value}>
      {props.children}
    </ExplorerContext.Provider>
  );
}

export const useExplorerContext = createContextHook(ExplorerContext);
