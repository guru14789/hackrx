import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBuDzg2L5SdR_VWZyPtw0Kw85Bw8Wjwdxw",
  authDomain: "hackrx-4d649.firebaseapp.com",
  projectId: "hackrx-4d649",
  storageBucket: "hackrx-4d649.firebasestorage.app",
  messagingSenderId: "451746858908",
  appId: "1:451746858908:web:a4142c23c30f32af5cea59",
  measurementId: "G-WD94WK5VFT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;