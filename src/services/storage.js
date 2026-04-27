import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  writeBatch,
  doc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

const COLS = {
  caregiver: 'caregiver_tests',
  patient: 'patient_tests',
  mood: 'mood_tests',
  composite: 'composite_tests',
};

const DEFAULT_PATIENT_ID = 'daniela';

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

export async function saveCaregiver(data, testType = 'mania') {
  await addDoc(collection(db, COLS.caregiver), {
    ...data,
    patientId: DEFAULT_PATIENT_ID,
    testType,
    submittedByRole: 'caregiver',
    appVersion: 2,
  });
}

export async function getAllCaregiver() {
  return getAll(COLS.caregiver);
}

export async function getLastCaregiver() {
  return getLast(COLS.caregiver);
}

export async function getLastCaregiverMania() {
  const q = query(collection(db, COLS.caregiver), orderBy('timestamp', 'desc'), limit(10));
  const snap = await getDocs(q);
  const matched = snap.docs.find((d) => {
    const t = d.data().testType;
    return !t || t === 'mania';
  });
  if (!matched) return null;
  return { _id: matched.id, ...matched.data() };
}

export async function savePatient(data) {
  await addDoc(collection(db, COLS.patient), {
    ...data,
    patientId: DEFAULT_PATIENT_ID,
    testType: 'mania',
    submittedByRole: 'patient',
    appVersion: 2,
  });
}

export async function getAllPatient() {
  return getAll(COLS.patient);
}

export async function getLastPatient() {
  return getLast(COLS.patient);
}

export async function saveMood(data) {
  await addDoc(collection(db, COLS.mood), {
    ...data,
    patientId: DEFAULT_PATIENT_ID,
    testType: 'mood_comprehensive',
    submittedByRole: 'patient',
    appVersion: 2,
  });
}

export async function getAllMood() {
  return getAll(COLS.mood);
}

export async function getLastMood() {
  return getLast(COLS.mood);
}

export async function saveComposite(data) {
  await addDoc(collection(db, COLS.composite), {
    ...data,
    appVersion: 3,
  });
}

export async function getAllComposite() {
  return getAll(COLS.composite);
}

export async function getLastComposite() {
  return getLast(COLS.composite);
}

export async function hasFilledToday(colName) {
  const today = new Date().toDateString();
  const q = query(collection(db, colName), orderBy('timestamp', 'desc'), limit(5));
  const snap = await getDocs(q);
  return snap.docs.some((d) => new Date(d.data().timestamp).toDateString() === today);
}

export async function getReport() {
  const [caregiver, patient, mood, composite] = await Promise.all([
    getAll(COLS.caregiver),
    getAll(COLS.patient),
    getAll(COLS.mood),
    getAll(COLS.composite),
  ]);
  return { caregiver, patient, mood, composite };
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
  const { caregiver, patient, mood, composite } = await getReport();
  const data = {
    exportedAt: new Date().toISOString(),
    caregiver,
    patient,
    mood,
    composite,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reporte-bipolar-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export const COLLECTION_NAMES = {
  caregiver: COLS.caregiver,
  patient: COLS.patient,
  mood: COLS.mood,
  composite: COLS.composite,
};

export async function migrateToComposite() {
  const [caregiverDocs, patientDocs, moodDocs] = await Promise.all([
    getAll(COLS.caregiver),
    getAll(COLS.patient),
    getAll(COLS.mood),
  ]);

  // Build set of already-migrated original IDs to avoid duplicates
  const existingSnap = await getDocs(
    query(collection(db, COLS.composite), where('_migratedFrom', '!=', null))
  );
  const migratedIds = new Set(existingSnap.docs.map(d => d.data()._originalId).filter(Boolean));

  const toMigrate = [];

  for (const d of caregiverDocs) {
    if (migratedIds.has(d._id)) continue;
    toMigrate.push({
      timestamp: d.timestamp,
      date: d.date,
      patientId: d.patientId ?? DEFAULT_PATIENT_ID,
      testType: 'composite',
      submittedByRole: 'caregiver',
      severity: d.severity ?? 0,
      scoresBySection: { mania: d.severity ?? 0, mood: null, depression: null },
      raw: d.raw ?? {},
      stagesCompleted: ['stage0', 'stage1'],
      branchingLog: [],
      inconsistencies: [],
      appVersion: 3,
      _migratedFrom: COLS.caregiver,
      _originalId: d._id,
    });
  }

  for (const d of patientDocs) {
    if (migratedIds.has(d._id)) continue;
    toMigrate.push({
      timestamp: d.timestamp,
      date: d.date,
      patientId: d.patientId ?? DEFAULT_PATIENT_ID,
      testType: 'composite',
      submittedByRole: 'patient',
      severity: d.severity ?? 0,
      scoresBySection: { mania: d.severity ?? 0, mood: null, depression: null },
      raw: d.raw ?? {},
      stagesCompleted: ['stage0', 'stage1'],
      branchingLog: [],
      inconsistencies: [],
      appVersion: 3,
      _migratedFrom: COLS.patient,
      _originalId: d._id,
    });
  }

  for (const d of moodDocs) {
    if (migratedIds.has(d._id)) continue;
    toMigrate.push({
      timestamp: d.timestamp,
      date: d.date,
      patientId: d.patientId ?? DEFAULT_PATIENT_ID,
      testType: 'composite',
      submittedByRole: d.submittedByRole ?? 'patient',
      severity: d.severity ?? d.depressionScore ?? 0,
      scoresBySection: { mania: null, mood: d.severity ?? 0, depression: d.depressionScore ?? d.severity ?? 0 },
      raw: d.raw ?? {},
      stagesCompleted: ['stage0', 'stage1'],
      branchingLog: [],
      inconsistencies: [],
      appVersion: 3,
      _migratedFrom: COLS.mood,
      _originalId: d._id,
    });
  }

  // Write in batches of 500 (Firestore limit)
  let migrated = 0;
  const BATCH_SIZE = 490;
  for (let i = 0; i < toMigrate.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = toMigrate.slice(i, i + BATCH_SIZE);
    for (const item of chunk) {
      batch.set(doc(collection(db, COLS.composite)), item);
    }
    await batch.commit();
    migrated += chunk.length;
  }

  return { migrated, skipped: caregiverDocs.length + patientDocs.length + moodDocs.length - migrated };
}
