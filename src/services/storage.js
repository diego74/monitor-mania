const KEYS = {
  caregiver: 'maniaCaregiver',
  patient: 'maniaPatient',
};

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function write(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function saveCaregiver(data) {
  const history = read(KEYS.caregiver);
  history.push(data);
  write(KEYS.caregiver, history);
}

export function getAllCaregiver() {
  return read(KEYS.caregiver);
}

export function getLastCaregiver() {
  const history = read(KEYS.caregiver);
  return history[history.length - 1] ?? null;
}

export function savePatient(data) {
  const history = read(KEYS.patient);
  history.push(data);
  write(KEYS.patient, history);
}

export function getAllPatient() {
  return read(KEYS.patient);
}

export function getLastPatient() {
  const history = read(KEYS.patient);
  return history[history.length - 1] ?? null;
}

export function getReport() {
  return {
    caregiver: read(KEYS.caregiver),
    patient: read(KEYS.patient),
  };
}

export function deleteAll() {
  localStorage.removeItem(KEYS.caregiver);
  localStorage.removeItem(KEYS.patient);
}

export function exportJSON() {
  const data = {
    exportedAt: new Date().toISOString(),
    caregiver: read(KEYS.caregiver),
    patient: read(KEYS.patient),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reporte-mania-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
