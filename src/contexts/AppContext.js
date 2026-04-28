import { createContext, useContext, useState, useEffect } from 'react';

export const AppContext = createContext({
  patientId: 'daniela',
  patientName: 'Daniela',
  token: 'daniela-secret-token',
  isCaregiver: true,
  setIsCaregiver: () => {},
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

export function AppProvider({ children }) {
  const [isCaregiver, setIsCaregiver] = useState(() => {
    return !window.location.hash.includes('#/p/');
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('caregiver_auth') === 'true';
  });

  // Keep a listener in case the hash changes while running
  useEffect(() => {
    const handleHashChange = () => {
      setIsCaregiver(!window.location.hash.includes('#/p/'));
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const login = (pin) => {
    // For simplicity in MVP, hardcode a simple PIN "1234"
    if (pin === '1234') {
      setIsAuthenticated(true);
      localStorage.setItem('caregiver_auth', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('caregiver_auth');
  };

  return (
    <AppContext.Provider value={{ 
      patientId: 'daniela', 
      patientName: 'Daniela', 
      token: 'daniela-secret-token',
      isCaregiver,
      setIsCaregiver,
      isAuthenticated,
      login,
      logout
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
