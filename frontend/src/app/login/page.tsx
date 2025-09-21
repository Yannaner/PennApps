'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <Image
              src="/cryptolab.png"
              alt="CryptoLab Logo"
              width={80}
              height={80}
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="text-4xl font-bold mb-3">
            <span className="bg-gradient-to-r from-blue-300 to-blue-400 bg-clip-text text-transparent">Welcome </span>
            <span className="bg-gradient-to-r from-amber-300 to-amber-400 bg-clip-text text-transparent">Back</span>
          </h1>
          <p className="text-blue-200">Sign in to your CryptoLab account</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl p-8 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-blue-200 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-blue-300/30 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-white placeholder-blue-300/70 backdrop-blur-sm"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-blue-200 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-blue-300/30 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-white placeholder-blue-300/70 backdrop-blur-sm"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-400/30 text-red-200 px-4 py-3 rounded-xl text-sm font-medium backdrop-blur-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-transparent border-2 border-blue-400 text-blue-300 py-3 px-4 rounded-xl font-bold hover:bg-blue-400/10 hover:border-blue-300 hover:text-blue-200 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-blue-300 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Signing In...
                </div>
              ) : (
                'Log in'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-blue-200">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-amber-300 hover:text-amber-200 font-medium transition-colors">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}