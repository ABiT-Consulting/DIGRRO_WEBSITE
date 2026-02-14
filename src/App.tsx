import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import AuthModal from './components/AuthModal';
import WhatsAppButton from './components/WhatsAppButton';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import Home from './pages/Home';

type AuthMode = 'login' | 'signup';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setIsAuthModalOpen(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-gray-800 bg-gray-900/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-end gap-3 px-4 sm:px-6 lg:px-8">
          {session?.user ? (
            <>
              <span className="hidden text-sm text-gray-300 sm:block">{session.user.email}</span>
              <button
                onClick={handleSignOut}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              {!isSupabaseConfigured && <span className="hidden text-xs text-amber-300 sm:block">Auth requires Supabase env vars</span>}

              <button
                onClick={() => {
                  setAuthMode('login');
                  setIsAuthModalOpen(true);
                }}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
              >
                Login
              </button>
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setIsAuthModalOpen(true);
                }}
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </header>

      <main className="pt-16">
        <Home />
      </main>
      <AuthModal
        isOpen={isAuthModalOpen}
        mode={authMode}
        onModeChange={setAuthMode}
        onClose={() => setIsAuthModalOpen(false)}
      />
      <WhatsAppButton />
    </div>
  );
}

export default App;
