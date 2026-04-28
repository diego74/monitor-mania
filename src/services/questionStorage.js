import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from './firebase';

const QUESTIONS_COL = 'question_bank';

export async function getAllQuestions() {
  const q = query(collection(db, QUESTIONS_COL), where('active', '==', true));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ _id: d.id, ...d.data() }))
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}


export async function getAllQuestionsIncludingInactive() {
  const q = collection(db, QUESTIONS_COL);
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ _id: d.id, ...d.data() }))
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}


export async function saveQuestion(question) {
  const data = {
    ...question,
    createdAt: question.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (question._id) {
    // Update
    await updateDoc(doc(db, QUESTIONS_COL, question._id), data);
    return question._id;
  } else {
    // Create
    const docRef = await addDoc(collection(db, QUESTIONS_COL), data);
    return docRef.id;
  }
}

export async function deleteQuestion(id) {
  await deleteDoc(doc(db, QUESTIONS_COL, id));
}

export async function reorderQuestions(questions) {
  const batch = [];
  questions.forEach((q, index) => {
    batch.push(updateDoc(doc(db, QUESTIONS_COL, q._id), {
      order: index + 1,
      updatedAt: new Date().toISOString(),
    }));
  });

  await Promise.all(batch);
}

export async function updateExistingQuestionsSchema() {
  const q = collection(db, QUESTIONS_COL);
  const snap = await getDocs(q);
  const updates = [];

  snap.docs.forEach(d => {
    const data = d.data();
    const needsUpdate = !data.name || !data.patient || !data.caregiver;
    
    if (needsUpdate) {
      updates.push(updateDoc(d.ref, {
        name: data.name || '',
        patient: data.patient || data.question || '',
        caregiver: data.caregiver || data.question || '',
        updatedAt: new Date().toISOString()
      }));
    }
  });

  await Promise.all(updates);
  return updates.length;
}