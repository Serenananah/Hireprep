//pages/AuthPages.tsx
import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import { User } from '../types';
import { authService } from '../services/authService';
import { UserPlus, LogIn, AlertCircle, ArrowRight } from 'lucide-react';

interface AuthPageProps {
  onLogin: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true); // Toggle between Login and Register
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');

  const clearForm = () => {
    setError(null);
    setPassword('');
    setConfirmPassword('');
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    clearForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let user: User;
      
      if (isLogin) {
        // Login Logic
        user = await authService.login(email, password);
      } else {
        // Register Logic
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters.");
        }
        if (!name.trim()) {
           throw new Error("Name is required.");
        }
        user = await authService.register(name, email, password);
      }

      onLogin(user);

    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full px-4 animate-fade-in">
      <GlassCard className="w-full max-w-md p-0 overflow-hidden relative">
        
        {/* Header Section */}
        <div className="p-8 pb-6 border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 mb-4 mx-auto shadow-[0_0_15px_rgba(37,99,235,0.3)]">
            {isLogin ? <LogIn className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
          </div>
          <h2 className="text-2xl font-bold text-white text-center">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-gray-400 mt-2 text-center text-sm">
            {isLogin ? 'Enter your credentials to continue' : 'Join Hireprep to start practicing'}
          </p>
        </div>

        {/* Form Section */}
        <div className="p-8 pt-6">
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-300 text-sm animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-1 animate-fade-in-up">
                <label className="block text-xs font-bold text-blue-300 uppercase tracking-wider ml-1">Full Name</label>
                <input
                  type="text"
                  required={!isLogin}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-input placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 transition-all"
                  placeholder="e.g. Alex Chen"
                />
              </div>
            )}
            
            <div className="space-y-1">
              <label className="block text-xs font-bold text-blue-300 uppercase tracking-wider ml-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass-input placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 transition-all"
                placeholder="alex@example.com"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-blue-300 uppercase tracking-wider ml-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass-input placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 transition-all"
                placeholder="••••••••"
              />
            </div>

            {!isLogin && (
              <div className="space-y-1 animate-fade-in-up">
                <label className="block text-xs font-bold text-blue-300 uppercase tracking-wider ml-1">Confirm Password</label>
                <input
                  type="password"
                  required={!isLogin}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-input placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 transition-all"
                  placeholder="••••••••"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-900/30 transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? (
                <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Switch */}
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-gray-400 text-sm">
              {isLogin ? "Don't have an account yet?" : "Already have an account?"}
              <button 
                onClick={toggleMode}
                className="ml-2 text-blue-400 hover:text-blue-300 font-bold hover:underline transition-all"
              >
                {isLogin ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          </div>
        </div>
      </GlassCard>
      
      <p className="mt-6 text-xs text-gray-500 text-center max-w-sm">
        <span className="font-bold text-gray-400">Secure Environment:</span><br/>
        User data is encrypted and stored locally in your browser's secure storage.
      </p>
    </div>
  );
};

export default AuthPage;
