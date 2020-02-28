// import * as React from 'react';
// import { GraphQLSchema } from 'graphql';
// import { generateActionTypeMap, useReducers, Reducer } from '../../../src/useReducers';
// import { defaultFetcher, defaultSchemaLoader } from './common';

// export const actionTypes = generateActionTypeMap([
//   'environment_changed',
//   'schema_requested',
//   'schema_succeeded',
//   'schema_errored',
//   'session_created',
//   'session_closed',
//   'session_changed', // AKA change tab
//   'sessions_cleared',
//   'operation_changed',
//   'variables_changed',
//   'operation_initialized',
//   'operation_succeeded',
//   'operation_errored',
//   'session_created',
// ]);

// type AT = keyof typeof actionTypes;

// const browserStorage = {
//   ...window.localStorage,
//   getItem: key => localStorage.getItem(key) && JSON.parse(localStorage.getItem(key)),
//   setItem: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
// };

// export type File = {
//   uri: string;
//   text?: string;
// };

// export type OperationParams = {
//   query: string;
//   variables: string;
//   operationName: string;
// };

// export interface SessionState {
//   sessionId: number;
//   operation: File;
//   variables: File;
//   results: File;
//   operationLoading: boolean;
//   operationErrors: string[] | null;
//   // diagnostics?: IMarkerData[];
//   currentTabs?: { [pane: string]: number }; // maybe this could live in another context for each "pane"? within session context
// }

// export type SchemaInfo = {
//   url: string;
//   uri?: string;
//   schema?: GraphQLSchema;
//   error?: any;
// };

// export type ProjectActions = {
//   type: AT;
//   error?: Error;
//   payload?: any;
// };

// export type Schemas = {
//   default: SchemaInfo;
//   [environmentKey: string]: SchemaInfo;
// };

// export type ProjectSessions = SessionState[];

// export type ProjectState = {
//   projectName: string;
//   currentSession: number;
//   currentTheme?: string;
//   currentEnvironment: string;
//   sessions: ProjectSessions;
//   currentSchema?: SchemaInfo;
//   schemaLoading: boolean;
//   schemaError: boolean;
//   schemas?: Schemas;
//   storage: typeof browserStorage;
// };

// export type ProjectHandlers = {
//   loadCurrentSchema: (state: ProjectState) => Promise<void>;
//   createNewSession: (state: ProjectState) => void;
//   loadSession: (sessionId: number) => void;
//   clearSessions: () => void;
//   // close a tab, etcs
//   clearSession: (sessionId: number) => void;
//   getSession: (sessionId: number) => SessionState;
//   setSession: (session: SessionState) => void;
//   fetcher: typeof defaultFetcher;
// };

// export const initialReducerState: ProjectState = {
//   projectName: 'graphiql',
//   sessions: [],
//   currentSession: 0,
//   currentEnvironment: 'default',
//   schemaLoading: false,
//   schemaError: false,
//   storage: browserStorage,
//   schemas: {
//     default: {
//       url: 'https://swapi-graphql.netlify.com/.netlify/functions/index',
//     },
//   },
// };

// export const initialState: ProjectState & ProjectHandlers = {
//   ...initialReducerState,
//   // schemaLoader: defaultSchemaLoader,
//   fetcher: defaultFetcher,
//   loadCurrentSchema: async () => null,
//   createNewSession: () => null,
//   loadSession: () => null,
//   getSession: () => null,
//   setSession: () => null,
//   clearSessions: () => null,
// };

// export const ProjectContext = React.createContext<ProjectState & ProjectHandlers>(initialState);

// export const useProjectContext = () => React.useContext(ProjectContext);

// type ProjectProviderProps = {
//   fetcher: typeof defaultFetcher;
//   schemaLoader: typeof defaultSchemaLoader;
//   storage: typeof browserStorage;
// };

// export type ProjectReducer<S = {}> = Reducer<S & ProjectState, AT>;

// export const schemaReducer: ProjectReducer = (
//   state: ProjectState,
//   { type: actionType, payload },
// ) => {
//   const { currentEnvironment: env } = state;
//   switch (actionType) {
//     case actionTypes.schema_requested: {
//       state.schemaLoading = true;
//       return state;
//     }
//     case actionTypes.schema_succeeded: {
//       state.schemaLoading = false;
//       state.schemaError = false;
//       state.schemas[env].schema = payload;
//       state.currentSchema = state.schemas[env];
//       return state;
//     }
//     case actionTypes.schema_errored: {
//       state.schemaLoading = false;
//       state.schemaError = true;
//       state.schemas[env].error = payload.toString();
//       return state;
//     }
//     case actionTypes.session_created: {
//       state.sessions[payload.sessionId] = payload;
//       state.currentSession = payload.sessionId;

//       return state;
//     }
//     case actionTypes.session_changed: {
//       state.currentSession = payload.sessionId;
//       const session = state.sessions[payload.sessionId];
//       state.sessions[state.currentSession] = { ...session, ...payload };
//       return state;
//     }
//     case actionTypes.session_closed: {
//       state.sessions.splice(payload.sessionId, 1);
//       state.currentSession = 0;
//       return state;
//     }
//     case actionTypes.sessions_cleared: {
//       state.sessions = [];
//       state.currentSession = 0;
//       return state;
//     }
//     default: {
//       return state;
//     }
//   }
// };

// let initialSchemaLoaded = false;
// let initialSessionLoaded = false;

// export function ProjectProvider<ProjectProviderProps>({
//   projectName = 'graphiql',
//   fetcher = defaultFetcher,
//   schemaLoader = defaultSchemaLoader,
//   storage = browserStorage,
//   ...props
// }) {
//   const getSession = (sessionId: number) => storage.getItem(`${projectName}:session:${sessionId}`);

//   const setSession = (session: SessionState) => {
//     storage.setItem(`${projectName}:session:${session.sessionId}`, session);
//     dispatch({ type: actionTypes.session_changed, payload: session });
//   };

//   const [state, dispatch] = useReducers<ProjectState, AT, ProjectActions>({
//     reducers: [schemaReducer],
//     init: () => {
//       return {
//         ...initialState,
//         projectName,
//         sessions: Array.from(Array(10), (x, i) => i).reduce((s, sessionId) => {
//           const session = storage.getItem(`${projectName}:session:${sessionId}`);
//           if (session) {
//             s[session.sessionId] = session;
//           }
//           return s;
//         }, []),
//       };
//     },
//   });

//   const loadCurrentSchema = async (state: ProjectState) => {
//     const { currentEnvironment, schemas } = state;
//     const schemaInfo = schemas[currentEnvironment] || schemas.default;
//     dispatch({ type: actionTypes.schema_requested });
//     try {
//       const schema = await schemaLoader(schemaInfo);
//       dispatch({ type: actionTypes.schema_succeeded, payload: schema });
//     } catch (error) {
//       dispatch({ type: actionTypes.schema_errored, payload: error });
//     }
//   };

//   const createNewSession = (state: ProjectState) => {
//     const newSessionId = state.sessions.length;
//     const newSession = {
//       sessionId: newSessionId,
//       operation: {
//         text: '{}',
//         uri: `graphql://${state.projectName}/operations/${newSessionId}.graphql`,
//       },
//       results: {
//         uri: `graphql://${state.projectName}/results/${newSessionId}.graphql`,
//       },
//       variables: {
//         uri: `graphql://${state.projectName}/variables/${newSessionId}.graphql`,
//       },
//       operationLoading: false,
//       operationErrors: null,
//     };

//     dispatch({ type: actionTypes.session_created, payload: newSession });
//     setSession(newSession);
//   };

//   const loadSession = (sessionId: number) => {
//     const session = state.sessions[sessionId] || getSession(sessionId);
//     if (!session || !session.operation) {
//       createNewSession(state);
//     }
//     if (session) {
//       dispatch({
//         type: actionTypes.session_changed,
//         payload: session,
//       });
//     }
//   };

//   const clearSession = (sessionId: number) => {
//     dispatch({ type: actionTypes.session_closed, payload: { sessionId } });
//   };

//   const clearSessions = () => {
//     window.localStorage.clear();
//     dispatch({
//       type: actionTypes.sessions_cleared,
//     });
//   };

//   const loadCurrentSession = (state: ProjectState) => {
//     loadSession(state.currentSession);
//   };

//   React.useEffect(() => {
//     if (!initialSchemaLoaded) {
//       (async () => await loadCurrentSchema(state))();
//       initialSchemaLoaded = true;
//     }
//     if (!initialSessionLoaded) {
//       loadCurrentSession(state);
//       initialSessionLoaded = true;
//     }
//   });

//   return (
//     <ProjectContext.Provider
//       value={{
//         ...state,
//         loadCurrentSchema,
//         createNewSession,
//         loadSession,
//         getSession,
//         clearSession,
//         clearSessions,
//         setSession,
//         fetcher,
//       }}
//     >
//       {props.children}
//     </ProjectContext.Provider>
//   );
// }
