// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyApoEIo4LLJ0HjWpMSaDNjO5qQzrnyKA4Q",
  authDomain: "instaadgen-3e55d.firebaseapp.com",
  projectId: "instaadgen-3e55d",
  storageBucket: "instaadgen-3e55d.firebasestorage.app",
  messagingSenderId: "697559770190",
  appId: "1:697559770190:web:694abd200080c61743cf1f",
  measurementId: "G-FH8HNWQG9J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);