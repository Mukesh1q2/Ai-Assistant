import { useEffect } from 'react';
import { useAuthStore, useThemeStore } from '@/store';
import LandingPage from '@/sections/LandingPage';
import Dashboard from '@/sections/Dashboard';
import { Toaster } from '@/components/ui/sonner';

function App() {
  const { isAuthenticated } = useAuthStore();
  const { theme } = useThemeStore();

  // Apply theme
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {isAuthenticated ? <Dashboard /> : <LandingPage />}
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
