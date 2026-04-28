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
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase.js';

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

export async function hasFilledToday() {
  const today = new Date().toDateString();
  const q = query(collection(db, 'test_results'), orderBy('submittedAt', 'desc'), limit(10));
  const snap = await getDocs(q);
  const todaysDocs = snap.docs.filter((d) => {
    const data = d.data();
    const dateStr = new Date(data.submittedAt || data.timestamp).toDateString();
    return dateStr === today;
  });

  return {
    any: todaysDocs.length > 0,
    patient: todaysDocs.some(d => d.data().submittedByRole === 'patient' || d.data().submittedByRole === 'user'),
    caregiver: todaysDocs.some(d => d.data().submittedByRole === 'caregiver'),
    count: todaysDocs.length
  };
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
  
  if (typeof window !== 'undefined' && typeof Blob !== 'undefined') {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-bipolar-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    console.log('Export JSON only works in a browser environment.');
    return data;
  }
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

// ─── NEW: test_results logic ───
export async function saveTestResult(payload) {
  const { patientId, testType, answers, scores, ...rest } = payload;
  const docRef = await addDoc(collection(db, 'test_results'), {
    patientId: patientId || DEFAULT_PATIENT_ID,
    testType: testType || 'composite',
    submittedAt: payload.timestamp || payload.submittedAt || new Date().toISOString(),
    answers: answers || {},
    scores: scores || {},
    context: payload.context || {},
    severity: payload.severity || 0,
    ...rest,
  });
  return docRef.id;
}

export async function getAllTestResults() {
  const q = query(collection(db, 'test_results'), orderBy('submittedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ _id: d.id, ...d.data() }));
}

export async function deleteTestResult(id) {
  await deleteDoc(doc(db, 'test_results', id));
}

export async function getLastTestResultByType(type) {
  const q = query(
    collection(db, 'test_results'),
    where('testType', '==', type),
    orderBy('submittedAt', 'desc'),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { _id: snap.docs[0].id, ...snap.docs[0].data() };
}

export async function getLastCaregiverTestResult() {
  const q = query(
    collection(db, 'test_results'),
    where('submittedByRole', '==', 'caregiver'),
    orderBy('submittedAt', 'desc'),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { _id: snap.docs[0].id, ...snap.docs[0].data() };
}

export async function migrateResultsToNewFormat() {
  const [caregiver, patient, mood, composite] = await Promise.all([
    getAll(COLS.caregiver),
    getAll(COLS.patient),
    getAll(COLS.mood),
    getAll(COLS.composite)
  ]);
  
  const existingSnap = await getDocs(query(collection(db, 'test_results')));
  const migratedIds = new Set(existingSnap.docs.map(d => d.data()._originalId).filter(Boolean));
  
  const toMigrate = [];
  
  // 1. Composite docs (newest format before test_results)
  for (const d of composite) {
    if (migratedIds.has(d._id)) continue;
    toMigrate.push({
      patientId: d.patientId || DEFAULT_PATIENT_ID,
      testType: d.testType || 'composite',
      submittedAt: d.timestamp || d.date || new Date().toISOString(),
      answers: d.raw || {},
      scores: d.scoresBySection || {},
      context: d.context || { appVersion: d.appVersion },
      severity: d.severity || 0,
      submittedByRole: d.submittedByRole || 'caregiver',
      _originalId: d._id,
      inconsistencies: d.inconsistencies || []
    });
  }

  // 2. Legacy caregiver
  for (const d of caregiver) {
    if (migratedIds.has(d._id)) continue;
    toMigrate.push({
      patientId: d.patientId || DEFAULT_PATIENT_ID,
      testType: d.testType || 'mania',
      submittedAt: d.timestamp || d.date || new Date().toISOString(),
      answers: d.raw || d, // In very old versions, the doc was the answers
      scores: { mania: d.severity || 0 },
      context: { legacy: true, appVersion: d.appVersion || 1 },
      severity: d.severity || 0,
      submittedByRole: 'caregiver',
      _originalId: d._id
    });
  }

  // 3. Legacy patient
  for (const d of patient) {
    if (migratedIds.has(d._id)) continue;
    toMigrate.push({
      patientId: d.patientId || DEFAULT_PATIENT_ID,
      testType: d.testType || 'mania',
      submittedAt: d.timestamp || d.date || new Date().toISOString(),
      answers: d.raw || d,
      scores: { mania: d.severity || 0 },
      context: { legacy: true, appVersion: d.appVersion || 1 },
      severity: d.severity || 0,
      submittedByRole: 'patient',
      _originalId: d._id
    });
  }

  // 4. Legacy mood
  for (const d of mood) {
    if (migratedIds.has(d._id)) continue;
    toMigrate.push({
      patientId: d.patientId || DEFAULT_PATIENT_ID,
      testType: d.testType || 'mood_comprehensive',
      submittedAt: d.timestamp || d.date || new Date().toISOString(),
      answers: d.raw || d,
      scores: { depression: d.depressionScore || d.severity || 0 },
      context: { legacy: true, appVersion: d.appVersion || 2 },
      severity: d.depressionScore || d.severity || 0,
      submittedByRole: d.submittedByRole || 'patient',
      _originalId: d._id
    });
  }
  
  let migrated = 0;
  const BATCH_SIZE = 490;
  for (let i = 0; i < toMigrate.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = toMigrate.slice(i, i + BATCH_SIZE);
    for (const item of chunk) {
      batch.set(doc(collection(db, 'test_results')), item);
    }
    await batch.commit();
    migrated += chunk.length;
  }
  return { migrated, skipped: (composite.length + caregiver.length + patient.length + mood.length) - migrated };
}

