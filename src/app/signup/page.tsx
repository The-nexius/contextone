'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/config';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'signup' | 'verify'>('signup');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Signup failed');
      }

      // Auto-login after signup
      const loginResponse = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        localStorage.setItem('token', loginData.access_token);
        localStorage.setItem('user_id', loginData.user_id);
        router.push('/onboarding');
      } else {
        router.push('/login');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Verification failed');
      }

      const data = await response.json();
      
      // Auto-login after verification
      const loginResponse = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        localStorage.setItem('token', loginData.access_token);
        localStorage.setItem('user_id', loginData.user_id);
        router.push('/onboarding');
      } else {
        router.push('/login');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await fetch(`${API_URL}/api/v1/auth/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      alert('Code resent!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-cyan-400 rounded-full flex items-center justify-center">
              <span className="text-gray-900 font-bold text-lg">C</span>
            </div>
            <span className="text-2xl font-bold text-cyan-400">Context One</span>
          </Link>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            {step === 'signup' ? 'Create your account' : 'Verify your email'}
          </h1>
          <p className="text-gray-400 mb-6">
            {step === 'signup' ? 'Start unifying your AI memory today' : `Enter the code sent to ${email}`}
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {step === 'signup' ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-cyan-400 hover:bg-cyan-300 text-gray-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending code...' : 'Create Account'}
                </button>
              </form>
            </>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-cyan-400 hover:bg-cyan-300 text-gray-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-cyan-400 hover:text-cyan-300 text-sm"
                >
                  Resend code
                </button>
              </div>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => { setStep('signup'); setVerificationSent(false); }}
                  className="text-gray-400 hover:text-white text-sm"
                >
                  ← Back to signup
                </button>
              </div>
            </form>
          )}

          {step === 'signup' && (
            <div className="mt-6 text-center">
              <p className="text-gray-400">
                Already have an account?{' '}
                <Link href="/login" className="text-cyan-400 hover:text-cyan-300">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          <Link href="/" className="hover:text-cyan-400">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}