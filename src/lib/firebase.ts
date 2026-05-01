import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);

// Use (default) for testing since flavor-genius-db might not be provisioned correctly or targeted by deploy_firebase
export const db = getFirestore(app, "(default)");

export const auth = getAuth(app);

export default app;
