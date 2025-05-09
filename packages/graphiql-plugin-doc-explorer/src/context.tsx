import type {
  GraphQLArgument,
  GraphQLField,
  GraphQLInputField,
  GraphQLNamedType,
  GraphQLSchema,
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
import {
  createContext,
  FC,
  ReactNode,
  RefObject,
  useContext,
  useEffect,
  useRef,
} from 'react';
import { SchemaContextType, useSchemaContext } from '@graphiql/react';
import { createStore, StoreApi, useStore } from 'zustand';

export type DocExplorerFieldDef =
  | GraphQLField<unknown, unknown>
  | GraphQLInputField
  | GraphQLArgument;

export type DocExplorerNavStackItem = {
  /**
   * The name of the item.
   */
  name: string;
  /**
   * The definition object of the item, this can be a named type, a field, an
   * input field or an argument.
   */
  def?: GraphQLNamedType | DocExplorerFieldDef;
};

// There's always at least one item in the nav stack
export type DocExplorerNavStack = [
  DocExplorerNavStackItem,
  ...DocExplorerNavStackItem[],
];

export type DocExplorerContextType = {
  /**
   * A stack of navigation items. The last item in the list is the current one.
   * This list always contains at least one item.
   */
  explorerNavStack: DocExplorerNavStack;
  actions: {
    /**
     * Push an item to the navigation stack.
     * @param item The item that should be pushed to the stack.
     */
    push(item: DocExplorerNavStackItem): void;
    /**
     * Pop the last item from the navigation stack.
     */
    pop(): void;
    /**
     * Reset the navigation stack to its initial state, this will remove all but
     * the initial stack item.
     */
    reset(): void;
    resolveSchemaReferenceToNavItem(
      schemaReference: SchemaContextType['schemaReference'],
    ): void;
    /**
     * Replace the nav stack with an updated version using the new schema.
     */
    rebuildNavStackWithSchema(schema: GraphQLSchema): void;
  };
};

function createDocExplorerStore() {
  const initialNavStackItem: DocExplorerNavStackItem = { name: 'Docs' };

  return createStore<DocExplorerContextType>((set, get) => ({
    explorerNavStack: [initialNavStackItem],
    actions: {
      push(item) {
        set(state => {
          const curr = state.explorerNavStack;
          const lastItem = curr.at(-1)!;
          const explorerNavStack: DocExplorerNavStack =
            // Avoid pushing duplicate items
            lastItem.def === item.def ? curr : [...curr, item];

          return { explorerNavStack };
        });
      },
      pop() {
        set(state => {
          const curr = state.explorerNavStack;

          const explorerNavStack =
            curr.length > 1 ? (curr.slice(0, -1) as DocExplorerNavStack) : curr;

          return { explorerNavStack };
        });
      },
      reset() {
        set(state => {
          const curr = state.explorerNavStack;
          const explorerNavStack: DocExplorerNavStack =
            curr.length === 1 ? curr : [initialNavStackItem];
          return { explorerNavStack };
        });
      },
      resolveSchemaReferenceToNavItem(schemaReference) {
        if (!schemaReference) {
          return;
        }
        const { push } = get().actions;
        switch (schemaReference.kind) {
          case 'Type': {
            push({
              name: schemaReference.type.name,
              def: schemaReference.type,
            });
            break;
          }
          case 'Field': {
            push({
              name: schemaReference.field.name,
              def: schemaReference.field,
            });
            break;
          }
          case 'Argument': {
            if (schemaReference.field) {
              push({
                name: schemaReference.field.name,
                def: schemaReference.field,
              });
            }
            break;
          }
          case 'EnumValue': {
            if (schemaReference.type) {
              push({
                name: schemaReference.type.name,
                def: schemaReference.type,
              });
            }
            break;
          }
        }
      },
      rebuildNavStackWithSchema(schema: GraphQLSchema) {
        set(state => {
          const oldNavStack = state.explorerNavStack;
          if (oldNavStack.length === 1) {
            return oldNavStack;
          }
          const newNavStack: DocExplorerNavStack = [initialNavStackItem];
          let lastEntity:
            | GraphQLNamedType
            | GraphQLField<unknown, unknown>
            | null = null;
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
                const field: GraphQLField<unknown, unknown> = lastEntity;
                // Thus item.def must be an argument, so find the same named argument in the new schema
                if (field.args.some(a => a.name === item.name)) {
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
          return { explorerNavStack: newNavStack };
        });
      },
    },
  }));
}

export const DocExplorerContext = createContext<RefObject<
  StoreApi<DocExplorerContextType>
> | null>(null);

export const DocExplorerContextProvider: FC<{
  children: ReactNode;
}> = props => {
  const { schema, validationErrors, schemaReference } = useSchemaContext({
    nonNull: true,
    caller: DocExplorerContextProvider,
  });

  const storeRef = useRef<StoreApi<DocExplorerContextType>>(null!);

  if (storeRef.current === null) {
    storeRef.current = createDocExplorerStore();
  }

  useEffect(() => {
    const { resolveSchemaReferenceToNavItem } =
      storeRef.current.getState().actions;
    resolveSchemaReferenceToNavItem(schemaReference);
  }, [schemaReference]);

  useEffect(() => {
    const { reset, rebuildNavStackWithSchema } =
      storeRef.current.getState().actions;

    // Whenever the schema changes, we must revalidate/replace the nav stack.
    if (schema == null || validationErrors.length > 0) {
      reset();
    } else {
      rebuildNavStackWithSchema(schema);
    }
  }, [schema, validationErrors]);

  return (
    <DocExplorerContext.Provider value={storeRef}>
      {props.children}
    </DocExplorerContext.Provider>
  );
};

function useDocExplorerStore<T>(
  selector: (state: DocExplorerContextType) => T,
): T {
  const store = useContext(DocExplorerContext);
  if (!store) {
    throw new Error('Missing `DocExplorerContextProvider` in the tree');
  }
  return useStore(store.current, selector);
}

export const useDocExplorer = () =>
  useDocExplorerStore(state => state.explorerNavStack);
export const useDocExplorerActions = () =>
  useDocExplorerStore(state => state.actions);
