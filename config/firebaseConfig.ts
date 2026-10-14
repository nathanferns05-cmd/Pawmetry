import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
   // @ts-ignore - getReactNativePersistence exists at runtime but isn't typed in this Firebase SDK version
  getReactNativePersistence,
  getAuth,
  type Auth,
} from "firebase/auth";
import { initializeFirestore, getFirestore, type Firestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyAgM86KttVbvW7nchHUK2s4bgevkd3F7H8",
  authDomain: "pawmetry-62af8.firebaseapp.com",
  projectId: "pawmetry-62af8",
  storageBucket: "pawmetry-62af8.firebasestorage.app",
  messagingSenderId: "725404541322",
  appId: "1:725404541322:web:b1a085ce24767370522873",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  auth = getAuth(app);
}

export { auth };

let db: Firestore;
try {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
} catch (error) {
  db = getFirestore(app);
}

export { db };

export default app;