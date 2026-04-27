import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION = 'patient_profiles';

export async function getPatientProfile(patientId = 'daniela') {
  const ref = doc(db, COLLECTION, patientId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data();
}

export async function savePatientProfile(data, patientId = 'daniela') {
  const ref = doc(db, COLLECTION, patientId);
  await setDoc(ref, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
}
