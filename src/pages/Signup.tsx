import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.toLowerCase().endsWith('@immigrationspecialists.co.za')) {
      toast({ title: 'Only @immigrationspecialists.co.za emails allowed', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const json = await r.json().catch(() => null);
      if (!r.ok) {
        toast({ title: 'Signup failed', description: json?.error || 'Check details', variant: 'destructive' });
        return;
      }
      toast({ title: 'Signup successful', description: 'Account created (dev). You can now log in.' });
      navigate('/');
    } catch (err) {
      console.error('Signup error', err);
      toast({ title: 'Signup failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Create account</h2>
        <p className="text-sm text-gray-500 mb-6">Use your @immigrationspecialists.co.za email to register</p>

        <label className="block mb-3">
          <div className="text-sm mb-1">Email</div>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@immigrationspecialists.co.za" />
        </label>

        <label className="block mb-3">
          <div className="text-sm mb-1">Password</div>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        </label>

        <label className="block mb-4">
          <div className="text-sm mb-1">Confirm password</div>
          <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" />
        </label>

        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={() => navigate('/')}>Back</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create account'}</Button>
        </div>
      </form>
    </div>
  );
}
