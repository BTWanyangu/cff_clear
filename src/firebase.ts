import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// 🔑 Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBEObz9ZB-WgQ__7flcHhGWAaGqbogxiEI",
  authDomain: "cff-clear-system.firebaseapp.com",
  projectId: "cff-clear-system",
  storageBucket: "cff-clear-system.firebasestorage.app",
  messagingSenderId: "243859270816",
  appId: "1:243859270816:web:9158d30594e4d1f42b6dc5",
  measurementId: "G-6PGVSP0E69"
};
// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Auth, Firestore, Storage
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

signInAnonymously(auth).catch(err => {
	console.error("Anonymous sign-in failed:", err);
});

// Analytics (browser only)
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}
export { analytics };
