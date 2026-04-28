import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';

const GROUPS_COL = 'question_groups';

export async function getAllGroups() {
  const q = query(collection(db, GROUPS_COL), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ _id: d.id, ...d.data() }));
}

export async function saveGroup(group) {
  const data = {
    ...group,
    updatedAt: new Date().toISOString(),
  };

  if (group._id) {
    const { _id, ...rest } = data;
    await updateDoc(doc(db, GROUPS_COL, _id), rest);
    return _id;
  } else {
    data.createdAt = new Date().toISOString();
    data.order = data.order || 0;
    const docRef = await addDoc(collection(db, GROUPS_COL), data);
    return docRef.id;
  }
}

export async function deleteGroup(id) {
  await deleteDoc(doc(db, GROUPS_COL, id));
}
