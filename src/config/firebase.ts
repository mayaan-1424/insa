@@ .. @@
 // Import the functions you need from the SDKs you need
 import { initializeApp } from "firebase/app";
 import { getAnalytics } from "firebase/analytics";
+import { getAuth } from "firebase/auth";
+import { getFirestore } from "firebase/firestore";
+import { getStorage } from "firebase/storage";
 // TODO: Add SDKs for Firebase products that you want to use
 // https://firebase.google.com/docs/web/setup#available-libraries
 
@@ .. @@
 // Initialize Firebase
 const app = initializeApp(firebaseConfig);
 const analytics = getAnalytics(app);
+
+// Initialize Firebase services
+export const auth = getAuth(app);
+export const db = getFirestore(app);
+export const storage = getStorage(app);
+
+export default app;