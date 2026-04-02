import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, SubscriptionInfo } from '../types/auth';

interface AuthContextType {
  user: User | null;
  subscription: SubscriptionInfo | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  startCheckout: (priceId: string) => Promise<{ success: boolean; checkoutUrl?: string; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'priv8sus_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(true);

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(url, { ...options, headers });
    return res.json();
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setSubscription(null);
  };

  const refreshUser = async () => {
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const data = await fetchWithAuth('/api/auth/me');
      if (data.success) {
        setUser(data.user);
      } else {
        logout();
      }
    } catch {
      logout();
    }
    setIsLoading(false);
  };

  const refreshSubscription = async () => {
    if (!token) {
      setSubscription(null);
      return;
    }
    try {
      const data = await fetchWithAuth('/api/subscription');
      if (data.success) {
        setSubscription(data.subscription);
      }
    } catch {
      // Silently fail
    }
  };

  useEffect(() => {
    refreshUser();
  }, [token]);

  useEffect(() => {
    if (user) {
      refreshSubscription();
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: data.error || 'Login failed' };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: data.error || 'Signup failed' };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const startCheckout = async (priceId: string) => {
    try {
      const data = await fetchWithAuth('/api/subscription/checkout', {
        method: 'POST',
        body: JSON.stringify({ priceId }),
      });
      if (data.success && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return { success: true, checkoutUrl: data.checkoutUrl };
      }
      return { success: false, error: data.error || 'Checkout failed' };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      subscription,
      token,
      isLoading,
      login,
      signup,
      logout,
      refreshUser,
      refreshSubscription,
      startCheckout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
