# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetMyProjects*](#getmyprojects)
  - [*GetPublicClients*](#getpublicclients)
- [**Mutations**](#mutations)
  - [*CreateNewProject*](#createnewproject)
  - [*UpdateProjectStatus*](#updateprojectstatus)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetMyProjects
You can execute the `GetMyProjects` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getMyProjects(): QueryPromise<GetMyProjectsData, undefined>;

interface GetMyProjectsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyProjectsData, undefined>;
}
export const getMyProjectsRef: GetMyProjectsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getMyProjects(dc: DataConnect): QueryPromise<GetMyProjectsData, undefined>;

interface GetMyProjectsRef {
  ...
  (dc: DataConnect): QueryRef<GetMyProjectsData, undefined>;
}
export const getMyProjectsRef: GetMyProjectsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getMyProjectsRef:
```typescript
const name = getMyProjectsRef.operationName;
console.log(name);
```

### Variables
The `GetMyProjects` query has no variables.
### Return Type
Recall that executing the `GetMyProjects` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetMyProjectsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetMyProjects`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getMyProjects } from '@dataconnect/generated';


// Call the `getMyProjects()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getMyProjects();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getMyProjects(dataConnect);

console.log(data.projects);

// Or, you can use the `Promise` API.
getMyProjects().then((response) => {
  const data = response.data;
  console.log(data.projects);
});
```

### Using `GetMyProjects`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getMyProjectsRef } from '@dataconnect/generated';


// Call the `getMyProjectsRef()` function to get a reference to the query.
const ref = getMyProjectsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getMyProjectsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.projects);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.projects);
});
```

## GetPublicClients
You can execute the `GetPublicClients` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getPublicClients(): QueryPromise<GetPublicClientsData, undefined>;

interface GetPublicClientsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetPublicClientsData, undefined>;
}
export const getPublicClientsRef: GetPublicClientsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getPublicClients(dc: DataConnect): QueryPromise<GetPublicClientsData, undefined>;

interface GetPublicClientsRef {
  ...
  (dc: DataConnect): QueryRef<GetPublicClientsData, undefined>;
}
export const getPublicClientsRef: GetPublicClientsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getPublicClientsRef:
```typescript
const name = getPublicClientsRef.operationName;
console.log(name);
```

### Variables
The `GetPublicClients` query has no variables.
### Return Type
Recall that executing the `GetPublicClients` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetPublicClientsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetPublicClientsData {
  clients: ({
    id: UUIDString;
    name: string;
    company?: string | null;
    email: string;
  } & Client_Key)[];
}
```
### Using `GetPublicClients`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getPublicClients } from '@dataconnect/generated';


// Call the `getPublicClients()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getPublicClients();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getPublicClients(dataConnect);

console.log(data.clients);

// Or, you can use the `Promise` API.
getPublicClients().then((response) => {
  const data = response.data;
  console.log(data.clients);
});
```

### Using `GetPublicClients`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getPublicClientsRef } from '@dataconnect/generated';


// Call the `getPublicClientsRef()` function to get a reference to the query.
const ref = getPublicClientsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getPublicClientsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.clients);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.clients);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateNewProject
You can execute the `CreateNewProject` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createNewProject(vars: CreateNewProjectVariables): MutationPromise<CreateNewProjectData, CreateNewProjectVariables>;

interface CreateNewProjectRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateNewProjectVariables): MutationRef<CreateNewProjectData, CreateNewProjectVariables>;
}
export const createNewProjectRef: CreateNewProjectRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createNewProject(dc: DataConnect, vars: CreateNewProjectVariables): MutationPromise<CreateNewProjectData, CreateNewProjectVariables>;

interface CreateNewProjectRef {
  ...
  (dc: DataConnect, vars: CreateNewProjectVariables): MutationRef<CreateNewProjectData, CreateNewProjectVariables>;
}
export const createNewProjectRef: CreateNewProjectRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createNewProjectRef:
```typescript
const name = createNewProjectRef.operationName;
console.log(name);
```

### Variables
The `CreateNewProject` mutation requires an argument of type `CreateNewProjectVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateNewProjectVariables {
  title: string;
  description?: string | null;
  dueDate: DateString;
  startDate: DateString;
  status: string;
  clientId: UUIDString;
}
```
### Return Type
Recall that executing the `CreateNewProject` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateNewProjectData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateNewProjectData {
  project_insert: Project_Key;
}
```
### Using `CreateNewProject`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createNewProject, CreateNewProjectVariables } from '@dataconnect/generated';

// The `CreateNewProject` mutation requires an argument of type `CreateNewProjectVariables`:
const createNewProjectVars: CreateNewProjectVariables = {
  title: ..., 
  description: ..., // optional
  dueDate: ..., 
  startDate: ..., 
  status: ..., 
  clientId: ..., 
};

// Call the `createNewProject()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createNewProject(createNewProjectVars);
// Variables can be defined inline as well.
const { data } = await createNewProject({ title: ..., description: ..., dueDate: ..., startDate: ..., status: ..., clientId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createNewProject(dataConnect, createNewProjectVars);

console.log(data.project_insert);

// Or, you can use the `Promise` API.
createNewProject(createNewProjectVars).then((response) => {
  const data = response.data;
  console.log(data.project_insert);
});
```

### Using `CreateNewProject`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createNewProjectRef, CreateNewProjectVariables } from '@dataconnect/generated';

// The `CreateNewProject` mutation requires an argument of type `CreateNewProjectVariables`:
const createNewProjectVars: CreateNewProjectVariables = {
  title: ..., 
  description: ..., // optional
  dueDate: ..., 
  startDate: ..., 
  status: ..., 
  clientId: ..., 
};

// Call the `createNewProjectRef()` function to get a reference to the mutation.
const ref = createNewProjectRef(createNewProjectVars);
// Variables can be defined inline as well.
const ref = createNewProjectRef({ title: ..., description: ..., dueDate: ..., startDate: ..., status: ..., clientId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createNewProjectRef(dataConnect, createNewProjectVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.project_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.project_insert);
});
```

## UpdateProjectStatus
You can execute the `UpdateProjectStatus` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateProjectStatus(vars: UpdateProjectStatusVariables): MutationPromise<UpdateProjectStatusData, UpdateProjectStatusVariables>;

interface UpdateProjectStatusRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateProjectStatusVariables): MutationRef<UpdateProjectStatusData, UpdateProjectStatusVariables>;
}
export const updateProjectStatusRef: UpdateProjectStatusRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateProjectStatus(dc: DataConnect, vars: UpdateProjectStatusVariables): MutationPromise<UpdateProjectStatusData, UpdateProjectStatusVariables>;

interface UpdateProjectStatusRef {
  ...
  (dc: DataConnect, vars: UpdateProjectStatusVariables): MutationRef<UpdateProjectStatusData, UpdateProjectStatusVariables>;
}
export const updateProjectStatusRef: UpdateProjectStatusRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateProjectStatusRef:
```typescript
const name = updateProjectStatusRef.operationName;
console.log(name);
```

### Variables
The `UpdateProjectStatus` mutation requires an argument of type `UpdateProjectStatusVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateProjectStatusVariables {
  projectId: UUIDString;
  newStatus: string;
}
```
### Return Type
Recall that executing the `UpdateProjectStatus` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateProjectStatusData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateProjectStatusData {
  project_update?: Project_Key | null;
}
```
### Using `UpdateProjectStatus`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateProjectStatus, UpdateProjectStatusVariables } from '@dataconnect/generated';

// The `UpdateProjectStatus` mutation requires an argument of type `UpdateProjectStatusVariables`:
const updateProjectStatusVars: UpdateProjectStatusVariables = {
  projectId: ..., 
  newStatus: ..., 
};

// Call the `updateProjectStatus()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateProjectStatus(updateProjectStatusVars);
// Variables can be defined inline as well.
const { data } = await updateProjectStatus({ projectId: ..., newStatus: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateProjectStatus(dataConnect, updateProjectStatusVars);

console.log(data.project_update);

// Or, you can use the `Promise` API.
updateProjectStatus(updateProjectStatusVars).then((response) => {
  const data = response.data;
  console.log(data.project_update);
});
```

### Using `UpdateProjectStatus`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateProjectStatusRef, UpdateProjectStatusVariables } from '@dataconnect/generated';

// The `UpdateProjectStatus` mutation requires an argument of type `UpdateProjectStatusVariables`:
const updateProjectStatusVars: UpdateProjectStatusVariables = {
  projectId: ..., 
  newStatus: ..., 
};

// Call the `updateProjectStatusRef()` function to get a reference to the mutation.
const ref = updateProjectStatusRef(updateProjectStatusVars);
// Variables can be defined inline as well.
const ref = updateProjectStatusRef({ projectId: ..., newStatus: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateProjectStatusRef(dataConnect, updateProjectStatusVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.project_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.project_update);
});
```

