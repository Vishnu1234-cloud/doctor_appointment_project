import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(email, password);
      toast.success('Login successful!');

      if (user?.role === 'doctor') {
        navigate('/doctor/dashboard');
      } else {
        navigate('/patient/dashboard');
      }
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-accent/30 px-4" data-testid="login-page">
      <Card className="w-full max-w-md rounded-3xl border-none shadow-lg" data-testid="login-card">
        <CardHeader>
          <CardTitle className="text-3xl font-serif text-center" data-testid="login-title">
            Welcome Back
          </CardTitle>
          <p className="text-center text-muted-foreground" data-testid="login-subtitle">
            Sign in to your account
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="rounded-xl h-12"
                required
                data-testid="login-email-input"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-xl h-12"
                required
                data-testid="login-password-input"
              />
            </div>

            <Button
              type="submit"
              className="w-full rounded-full h-12"
              disabled={loading}
              data-testid="login-submit-button"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-medium" data-testid="register-link">
              Register here
            </Link>
          </p>

          <p className="text-center text-sm text-muted-foreground mt-2">
            <Link to="/" className="text-primary" data-testid="home-link">
              ← Back to Home
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}