import { Completion, CompletionContext } from '@codemirror/autocomplete';
import { EditorView } from '@codemirror/view';
import { GraphQLSchema } from 'graphql';
import { ContextToken } from 'graphql-language-service-parser';
import { CompletionItem } from 'graphql-language-service-types';
import { Position } from './helpers';
export interface GqlExtensionsOptions {
  onShowInDocs?: (field?: string, type?: string, parentType?: string) => void;
  onFillAllFields?: (
    view: EditorView,
    schema: GraphQLSchema,
    query: string,
    cursor: Position,
    token: ContextToken,
  ) => void;
  onCompletionInfoRender?: (
    gqlCompletionItem: CompletionItem,
    ctx: CompletionContext,
    item: Completion,
  ) => Node | Promise<Node | null> | null;
}
