import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCenTWCEB-1il-kPlCfqZrLNRhUg2bPncw",
  authDomain: "study-buddy-cbaa8.firebaseapp.com",
  projectId: "study-buddy-cbaa8",
  storageBucket: "study-buddy-cbaa8.firebasestorage.app",
  messagingSenderId: "1081144289483",
  appId: "1:1081144289483:web:397ca4ebc5b0d82bad934e"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)