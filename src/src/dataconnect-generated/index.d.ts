import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Asset_Key {
  id: UUIDString;
  __typename?: 'Asset_Key';
}

export interface Client_Key {
  id: UUIDString;
  __typename?: 'Client_Key';
}

export interface CreateNewProjectData {
  project_insert: Project_Key;
}

export interface CreateNewProjectVariables {
  title: string;
  description?: string | null;
  dueDate: DateString;
  startDate: DateString;
  status: string;
  clientId: UUIDString;
}

export interface GetMyProjectsData {
  projects: ({
    id: UUIDString;
    title: string;
    status: string;
    dueDate: DateString;
    client?: {
      name: string;
      company?: string | null;
    };
  } & Project_Key)[];
}

export interface GetPublicClientsData {
  clients: ({
    id: UUIDString;
    name: string;
    company?: string | null;
    email: string;
  } & Client_Key)[];
}

export interface Invoice_Key {
  id: UUIDString;
  __typename?: 'Invoice_Key';
}

export interface Project_Key {
  id: UUIDString;
  __typename?: 'Project_Key';
}

export interface UpdateProjectStatusData {
  project_update?: Project_Key | null;
}

export interface UpdateProjectStatusVariables {
  projectId: UUIDString;
  newStatus: string;
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateNewProjectRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateNewProjectVariables): MutationRef<CreateNewProjectData, CreateNewProjectVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateNewProjectVariables): MutationRef<CreateNewProjectData, CreateNewProjectVariables>;
  operationName: string;
}
export const createNewProjectRef: CreateNewProjectRef;

export function createNewProject(vars: CreateNewProjectVariables): MutationPromise<CreateNewProjectData, CreateNewProjectVariables>;
export function createNewProject(dc: DataConnect, vars: CreateNewProjectVariables): MutationPromise<CreateNewProjectData, CreateNewProjectVariables>;

interface GetMyProjectsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyProjectsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetMyProjectsData, undefined>;
  operationName: string;
}
export const getMyProjectsRef: GetMyProjectsRef;

export function getMyProjects(): QueryPromise<GetMyProjectsData, undefined>;
export function getMyProjects(dc: DataConnect): QueryPromise<GetMyProjectsData, undefined>;

interface GetPublicClientsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetPublicClientsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetPublicClientsData, undefined>;
  operationName: string;
}
export const getPublicClientsRef: GetPublicClientsRef;

export function getPublicClients(): QueryPromise<GetPublicClientsData, undefined>;
export function getPublicClients(dc: DataConnect): QueryPromise<GetPublicClientsData, undefined>;

interface UpdateProjectStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateProjectStatusVariables): MutationRef<UpdateProjectStatusData, UpdateProjectStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateProjectStatusVariables): MutationRef<UpdateProjectStatusData, UpdateProjectStatusVariables>;
  operationName: string;
}
export const updateProjectStatusRef: UpdateProjectStatusRef;

export function updateProjectStatus(vars: UpdateProjectStatusVariables): MutationPromise<UpdateProjectStatusData, UpdateProjectStatusVariables>;
export function updateProjectStatus(dc: DataConnect, vars: UpdateProjectStatusVariables): MutationPromise<UpdateProjectStatusData, UpdateProjectStatusVariables>;

