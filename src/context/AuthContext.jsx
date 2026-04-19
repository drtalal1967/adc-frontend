import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const normalizeRole = (roleData) => {
    if (!roleData) return '';
    const name = typeof roleData === 'object' ? roleData.name : roleData;
    return (name || '').toLowerCase();
  };

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      return { ...parsed, role: normalizeRole(parsed.role) };
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      API.get('/auth/me')
        .then(res => {
          const userData = { ...res.data.user, role: normalizeRole(res.data.user.role) };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        })
        .catch(() => {
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const res = await API.post('/auth/login', { email, password });
      const { user: apiUser, token } = res.data;
      
      const userData = { ...apiUser, role: normalizeRole(apiUser.role) };
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      setError('');
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const checkPermission = (module, action) => {
    if (!user || !user.permissions) return false;
    const perm = user.permissions.find(p => p.module === module);
    if (!perm) return false;
    
    const act = action.toLowerCase();
    if (act === 'view') return perm.canView;
    if (act === 'create') return perm.canCreate;
    if (act === 'update' || act === 'edit') return perm.canUpdate;
    if (act === 'delete') return perm.canDelete;
    if (act === 'export') return perm.canExport;
    return false;
  };

  const updateUser = (data) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      if (data.role) updated.role = normalizeRole(data.role);
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, checkPermission, error, setError, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
