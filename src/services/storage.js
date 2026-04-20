import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  writeBatch,
  doc,
} from 'firebase/firestore';
import { db } from './firebase';

const COLS = {
  caregiver: 'caregiver_tests',
  patient: 'patient_tests',
};

async function getAll(col) {
  const q = query(collection(db, col), orderBy('timestamp'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
}

async function getLast(col) {
  const q = query(collection(db, col), orderBy('timestamp', 'desc'), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { _id: snap.docs[0].id, ...snap.docs[0].data() };
}

export async function saveCaregiver(data) {
  await addDoc(collection(db, COLS.caregiver), data);
}

export async function getAllCaregiver() {
  return getAll(COLS.caregiver);
}

export async function getLastCaregiver() {
  return getLast(COLS.caregiver);
}

export async function savePatient(data) {
  await addDoc(collection(db, COLS.patient), data);
}

export async function getAllPatient() {
  return getAll(COLS.patient);
}

export async function getLastPatient() {
  return getLast(COLS.patient);
}

export async function getReport() {
  const [caregiver, patient] = await Promise.all([
    getAll(COLS.caregiver),
    getAll(COLS.patient),
  ]);
  return { caregiver, patient };
}

export async function deleteAll() {
  const batch = writeBatch(db);
  for (const col of Object.values(COLS)) {
    const snap = await getDocs(collection(db, col));
    snap.docs.forEach((d) => batch.delete(doc(db, col, d.id)));
  }
  await batch.commit();
}

export async function exportJSON() {
  const { caregiver, patient } = await getReport();
  const data = {
    exportedAt: new Date().toISOString(),
    caregiver,
    patient,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reporte-mania-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
