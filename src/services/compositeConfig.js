import { doc, getDoc, setDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

const CONFIG_DOC_ID = 'composite_config';
const BRANCHING_COL = 'branching_rules';
const SECTIONS_COL = 'composite_sections';
const MODULE_CONFIG_COL = 'composite_module_config';

// ─── Composite config ──────────────────────────────────────────────────────
export async function getCompositeConfig() {
  try {
    const docRef = doc(db, 'config', CONFIG_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) return snap.data();
    return {
      enabled: true,
      branchingEnabled: true,
      maniaThreshold: 1.5,
      hypomaniaThreshold: 2.2,
      depressionThreshold: 1.5,
      activeBranchingRules: ['mixed_state', 'val_energy', 'impulsivity', 'suicidal_risk', 'birthday_month', 'cycle_premenstrual'],
      multiplierConfig: {
        enabled: false,
        stressManiaBoost: 0.0,
        stressManiaThreshold: 2.0,
        confirmationMultipliersByAnswer: [0, 0.1, 0.25, 0.4, 0.6],
        questionMultipliers: {},
      },
      moduleConfig: {
        mania: { enabled: true, order: 20 },
        hypomania: { enabled: true, order: 30 },
        depression: { enabled: true, order: 40 },
      },
      updatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error('Error loading composite config:', err);
    throw err;
  }
}

export async function saveCompositeConfig(config) {
  try {
    const docRef = doc(db, 'config', CONFIG_DOC_ID);
    await setDoc(docRef, { ...config, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error saving composite config:', err);
    throw err;
  }
}

// ─── Module Configuration ──────────────────────────────────────────────────
export async function getModuleConfig() {
  try {
    const snap = await getDocs(collection(db, MODULE_CONFIG_COL));
    const configs = snap.docs.map(d => ({ _id: d.id, ...d.data() }));
    if (configs.length === 0) {
      // Return defaults
      return [
        { _id: 'mania', name: 'Módulo manía', enabled: true, order: 20, category: 'mania', condition: { type: 'score', dimension: 'maniaScore', operator: '>=', threshold: 2.2 } },
        { _id: 'hypomania', name: 'Módulo hipomanía', enabled: true, order: 30, category: 'hypomania', condition: { type: 'score', dimension: 'maniaScore', operator: '>=', threshold: 1.5, maxThreshold: 2.2 } },
        { _id: 'depression', name: 'Módulo depresión', enabled: true, order: 40, category: 'depression', condition: { type: 'score', dimension: 'depressionScore', operator: '>', threshold: 1.5 } },
      ];
    }
    return configs.sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (err) {
    console.error('Error loading module config:', err);
    return [];
  }
}

export async function saveModuleConfig(config) {
  try {
    const id = config._id || `mod_${Date.now()}`;
    const docRef = doc(db, MODULE_CONFIG_COL, id);
    const data = { ...config, _id: id, updatedAt: new Date().toISOString() };
    await setDoc(docRef, data);
    return id;
  } catch (err) {
    console.error('Error saving module config:', err);
    throw err;
  }
}

export async function deleteModuleConfig(id) {
  try {
    await deleteDoc(doc(db, MODULE_CONFIG_COL, id));
  } catch (err) {
    console.error('Error deleting module config:', err);
    throw err;
  }
}

// ─── Composite Sections ────────────────────────────────────────────────────
export async function getCompositeSections({ includeDisabled = false } = {}) {
  try {
    let q = query(collection(db, SECTIONS_COL), orderBy('order', 'asc'));
    const snap = await getDocs(q);
    const sections = snap.docs.map(d => ({ _id: d.id, ...d.data() }));
    if (!includeDisabled) {
      return sections.filter(s => s.enabled !== false);
    }
    return sections;
  } catch (err) {
    console.error('Error loading composite sections:', err);
    return [];
  }
}

export async function getCompositeSection(id) {
  try {
    const snap = await getDoc(doc(db, SECTIONS_COL, id));
    if (snap.exists()) return { _id: snap.id, ...snap.data() };
    return null;
  } catch (err) {
    console.error('Error loading composite section:', err);
    return null;
  }
}

export async function saveCompositeSection(section) {
  try {
    const id = section._id || `sec_${Date.now()}`;
    const docRef = doc(db, SECTIONS_COL, id);
    const data = {
      ...section,
      _id: id,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, data);
    return id;
  } catch (err) {
    console.error('Error saving composite section:', err);
    throw err;
  }
}

export async function deleteCompositeSection(id) {
  try {
    await deleteDoc(doc(db, SECTIONS_COL, id));
  } catch (err) {
    console.error('Error deleting composite section:', err);
    throw err;
  }
}

export async function reorderCompositeSections(sectionIds) {
  try {
    const batch = writeBatch(db);
    sectionIds.forEach((id, index) => {
      const docRef = doc(db, SECTIONS_COL, id);
      batch.update(docRef, { order: index * 10 });
    });
    await batch.commit();
    return true;
  } catch (err) {
    console.error('Error reordering sections:', err);
    throw err;
  }
}

export async function duplicateCompositeSection(id) {
  try {
    const snap = await getDoc(doc(db, SECTIONS_COL, id));
    if (!snap.exists()) throw new Error('Section not found');
    const section = snap.data();
    const newData = {
      ...section,
      name: `${section.name} (copia)`,
      order: section.order + 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const newDoc = await addDoc(collection(db, SECTIONS_COL), newData);
    return newDoc.id;
  } catch (err) {
    console.error('Error duplicating section:', err);
    throw err;
  }
}

// ─── Custom branching rules (Firestore) ───────────────────────────────────
export async function getBranchingRules({ includeDisabled = false } = {}) {
  try {
    let q = query(collection(db, BRANCHING_COL), orderBy('order', 'asc'));
    const snap = await getDocs(q);
    const rules = snap.docs.map(d => ({ _id: d.id, ...d.data() }));
    if (!includeDisabled) {
      return rules.filter(r => r.active !== false);
    }
    return rules.sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (err) {
    console.error('Error loading branching rules:', err);
    return [];
  }
}

export async function saveBranchingRule(rule) {
  try {
    const data = {
      ...rule,
      updatedAt: new Date().toISOString(),
    };
    if (rule._id) {
      const { _id, ...rest } = data;
      await updateDoc(doc(db, BRANCHING_COL, rule._id), rest);
      return rule._id;
    } else {
      data.createdAt = new Date().toISOString();
      data.active = true;
      const ref = await addDoc(collection(db, BRANCHING_COL), data);
      return ref.id;
    }
  } catch (err) {
    console.error('Error saving branching rule:', err);
    throw err;
  }
}

export async function deleteBranchingRule(id) {
  try {
    await updateDoc(doc(db, BRANCHING_COL, id), {
      active: false,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error deleting branching rule:', err);
    throw err;
  }
}

// ─── Batch Operations ──────────────────────────────────────────────────────
export async function batchUpdateSectionOrders(updates) {
  try {
    const batch = writeBatch(db);
    updates.forEach(({ id, order }) => {
      const docRef = doc(db, SECTIONS_COL, id);
      batch.update(docRef, { order });
    });
    await batch.commit();
    return true;
  } catch (err) {
    console.error('Error in batch update:', err);
    throw err;
  }
}
