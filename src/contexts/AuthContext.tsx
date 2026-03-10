import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_BASE } from '@/lib/api';

interface AuthContextValue {
  user: any | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  hasPermission: (permission: string) => boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: any }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const SUPER_ADMIN_EMAILS = ['munya@immigrationspecialists.co.za', 'robert@immigrationspecialists.co.za'];

  const computeIsAdmin = (u: any | null) => {
    if (!u || !u.email) return false;
    return u.email.toLowerCase().endsWith('@immigrationspecialists.co.za');
  };

  const computeIsSuperAdmin = (u: any | null) => {
    if (!u) return false;
    // Check the is_super_admin field from the database
    // Fallback to email check for backwards compatibility during transition
    if (u.is_super_admin === true) return true;
    if (!u.email) return false;
    return SUPER_ADMIN_EMAILS.includes(u.email.toLowerCase());
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    // Super admins have all permissions
    if (computeIsSuperAdmin(user)) return true;
    // Check if user has the specific permission
    return Array.isArray(user.permissions) && user.permissions.includes(permission);
  };

  const login = async (email: string, password: string) => {
    // Only allow emails from specific domain
    if (!email.toLowerCase().endsWith('@immigrationspecialists.co.za')) {
      return { error: { message: 'Email domain not allowed' } };
    }

    try {
      const r = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const json = await r.json().catch(() => null);
      if (!r.ok) return { error: json || { message: 'Login failed' } };
      setUser(json.user || null);
      try { localStorage.setItem('smssa_user', JSON.stringify(json.user || null)); localStorage.setItem('userEmail', json.user?.email || email); } catch (e) {}
      return {};
    } catch (err) {
      return { error: err };
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: 'POST' }).catch(() => {});
    } catch (e) {}
    setUser(null);
    try { localStorage.removeItem('smssa_user'); localStorage.removeItem('userEmail'); } catch (e) {}
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Read persisted user from localStorage if present
        const s = localStorage.getItem('smssa_user');
        if (s) setUser(JSON.parse(s));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const value: AuthContextValue = {
    user,
    isAdmin: computeIsAdmin(user),
    isSuperAdmin: computeIsSuperAdmin(user),
    hasPermission,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
