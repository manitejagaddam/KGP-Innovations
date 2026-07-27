import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { useToast } from '../components/Toast';

export default function Login() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modes: 'login', 'register', 'forgot'
  const [mode, setMode] = useState('login');
  
  const { login, register } = useAuth();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (mode === 'forgot') {
        await authApi.forgotPassword(email);
        toast.success('Password reset link sent to your email.');
        setMode('login');
      } else if (mode === 'register') {
        await register(name, email, password);
        toast.success('Successfully registered and logged in!');
      } else {
        await login(email, password);
        toast.success('Successfully logged in!');
      }
    } catch (err) {
      toast.error(err.message || (mode === 'forgot' ? 'Failed to send reset link.' : 'Authentication failed.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Left panel - Branding & Illustration */}
      <div className="hidden lg:flex w-1/2 relative bg-gradient-to-br from-indigo-900 via-gray-900 to-black overflow-hidden flex-col justify-center items-center">
        {/* Animated particles / glow effects */}
        <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
          <div className="absolute w-96 h-96 bg-indigo-500 rounded-full mix-blend-screen filter blur-[100px] top-1/4 -left-20 animate-pulse"></div>
          <div className="absolute w-96 h-96 bg-cyan-500 rounded-full mix-blend-screen filter blur-[100px] bottom-1/4 -right-20 animate-pulse delay-1000"></div>
        </div>

        <div className="z-10 text-center px-10">
          <h1 className="text-5xl font-extrabold tracking-tight text-white mb-6">
            KGP <span className="text-indigo-400">Innovation</span>
          </h1>
          <p className="text-xl text-gray-300 mb-12 max-w-md mx-auto leading-relaxed">
            Next-Generation IoT Platform for Smart Street Light Management & Energy Optimization
          </p>
          
          {/* Glowing Street Light SVG */}
          <svg className="w-64 h-64 mx-auto drop-shadow-[0_0_15px_rgba(99,102,241,0.8)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8 2 4 5 4 9C4 11 5 12.5 6 14C7 15.5 8 18 8 20C8 21.1 8.9 22 10 22H14C15.1 22 16 21.1 16 20C16 18 17 15.5 18 14C19 12.5 20 11 20 9C20 5 16 2 12 2ZM14 20H10V19H14V20ZM14.3 17H9.7C9.3 15.4 8.2 13.9 7.4 12.8C6.5 11.5 6 10.3 6 9C6 6.1 8.2 3.8 11.2 3.8C14.1 3.8 16.3 6.1 16.3 9C16.3 10.3 15.8 11.5 14.9 12.8C14.1 13.9 13 15.4 12.6 17H14.3Z" fill="currentColor" className="text-indigo-400"/>
            <path d="M12 5C10.3 5 9 6.3 9 8C9 8.6 9.4 9 10 9C10.6 9 11 8.6 11 8C11 7.4 11.4 7 12 7C12.6 7 13 6.6 13 6C13 5.4 12.6 5 12 5Z" fill="currentColor" className="text-yellow-300"/>
          </svg>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-900">
        <div className="w-full max-w-md bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-white mb-2">
              {mode === 'forgot' ? 'Reset Password' : mode === 'register' ? 'Create an Account' : 'Welcome Back'}
            </h2>
            <p className="text-gray-400">
              {mode === 'forgot' ? 'Enter your email to receive a reset link.' : mode === 'register' ? 'Sign up for a new account.' : 'Sign in to access your IoT dashboard.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  placeholder="admin@kgpinnovation.com"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember_me"
                    name="remember_me"
                    type="checkbox"
                    className="h-4 w-4 bg-gray-700 border-gray-600 rounded text-indigo-500 focus:ring-indigo-500"
                  />
                  <label htmlFor="remember_me" className="ml-2 block text-sm text-gray-400 cursor-pointer">
                    Remember me
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isSubmitting ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : mode === 'forgot' ? (
                'Send Reset Link'
              ) : mode === 'register' ? (
                'Sign Up'
              ) : (
                'Sign In'
              )}
            </button>
            
            <div className="text-center mt-4 text-sm text-gray-400">
              {mode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="font-medium text-indigo-400 hover:text-indigo-300"
                  >
                    Register here
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="font-medium text-indigo-400 hover:text-indigo-300"
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
}
