// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database"; // Realtime Database
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAxIcwmXnMoRzAKIrTzd95KzQ0IxuLge90",
  authDomain: "warungku-haerudin-v2.firebaseapp.com",
  databaseURL: "https://warungku-haerudin-v2-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "warungku-haerudin-v2",
  storageBucket: "warungku-haerudin-v2.firebasestorage.app",
  messagingSenderId: "526785851213",
  appId: "1:526785851213:web:86d69fcb3f4b5115859104"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export db agar bisa dibaca di App.jsx
export const db = getDatabase(app);