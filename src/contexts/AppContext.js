import { createContext, useContext } from 'react';

export const AppContext = createContext({
  role: 'caregiver',
  patientId: 'daniela',
  patientName: 'Daniela',
  token: null,
});

export function useApp() {
  return useContext(AppContext);
}
