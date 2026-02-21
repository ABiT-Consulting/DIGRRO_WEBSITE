import { useEffect, useState } from 'react';
import AuthModal from './components/AuthModal';
import WhatsAppButton from './components/WhatsAppButton';
import { supabase } from './lib/supabase';
import Home from './pages/Home';

type AuthMode = 'login' | 'signup';

function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      setIsAuthModalOpen(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900">
      <main>
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
