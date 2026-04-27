import { useLocation } from 'react-router-dom';
import { decodeToken } from '../utils/tokens';

const SESSION_KEY = 'monitorBipolar_patientSession';

export function useRole() {
  const location = useLocation();
  const path = location.pathname;

  if (path.startsWith('/p/')) {
    const parts = path.split('/');
    const token = parts[2] || '';
    const patientId = decodeToken(token) || 'daniela';
    const data = { role: 'patient', patientId, token };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
    return data;
  }

  const saved = sessionStorage.getItem(SESSION_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }

  return { role: 'caregiver', patientId: 'daniela', token: null };
}
