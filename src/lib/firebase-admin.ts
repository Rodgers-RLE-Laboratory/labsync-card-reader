import { App, cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

let app: App;
let db: Firestore;

function getFirebaseApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!keyPath) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY env var is not set");
  }

  const serviceAccount = JSON.parse(readFileSync(keyPath, "utf-8"));

  app = initializeApp({
    credential: cert(serviceAccount),
  });

  return app;
}

export function getDb(): Firestore {
  if (db) return db;
  db = getFirestore(getFirebaseApp());
  return db;
}
