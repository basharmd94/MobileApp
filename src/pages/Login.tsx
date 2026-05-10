import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api_users';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { Input, Button } from '../components';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect to home if user is already authenticated
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'An error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-bg-base relative overflow-hidden">
      {/* Decorative background shapes for mobile aesthetics */}
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-primary opacity-[0.15] rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-secondary-blue opacity-10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex-1 flex flex-col justify-center w-full max-w-[360px] mx-auto px-5 z-10">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[20px] bg-gradient-to-br from-primary to-primary-hover shadow-lg shadow-primary/20 mb-4 text-white text-2xl font-bold">
            P
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-text-main mb-1.5">
            Welcome Back
          </h2>
          <p className="text-sm text-text-secondary">
            Sign in to access your dashboard
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleLogin}>
          {error && (
            <div className="bg-error/10 text-error p-3 rounded-xl text-xs font-medium border border-error/20 flex items-center justify-center text-center animate-in fade-in zoom-in duration-300 gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <Input
              id="username"
              name="username"
              type="text"
              required
              label="Username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            
            <Input
              id="password"
              name="password"
              type="password"
              required
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              rightElement={
                <a href="#" className="text-xs font-bold text-primary hover:text-primary-hover transition-colors">Forgot?</a>
              }
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full"
            >
              Sign In
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-text-secondary font-medium">
            Don't have an account? <a href="#" className="font-bold text-primary hover:text-primary-hover transition-colors">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  );
}
