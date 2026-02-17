import { CreateNewProjectData, CreateNewProjectVariables, GetMyProjectsData, GetPublicClientsData, UpdateProjectStatusData, UpdateProjectStatusVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateNewProject(options?: useDataConnectMutationOptions<CreateNewProjectData, FirebaseError, CreateNewProjectVariables>): UseDataConnectMutationResult<CreateNewProjectData, CreateNewProjectVariables>;
export function useCreateNewProject(dc: DataConnect, options?: useDataConnectMutationOptions<CreateNewProjectData, FirebaseError, CreateNewProjectVariables>): UseDataConnectMutationResult<CreateNewProjectData, CreateNewProjectVariables>;

export function useGetMyProjects(options?: useDataConnectQueryOptions<GetMyProjectsData>): UseDataConnectQueryResult<GetMyProjectsData, undefined>;
export function useGetMyProjects(dc: DataConnect, options?: useDataConnectQueryOptions<GetMyProjectsData>): UseDataConnectQueryResult<GetMyProjectsData, undefined>;

export function useGetPublicClients(options?: useDataConnectQueryOptions<GetPublicClientsData>): UseDataConnectQueryResult<GetPublicClientsData, undefined>;
export function useGetPublicClients(dc: DataConnect, options?: useDataConnectQueryOptions<GetPublicClientsData>): UseDataConnectQueryResult<GetPublicClientsData, undefined>;

export function useUpdateProjectStatus(options?: useDataConnectMutationOptions<UpdateProjectStatusData, FirebaseError, UpdateProjectStatusVariables>): UseDataConnectMutationResult<UpdateProjectStatusData, UpdateProjectStatusVariables>;
export function useUpdateProjectStatus(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateProjectStatusData, FirebaseError, UpdateProjectStatusVariables>): UseDataConnectMutationResult<UpdateProjectStatusData, UpdateProjectStatusVariables>;
