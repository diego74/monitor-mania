import { collection, addDoc, getDocs, doc, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from './firebase';

const QUESTIONS_COL = 'question_bank';

export async function getAllQuestions() {
  const q = query(collection(db, QUESTIONS_COL), where('active', '==', true), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ _id: d.id, ...d.data() }));
}

export async function getAllQuestionsIncludingInactive() {
  const q = query(collection(db, QUESTIONS_COL), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ _id: d.id, ...d.data() }));
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
  await updateDoc(doc(db, QUESTIONS_COL, id), {
    active: false,
    updatedAt: new Date().toISOString(),
  });
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