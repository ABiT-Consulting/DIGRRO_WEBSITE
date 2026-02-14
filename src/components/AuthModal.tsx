import { X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

type AuthMode = 'login' | 'signup';
type OAuthProvider = 'google' | 'facebook';

interface AuthModalProps {
  isOpen: boolean;
  mode: AuthMode;
  onClose: () => void;
  onModeChange: (mode: AuthMode) => void;
}

export default function AuthModal({ isOpen, mode, onClose, onModeChange }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<OAuthProvider | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const oauthInProgress = useMemo(() => oauthProvider !== null, [oauthProvider]);

  if (!isOpen) {
    return null;
  }

  const resetFeedback = () => {
    setMessage('');
    setError('');
  };

  const getFriendlyAuthError = (authError: unknown) => {
    const fallback = 'Authentication failed. Please try again.';

    if (authError instanceof Error) {
      if (authError.message.toLowerCase().includes('provider is not enabled')) {
        return 'This social login provider is not enabled yet. Enable it in Supabase Authentication > Providers.';
      }

      return authError.message;
    }

    return fallback;
  };

  const handleOAuthSignIn = async (provider: OAuthProvider) => {
    resetFeedback();

    if (!supabase) {
      setError('Supabase auth is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
      return;
    }

    setOauthProvider(provider);

    try {
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
          skipBrowserRedirect: true,
        },
      });

      if (oauthError) {
        throw oauthError;
      }

      if (!data?.url) {
        throw new Error('Unable to start social login. Check your Supabase OAuth provider configuration and redirect URLs.');
      }

      window.location.assign(data.url);
    } catch (authError) {
      setError(getFriendlyAuthError(authError));
      setOauthProvider(null);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFeedback();

    if (!supabase) {
      setError('Supabase auth is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
      return;
    }

    if (mode === 'signup' && fullName.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (signUpError) {
          throw signUpError;
        }

        setMessage('Signup successful. Please check your email to verify your account.');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });

        if (signInError) {
          throw signInError;
        }

        setMessage('Login successful.');
        onClose();
      }
    } catch (authError) {
      setError(getFriendlyAuthError(authError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
            aria-label="Close authentication dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 rounded-lg bg-gray-800 p-1">
          <button
            type="button"
            onClick={() => {
              onModeChange('login');
              resetFeedback();
            }}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              mode === 'login' ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              onModeChange('signup');
              resetFeedback();
            }}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              mode === 'signup' ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            Sign Up
          </button>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleOAuthSignIn('google')}
            disabled={isSubmitting || oauthInProgress}
            className="w-full rounded-lg border border-gray-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {oauthProvider === 'google' ? 'Redirecting to Google...' : 'Continue with Google'}
          </button>
          <button
            type="button"
            onClick={() => handleOAuthSignIn('facebook')}
            disabled={isSubmitting || oauthInProgress}
            className="w-full rounded-lg border border-gray-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {oauthProvider === 'facebook' ? 'Redirecting to Facebook...' : 'Continue with Facebook'}
          </button>
        </div>

        {!isSupabaseConfigured && (
          <p className="mt-3 text-xs text-amber-300">
            Auth is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable login and sign-up.
          </p>
        )}

        <div className="my-5 flex items-center gap-3 text-xs text-gray-500">
          <div className="h-px flex-1 bg-gray-700"></div>
          OR
          <div className="h-px flex-1 bg-gray-700"></div>
        </div>

        <form className="space-y-3" onSubmit={handleEmailAuth}>
          {mode === 'signup' && (
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Full name"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Email address"
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Password"
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
          />

          <button
            type="submit"
            disabled={isSubmitting || oauthInProgress}
            className="w-full rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
          </button>
        </form>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        {message && <p className="mt-4 text-sm text-green-400">{message}</p>}
      </div>
    </div>
  );
}
