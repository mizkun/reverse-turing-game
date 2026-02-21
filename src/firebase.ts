import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyBhpe243gWCVma-n6AD3BEPsfMo9FoYczw",
  authDomain: "reverse-turing-game.firebaseapp.com",
  projectId: "reverse-turing-game",
  storageBucket: "reverse-turing-game.firebasestorage.app",
  messagingSenderId: "174419797478",
  appId: "1:174419797478:web:79b0f2c19be3658a7aa227",
  measurementId: "G-3Q16T7V1XH",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app, "asia-northeast1");

export const initAuth = () => signInAnonymously(auth);

// Callable function wrappers
export const callCreateRoom = httpsCallable(functions, "createRoom");
export const callStartRound = httpsCallable(functions, "startRound");
export const callVerifyHost = httpsCallable(functions, "verifyHost");
export const callJoinAsDetective = httpsCallable(functions, "joinAsDetective");
export const callVerifySpyToken = httpsCallable(functions, "verifySpyToken");
export const callSubmitPost = httpsCallable(functions, "submitPost");
export const callReportId = httpsCallable(functions, "reportId");
export const callRevealResults = httpsCallable(functions, "revealResults");
