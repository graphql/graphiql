import { contextBridge, ipcRenderer } from 'electron';
import type { GraphQLRequestPayload } from '../main/execute-graphql-request';

contextBridge.exposeInMainWorld('graphiqlDesktop', {
  fetchGraphQL: (payload: GraphQLRequestPayload) =>
    ipcRenderer.invoke('graphiql:fetch', payload),
});
