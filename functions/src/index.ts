'use client';
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();

// The URL of your deployed Next.js application.
// IMPORTANT: You will need to set this in your function's environment variables.
const APP_URL = functions.config().app?.url || "http://localhost:9002";
