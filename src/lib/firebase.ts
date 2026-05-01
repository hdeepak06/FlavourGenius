import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);

// Temporary test: use (default) instead of flavor-genius-db
export const db = getFirestore(app, "(default)");

export const auth = getAuth(app);

export default app;
