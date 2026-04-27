const DEFAULT_PATIENT_ID = 'daniela';

export function encodeToken(patientId = DEFAULT_PATIENT_ID) {
  return btoa(patientId);
}

export function decodeToken(token) {
  try {
    return atob(token) || DEFAULT_PATIENT_ID;
  } catch {
    return DEFAULT_PATIENT_ID;
  }
}

export function getDefaultToken() {
  return encodeToken(DEFAULT_PATIENT_ID);
}

export function buildPatientLink(testType = 'mania') {
  const token = encodeToken(DEFAULT_PATIENT_ID);
  const base = window.location.href.split('#')[0];
  return `${base}#/p/${token}/${testType}`;
}
