import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileMenu } from './MobileMenu';

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDesktop;
}

export function AppShell({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <div className="app-shell-desktop">
        <Sidebar />
        <main className="flex-1 min-w-0 app-main bg-slate-50 dark:bg-navy-900">
          <div className="max-w-3xl mx-auto p-4">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell-mobile">
      <TopBar onMenuToggle={() => setMenuOpen(true)} />
      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <main className="flex-1 min-h-0 app-main bg-slate-50 dark:bg-navy-900">
        <div className="p-4">
          {children}
        </div>
      </main>
    </div>
  );
}
