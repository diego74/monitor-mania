import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDhzSaEuHqQTrMh48s898LtRrZGoPPJdag',
  authDomain: 'monitor-mania-3bb16.firebaseapp.com',
  projectId: 'monitor-mania-3bb16',
  storageBucket: 'monitor-mania-3bb16.firebasestorage.app',
  messagingSenderId: '20687596014',
  appId: '1:20687596014:web:711f435a3eebc0841886ff',
  measurementId: 'G-Z4WKVPYZGK',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
