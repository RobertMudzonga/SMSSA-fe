import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!email.toLowerCase().endsWith('@immigrationspecialists.co.za')) {
        toast({ title: 'Only @immigrationspecialists.co.za emails allowed', variant: 'destructive' });
        setLoading(false);
        return;
      }
      const resp = await login(email, password);
      if (resp?.error) {
        toast({ title: 'Login failed', description: resp.error.message || 'Check credentials', variant: 'destructive' });
      } else {
        toast({ title: 'Logged in' });
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Sign in</h2>
        <p className="text-sm text-gray-500 mb-6">Only company emails allowed</p>
        <label className="block mb-3">
          <div className="text-sm mb-1">Email</div>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@immigrationspecialists.co.za" />
        </label>
        <label className="block mb-4">
          <div className="text-sm mb-1">Password</div>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
        </label>
        <div className="flex justify-end">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/signup')}>Create account</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
