import { ConnectorConfig, DataConnect, OperationOptions, ExecuteOperationResponse } from 'firebase-admin/data-connect';

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

/** Generated Node Admin SDK operation action function for the 'CreateNewProject' Mutation. Allow users to execute without passing in DataConnect. */
export function createNewProject(dc: DataConnect, vars: CreateNewProjectVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateNewProjectData>>;
/** Generated Node Admin SDK operation action function for the 'CreateNewProject' Mutation. Allow users to pass in custom DataConnect instances. */
export function createNewProject(vars: CreateNewProjectVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateNewProjectData>>;

/** Generated Node Admin SDK operation action function for the 'GetMyProjects' Query. Allow users to execute without passing in DataConnect. */
export function getMyProjects(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<GetMyProjectsData>>;
/** Generated Node Admin SDK operation action function for the 'GetMyProjects' Query. Allow users to pass in custom DataConnect instances. */
export function getMyProjects(options?: OperationOptions): Promise<ExecuteOperationResponse<GetMyProjectsData>>;

/** Generated Node Admin SDK operation action function for the 'GetPublicClients' Query. Allow users to execute without passing in DataConnect. */
export function getPublicClients(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<GetPublicClientsData>>;
/** Generated Node Admin SDK operation action function for the 'GetPublicClients' Query. Allow users to pass in custom DataConnect instances. */
export function getPublicClients(options?: OperationOptions): Promise<ExecuteOperationResponse<GetPublicClientsData>>;

/** Generated Node Admin SDK operation action function for the 'UpdateProjectStatus' Mutation. Allow users to execute without passing in DataConnect. */
export function updateProjectStatus(dc: DataConnect, vars: UpdateProjectStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateProjectStatusData>>;
/** Generated Node Admin SDK operation action function for the 'UpdateProjectStatus' Mutation. Allow users to pass in custom DataConnect instances. */
export function updateProjectStatus(vars: UpdateProjectStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateProjectStatusData>>;

