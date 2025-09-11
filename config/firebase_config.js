// /config/firebase_config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

export const firebaseConfig = {
  
apiKey: "AIzaSyAeCrURSs0TBXlYF3TKLi4q98VwrGaKe_Q",
    authDomain: "spsch-849e5.firebaseapp.com",
    databaseURL: "https://spsch-849e5-default-rtdb.firebaseio.com",
    projectId: "spsch-849e5",
    storageBucket: "spsch-849e5.firebasestorage.app",
    messagingSenderId: "698967090558",
    appId: "1:698967090558:web:978781fd27b86c36203f2f",
    measurementId: "G-C5D3774P2G"


};

export const app = initializeApp(firebaseConfig);
export const rtdb = getDatabase(app);
export const db = getFirestore(app); // opcional
