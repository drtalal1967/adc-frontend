import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLeaveContext } from '../context/LeaveContext';
import { ROLE_NAV, BRANCHES, MASTER_NAV_ITEMS } from '../data/mockData';
import * as Icons from 'lucide-react';
import API, { BACKEND_URL } from '../api';

const Icon = ({ name, size = 18, className = '' }) => {
  const LucideIcon = Icons[name];
  if (!LucideIcon) return null;
  return <LucideIcon size={size} className={className} />;
};

// Sidebar
function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = useMemo(() => {
    if (!user) return [];
    
    // Generate final navigation list
    const dynamicItems = MASTER_NAV_ITEMS.filter(item => {
      const isAdmin = user.role?.toUpperCase() === 'ADMIN';

      // HIDDEN FOR ADMIN: Special case for work_schedule
      if (item.module === 'work_schedule' && isAdmin) {
        return false;
      }

      if (isAdmin) return true; // Admin sees everything else

      if (!item.module) return true;
      const perm = (user?.permissions || []).find(p => p.module === item.module);
      return perm ? perm.canView : false;
    });

    // If dynamicItems is empty (e.g. permissions not loaded yet), fallback to hardcoded ROLE_NAV
    if (dynamicItems.length === 0) {
      return ROLE_NAV[user.role?.toLowerCase()] || [];
    }

    return dynamicItems;
  }, [user]);

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full bg-[#253f8e] z-50 flex flex-col transition-all duration-300 
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'lg:w-16' : 'lg:w-[240px]'} w-[240px] shadow-2xl`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
          <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center flex-shrink-0 p-1 shadow-sm">
            <img src="/dental-logo-removebg-preview.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className={`${collapsed ? 'lg:hidden' : 'block'} animate-fade-in`}>
            <p className="text-blue-100 text-[11px] leading-snug">Dr. Talal Al-Alawi <br/>Dental Center</p>
          </div>
          <button
            onClick={onToggle}
            className="hidden lg:flex ml-auto text-blue-200 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <Icon name={collapsed ? 'ChevronRight' : 'ChevronLeft'} size={16} />
          </button>
          <button
            onClick={onMobileClose}
            className="lg:hidden ml-auto text-blue-200 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <Icon name="X" size={18} />
          </button>
        </div>


        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-hide py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  if (window.innerWidth < 1024) onMobileClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-[#f58220] text-white shadow-lg shadow-[#f58220]/30'
                    : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
                }`}
                title={collapsed ? item.label : ''}
              >
                <span className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-blue-200'}`}>
                  <Icon name={item.icon} size={20} />
                </span>
                <span className={`${collapsed ? 'lg:hidden' : 'block'} animate-fade-in truncate`}>{item.label}</span>
                {!collapsed && isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white lg:block hidden" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={() => {
              navigate('/settings');
              if (window.innerWidth < 1024) onMobileClose();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-medium text-blue-100/80 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            <Icon name="Settings" size={20} className="text-blue-200" />
            <span className={`${collapsed ? 'lg:hidden' : 'block'}`}>Settings</span>
          </button>
        </div>
      </aside>
    </>
  );
}

// Topbar
function Topbar({ sidebarCollapsed, onMenuToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await API.get('/reminders/notifications');
      const mapped = res.data.map(n => ({
        id: n.id,
        text: n.title + (n.description ? `: ${n.description}` : ''),
        time: new Date(n.createdAt).toLocaleDateString() + ' ' + new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        icon: n.severity === 'critical' ? 'AlertTriangle' : (n.severity === 'warning' ? 'Clock' : 'Bell'),
        color: n.severity === 'critical' ? 'text-rose-500' : (n.severity === 'warning' ? 'text-amber-500' : 'text-blue-500'),
        isRead: n.isRead,
        raw: n
      }));
      setNotifications(mapped);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Polling every 2 minutes
      const interval = setInterval(fetchNotifications, 120000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  useEffect(() => {
    function handler(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowProfile(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAsRead = async (id) => {
    try {
      await API.put(`/reminders/${id}`, { isRead: true });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const lMargin = sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-[240px]';
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className={`fixed top-0 right-0 ${lMargin} left-0 h-16 bg-white/90 backdrop-blur-md border-b border-gray-100 z-50 flex items-center px-4 md:px-5 gap-2 md:gap-4 transition-all duration-300`}>
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg flex-shrink-0"
      >
        <Icon name="Menu" size={18} />
      </button>

      <div className="flex-1"></div>

      <div className="flex items-center gap-1 md:gap-2 ml-auto">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(v => !v)}
            className="btn-icon relative hover:bg-gray-100 p-2"
          >
            <Icon name="Bell" size={18} className="text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger border border-white" />
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 top-12 w-[280px] sm:w-80 bg-white rounded-2xl shadow-lg border border-gray-100 animate-slide-down overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="font-semibold text-gray-800 text-sm">Notifications</p>
                {unreadCount > 0 && <span className="badge badge-primary text-[10px]">{unreadCount} new</span>}
              </div>
              <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                {notifications.length === 0 && (
                  <div className="px-4 py-6 text-center text-sm text-gray-400">No new notifications</div>
                )}
                {notifications.map(n => (
                  <div 
                    key={n.id} 
                    onClick={() => {
                      markAsRead(n.id);
                      if (n.raw.reminderType === 'GENERAL') navigate('/reminders');
                    }}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className={`mt-0.5 ${n.color}`}>
                      <Icon name={n.icon || 'Bell'} size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 leading-snug font-medium line-clamp-2">{n.text}</p>
                      <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-bold">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-gray-100 text-center">
                <button 
                  onClick={() => navigate('/reminders')}
                  className="text-xs text-primary font-medium hover:underline"
                >
                  View all reminders
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowProfile(v => !v)}
            className="flex items-center gap-2 md:gap-2.5 pl-2 pr-2 md:pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-all duration-200"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-teal flex items-center justify-center text-white text-xs font-bold overflow-hidden">
              {user?.profileImage ? (
                <img src={user.profileImage.startsWith('http') ? user.profileImage : `${BACKEND_URL}${user.profileImage}`} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user?.avatar
              )}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-gray-800 leading-none">{(user?.name || 'User').split(' ')[0]}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <Icon name="ChevronDown" size={14} className={`text-gray-400 transition-transform duration-200 ${showProfile ? 'rotate-180' : ''}`} />
          </button>
          {showProfile && (
            <div className="absolute right-0 top-12 w-48 sm:w-52 bg-white rounded-2xl shadow-lg border border-gray-100 animate-slide-down overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="font-semibold text-gray-800 text-sm">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize truncate">{user?.role} • {user?.branch}</p>
              </div>
              {[
                { label: 'Profile', icon: 'User', action: () => navigate('/settings', { state: { openModal: 'profile' } }) },
                { label: 'Change Password', icon: 'Lock', action: () => navigate('/settings', { state: { openModal: 'security' } }) },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => { item.action(); setShowProfile(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                >
                  <Icon name={item.icon} size={15} className="text-gray-400" />
                  {item.label}
                </button>
              ))}
              <div className="border-t border-gray-100">
                <button
                  onClick={() => { logout(); navigate('/login'); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-red-50 transition-colors text-left"
                >
                  <Icon name="LogOut" size={15} className="text-danger" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// Main Layout
export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-background flex overflow-x-hidden relative">
      <Sidebar 
        collapsed={collapsed} 
        onToggle={() => setCollapsed(v => !v)} 
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className={`flex-1 flex flex-col transition-all duration-300 min-w-0
        ${collapsed ? 'lg:ml-16' : 'lg:ml-[240px]'} ml-0
      `}>
        <Topbar 
          sidebarCollapsed={collapsed} 
          onMenuToggle={() => setMobileOpen(true)}
        />
        <main className="flex-1 mt-16 p-3 md:p-5 overflow-x-hidden animate-fade-in w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
