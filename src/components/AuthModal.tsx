import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Mail, X } from 'lucide-react';
import {
  registerWithEmail,
  sendPasswordReset,
  signInWithEmail,
  signInWithGoogle,
} from '../firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
}

function mapAuthError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('auth/operation-not-allowed')) {
    return 'Email/Password sign-in is not enabled yet in Firebase Console. Enable it under Authentication -> Sign-in method, or use Google Sign-In.';
  }
  if (raw.includes('auth/invalid-credential') || raw.includes('auth/wrong-password')) {
    return 'Incorrect email address or password.';
  }
  if (raw.includes('auth/user-not-found')) {
    return 'No account found with this email address. Switch to Create Account to register.';
  }
  if (raw.includes('auth/email-already-in-use')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (raw.includes('auth/weak-password')) {
    return 'Password must be at least 6 characters long.';
  }
  if (raw.includes('auth/invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (raw.includes('auth/popup-closed-by-user')) {
    return 'Google sign-in popup was closed before completing.';
  }
  if (raw.includes('auth/too-many-requests')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  return raw;
}

export function AuthModal({ isOpen, onClose, onAuthenticated }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'register' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setNotice(null);
    setIsLoading(true);
    try {
      await signInWithGoogle();
      onAuthenticated();
      onClose();
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!email.trim()) {
      setError('Enter your email address.');
      return;
    }

    if (mode !== 'reset' && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'reset') {
        await sendPasswordReset(email);
        setNotice('Password reset link sent. Check your email inbox.');
      } else if (mode === 'register') {
        await registerWithEmail(email, password);
        onAuthenticated();
        onClose();
      } else {
        await signInWithEmail(email, password);
        onAuthenticated();
        onClose();
      }
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 sm:p-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="auth-modal-title" className="text-xl font-semibold text-slate-900">
              {mode === 'signin'
                ? 'Sign in to Calibre Repair'
                : mode === 'register'
                  ? 'Create Customer Account'
                  : 'Reset Password'}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {mode === 'reset'
                ? 'Receive a password reset email for your account.'
                : 'Sign in with Google or use your email address and password.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sign-in dialog"
            className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-700 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700 mt-0.5" />
            <span>{notice}</span>
          </div>
        )}

        {mode !== 'reset' && (
          <>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 min-h-[44px] text-sm font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-60 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <div className="h-px flex-1 bg-slate-200" />
              <span>or use email address</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
          </>
        )}

        <form onSubmit={handleEmailSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="auth-email" className="block text-xs font-medium text-slate-700 mb-1.5">
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700"
            />
          </div>

          {mode !== 'reset' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="auth-password" className="block text-xs font-medium text-slate-700">
                  Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('reset');
                      setError(null);
                      setNotice(null);
                    }}
                    className="text-xs font-medium text-blue-700 hover:text-blue-800 cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-60 transition-colors cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
            <span>
              {mode === 'signin'
                ? 'Sign In with Email'
                : mode === 'register'
                  ? 'Create Account'
                  : 'Send Reset Link'}
            </span>
          </button>
        </form>

        <div className="pt-2 border-t border-slate-100 text-center text-xs text-slate-600">
          {mode === 'signin' ? (
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
                setNotice(null);
              }}
              className="font-medium text-blue-700 hover:text-blue-800 cursor-pointer"
            >
              New customer? Create an account with email
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
                setNotice(null);
              }}
              className="font-medium text-blue-700 hover:text-blue-800 cursor-pointer"
            >
              Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
