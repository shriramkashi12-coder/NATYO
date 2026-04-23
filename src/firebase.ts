import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBuojOnQ3pid5GQwj-rZH3oR_977f4H3e8",
    authDomain: "natyo-a86f7.firebaseapp.com",
    projectId: "natyo-a86f7",
    storageBucket: "natyo-a86f7.firebasestorage.app",
    messagingSenderId: "464627965150",
    appId: "1:464627965150:web:227be1de60ef749f57364f"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);