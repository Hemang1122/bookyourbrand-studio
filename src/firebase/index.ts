
'use client';

// This file serves as a "barrel" file to simplify imports.
// It re-exports all the necessary hooks and components from their source files.
// This allows other parts of the application to import from '@/firebase'
// instead of needing to know the exact file path of each hook.

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './config';
