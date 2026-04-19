import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { User, Lock, Bell, Database, Globe, Shield, CreditCard, HelpCircle, X, Camera, Save, Download, RefreshCw, Key, ShieldCheck, Mail, MapPin, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API, { BACKEND_URL } from '../api';
import { exportToCSV } from '../utils/exportUtils';
import { VENDORS, EMPLOYEES, LAB_CASES, EXPENSES, ROLE_PERMISSIONS, SYSTEM_CONFIG, REMINDER_SETTINGS, SUBSCRIPTION_INFO } from '../data/mockData';
import * as XLSX from 'xlsx';

const Icon = ({ name, size = 18, className = '' }) => {
  const LucideIcon = Icons[name];
  if (!LucideIcon) return null;
  return <LucideIcon size={size} className={className} />;
};

function SettingModal({ title, subtitle, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-xl animate-scale-in overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-header p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="text-white/70 text-xs mt-1">{subtitle}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  const { user, updateUser } = useAuth();
  const location = useLocation();
  const [activeModal, setActiveModal] = useState(null);
  const [success, setSuccess] = useState(null);
  const [backupLoading, setBackupLoading] = useState(false);
  const fileInputRef = useRef(null);

  const isAdmin = ['ADMIN', 'MANAGER'].includes(user?.role?.toUpperCase());

  const handleDownloadBackup = async () => {
    setBackupLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/backup/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backup API error response:', errorText);
        throw new Error(`Server returned ${response.status}: ${errorText.substring(0, 100)}`);
      }

      const backupData = await response.json();
      
      const wb = XLSX.utils.book_new();

      // Add summary sheet
      if (backupData.summary) {
        const summaryArr = Object.entries(backupData.summary).map(([key, count]) => ({ Module: key, Count: count }));
        const wsSummary = XLSX.utils.json_to_sheet(summaryArr);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
      }

      // Add data sheets
      if (backupData.data) {
        for (const [key, items] of Object.entries(backupData.data)) {
          if (Array.isArray(items) && items.length > 0) {
            const ws = XLSX.utils.json_to_sheet(items);
            XLSX.utils.book_append_sheet(wb, ws, key.substring(0, 31)); // excel sheet names max 31 chars
          } else {
            const ws = XLSX.utils.json_to_sheet([{ Info: 'No records found' }]);
            XLSX.utils.book_append_sheet(wb, ws, key.substring(0, 31));
          }
        }
      }

      XLSX.writeFile(wb, `dental_backup_${new Date().toISOString().split('T')[0]}.xlsx`);

      showSuccess('Excel backup downloaded successfully!');
    } catch (err) {
      console.error('Full Backup Error Details:', err);
      alert(`Failed to download backup: ${err.message}. Please check console for details.`);
    } finally {
      setBackupLoading(false);
    }
  };

  useEffect(() => {
    if (location.state?.openModal) {
      setActiveModal(location.state.openModal);
    }
  }, [location.state]);

  // Profile State
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    photo: null
  });

  useEffect(() => {
    if (user) {
      setProfileForm(f => ({
        ...f,
        name: user.name || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  // Admin states
  const [rolesList, setRolesList] = useState([]);
  const [permissions, setPermissions] = useState({}); // { [roleId]: { [module]: ['view', 'create', ...] } }
  const [activeRole, setActiveRole] = useState(null); // This will hold the role object
  const [sysConfig, setSysConfig] = useState(SYSTEM_CONFIG);
  const [reminderConfig, setReminderConfig] = useState(REMINDER_SETTINGS);
  const [subscription] = useState(SUBSCRIPTION_INFO);

  const fetchRoles = async () => {
    try {
      const resp = await fetch(`${BACKEND_URL}/api/permissions/roles`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await resp.json();
      setRolesList(data);
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  const fetchPermissions = async (roleId) => {
    try {
      const resp = await fetch(`${BACKEND_URL}/api/permissions/${roleId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await resp.json();
      
      // Transform API array to UI object structure
      const mapped = {};
      data.forEach(p => {
        const pList = [];
        if (p.canView) pList.push('view');
        if (p.canCreate) pList.push('create');
        if (p.canUpdate) pList.push('edit');
        if (p.canDelete) pList.push('delete');
        if (p.canExport) pList.push('export');
        mapped[p.module] = pList;
      });

      setPermissions(prev => ({ ...prev, [roleId]: mapped }));
    } catch (err) {
      console.error('Error fetching permissions:', err);
    }
  };

  useEffect(() => {
    if (isAdmin && activeModal === 'roles') {
      fetchRoles();
    }
  }, [activeModal]);

  useEffect(() => {
    if (activeRole && !permissions[activeRole.id]) {
      fetchPermissions(activeRole.id);
    }
  }, [activeRole]);

  const savePermissions = async () => {
    if (!activeRole) return;
    try {
      const rolePerms = permissions[activeRole.id];
      const apiPayload = Object.keys(rolePerms).map(module => {
        const pList = rolePerms[module];
        return {
          module,
          canView: pList.includes('view'),
          canCreate: pList.includes('create'),
          canUpdate: pList.includes('edit'),
          canDelete: pList.includes('delete'),
          canExport: pList.includes('export')
        };
      });

      const resp = await fetch(`${BACKEND_URL}/api/permissions/${activeRole.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ permissions: apiPayload })
      });

      if (resp.ok) {
        showSuccess(`Updated permissions for ${activeRole.name}`);
        setActiveRole(null);
      }
    } catch (err) {
      console.error('Error saving permissions:', err);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', profileForm.name);
      formData.append('email', profileForm.email);
      if (fileInputRef.current?.files[0]) {
        formData.append('profileImage', fileInputRef.current.files[0]);
      }

      const resp = await API.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (resp.data.user) {
        updateUser(resp.data.user);
        showSuccess('Profile updated successfully!');
        setActiveModal(null);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      alert(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handlePhotoClick = () => fileInputRef.current?.click();
  
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validation: Image type and size
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        alert('Invalid file type. Only JPG, JPEG and PNG are allowed.');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        alert('File is too large. Max size is 2MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => setProfileForm(prev => ({ ...prev, photo: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const [branches, setBranches] = useState([
    { id: 1, name: 'Tubli Branch', addr: 'Block 711, Tubli, Bahrain', phone: '+973 1723 4567', hours: '08:00 - 22:00', active: true, staffCount: 12, manager: 'Sarah Johnson' },
    { id: 2, name: 'Manama Branch', addr: 'Government Ave, Manama', phone: '+973 1787 6543', hours: '09:00 - 18:00', active: true, staffCount: 5, manager: 'Ahmed Al-Rashid' },
  ]);
  const [editingBranch, setEditingBranch] = useState(null);

  const handleBranchToggle = (id) => {
    setBranches(prev => prev.map(b => b.id === id ? { ...b, active: !b.active } : b));
  };

  const handleBranchEdit = (branch) => {
    setEditingBranch({ ...branch });
  };

  const deleteBranch = (id) => {
    setBranches(prev => prev.filter(b => b.id !== id));
    showSuccess('Branch removed successfully');
  };

  const saveBranch = (e) => {
    e.preventDefault();
    if (editingBranch.id) {
       setBranches(prev => prev.map(b => b.id === editingBranch.id ? editingBranch : b));
    } else {
       setBranches(prev => [...prev, { ...editingBranch, id: Date.now(), active: true, staffCount: 0 }]);
    }
    setEditingBranch(null);
    showSuccess(editingBranch.id ? 'Branch updated!' : 'Branch created!');
  };

  const settingsGroups = [
    {
      title: 'Account Settings',
      items: [
        { id: 'profile', icon: User, label: 'Profile Information', desc: 'Update your name, email and photo' },
        { id: 'security', icon: Lock, label: 'Password & Security', desc: 'Change password and enable 2FA' },
      ]
    },
    ...(isAdmin ? [
      {
        title: 'Clinic Administration',
        items: [
          { id: 'data', icon: Database, label: 'Data Management & Backup', desc: 'Download a full backup of all clinic data' },
          { id: 'roles', icon: Shield, label: 'Permissions', desc: 'Define access for different user roles' },
        ]
      },
      /*
      {
        title: 'Billing',
        items: [
          { id: 'billing', icon: CreditCard, label: 'Subscription & Invoices', desc: 'Manage your SaaS plan and payments' },
        ]
      }
      */
    ] : [])
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-10">
      {success && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-slide-down font-bold">
          <ShieldCheck size={20} /> {success}
        </div>
      )}

      <div>
        <h1 className="section-title">Settings</h1>
        <p className="section-subtitle">Manage your account and platform configurations</p>
      </div>

      <div className="card flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 bg-gradient-sidebar text-white border-none shadow-xl shadow-slate-200 p-6 md:p-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
        <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center text-4xl font-black border border-white/20 flex-shrink-0 shadow-2xl relative group overflow-hidden">
          {user?.profileImage ? (
            <img src={user.profileImage.startsWith('http') ? user.profileImage : `${BACKEND_URL}${user.profileImage}`} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            user?.avatar
          )}
          <button onClick={handlePhotoClick} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera size={24} />
          </button>
        </div>
        <div className="flex-1 relative z-10">
          <h2 className="text-2xl font-black tracking-tight">{user?.name}</h2>
          <p className="text-white/60 text-sm font-semibold uppercase tracking-widest mt-1">{user?.role} • {user?.branch}</p>
          <div className="mt-6 flex flex-wrap justify-center sm:justify-start gap-3">
            <button onClick={() => setActiveModal('profile')} className="px-5 py-2 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-600 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/25 border border-primary-400/30">
              Edit Public Profile
            </button>
            <button onClick={() => setActiveModal('security')} className="px-5 py-2 bg-white/10 text-white text-xs font-bold rounded-xl hover:bg-white/20 transition-all border border-white/10 backdrop-blur-sm">
              Security Logs
            </button>
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />

      <div className="space-y-8 mt-10">
        {settingsGroups.map((group, i) => (
          <div key={i} className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 drop-shadow-sm">{group.title}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              {group.items.map((item, j) => (
                <div key={j} onClick={() => setActiveModal(item.id)} className="card card-hover flex items-center gap-5 cursor-pointer bg-white group border-transparent hover:border-primary/20 p-4 rounded-[2rem]">
                  <div className="w-12 h-12 rounded-[1.25rem] bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300 shadow-sm">
                    <item.icon size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-800 tracking-tight group-hover:text-primary transition-colors">{item.label}</p>
                    <p className="text-xs text-slate-500 font-medium truncate">{item.desc}</p>
                  </div>
                  <div className="text-slate-200 group-hover:text-primary group-hover:translate-x-1 transition-all">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* MODALS */}
      {activeModal === 'profile' && (
        <SettingModal title="Profile Information" subtitle="Keep your professional details up to date" onClose={() => setActiveModal(null)}>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="flex items-center gap-6 mb-6 p-4 bg-slate-50 rounded-3xl border border-slate-100">
               <div className="relative group cursor-pointer" onClick={handlePhotoClick}>
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold overflow-hidden border-2 border-white shadow-xl">
                    {profileForm.photo ? (
                      <img src={profileForm.photo} className="w-full h-full object-cover" alt="Avatar" />
                    ) : user?.profileImage ? (
                      <img src={user.profileImage.startsWith('http') ? user.profileImage : `${BACKEND_URL}${user.profileImage}`} className="w-full h-full object-cover" alt="Avatar" />
                    ) : (
                      user?.avatar
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                    <Camera size={20} className="text-white" />
                  </div>
               </div>
               <div>
                 <p className="text-sm font-bold text-slate-800">Profile Picture</p>
                 <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">Recommended: 200x200px PNG</p>
               </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="input-label text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1.5 block">Full Display Name</label>
                <input required value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} className="input font-bold" />
              </div>
              <div>
                <label className="input-label text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1.5 block">Professional Email</label>
                <input type="email" required value={profileForm.email} onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))} className="input font-bold" />
              </div>
            </div>
            <div className="pt-4 flex justify-end gap-3">
              <button type="button" onClick={() => setActiveModal(null)} className="btn-ghost font-bold text-xs uppercase tracking-widest px-6">Cancel</button>
              <button type="submit" className="btn-primary px-8 font-black text-xs uppercase tracking-widest py-3">Save Changes</button>
            </div>
          </form>
        </SettingModal>
      )}

      {activeModal === 'security' && (
        <SettingModal title="Password & Security" subtitle="Manage your digital fortress" onClose={() => setActiveModal(null)}>
          <div className="space-y-6">
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
              <Key size={18} className="text-rose-500 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-rose-800">Password Security</p>
                <p className="text-[10px] text-rose-600 font-medium leading-relaxed">It's been 124 days since your last password update. We recommend changing it for better clinic security.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="input-label text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Current Password</label>
                <input type="password" id="currentPassword" placeholder="••••••••" className="input" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="input-label text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">New Password</label>
                  <input type="password" id="newPassword" placeholder="Min. 6 chars" className="input" />
                </div>
                <div>
                  <label className="input-label text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Confirm New</label>
                  <input type="password" id="confirmNewPassword" placeholder="Must match" className="input" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Two-Factor Auth</p>
                  <p className="text-[10px] text-slate-500">Secure logins via mobile app</p>
                </div>
              </div>
              <div className="w-12 h-6 rounded-full p-1 bg-slate-200 cursor-not-allowed opacity-50">
                <div className="w-4 h-4 bg-white rounded-full shadow-md" />
              </div>
            </div>
            <div className="pt-2 flex justify-end text-right">
              <button 
                onClick={async () => { 
                  const currentPassword = document.getElementById('currentPassword').value;
                  const newPassword = document.getElementById('newPassword').value;
                  const confirmNewPassword = document.getElementById('confirmNewPassword').value;

                  if (!currentPassword || !newPassword) {
                    alert('Please fill in password fields');
                    return;
                  }
                  if (newPassword !== confirmNewPassword) {
                    alert('Passwords do not match');
                    return;
                  }
                  if (newPassword.length < 6) {
                    alert('New password must be at least 6 characters');
                    return;
                  }

                  try {
                    await API.put('/auth/change-password', { currentPassword, newPassword });
                    showSuccess('Security settings updated!'); 
                    setActiveModal(null); 
                  } catch (err) {
                    alert(err.response?.data?.message || 'Failed to change password');
                  }
                }} 
                className="btn-primary w-full sm:w-auto font-black text-xs uppercase tracking-[0.2em] py-3.5 px-10 shadow-lg shadow-primary/25 translate-y-0 active:translate-y-1 transition-all"
              >
                Update Credentials
              </button>
            </div>
          </div>
        </SettingModal>
      )}

      {activeModal === 'data' && (
        <SettingModal title="Data Management & Backup" subtitle="Download a secure copy of all your clinic data" onClose={() => setActiveModal(null)}>
          <div className="space-y-5">
            {/* What's included */}
            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 space-y-3">
              <p className="text-xs font-black text-slate-700 uppercase tracking-widest">Backup Includes</p>
              <div className="grid grid-cols-2 gap-2">
                {['Employees', 'Vendors', 'Laboratories', 'Lab Cases', 'Expenses', 'Payments', 'Documents', 'Reminders', 'Leave Requests', 'Schedules'].map(item => (
                  <div key={item} className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Download button */}
            <button
              onClick={handleDownloadBackup}
              disabled={backupLoading}
              className="w-full py-4 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {backupLoading ? (
                <><RefreshCw size={18} className="animate-spin" /> Preparing Backup...</>
              ) : (
                <><Download size={18} /> Download Full Backup (Excel)</>
              )}
            </button>

            {/* Info note */}
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
              <div className="flex items-start gap-3">
                <Shield size={16} className="text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-blue-800">About Backup Files</p>
                  <p className="text-[11px] text-blue-600 font-medium leading-relaxed mt-1">The backup file is in Excel format with multiple sheets for each module. You can open and view it easily on your computer.</p>
                </div>
              </div>
            </div>
          </div>
        </SettingModal>
      )}

      {activeModal === 'branch' && (
        <SettingModal title="Branch Settings" subtitle="Configure location details and operational hours" onClose={() => { setActiveModal(null); setEditingBranch(null); }}>
          {editingBranch ? (
            <form onSubmit={saveBranch} className="space-y-4 animate-scale-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Location Name</label>
                  <input required value={editingBranch.name} onChange={e => setEditingBranch(b => ({ ...b, name: e.target.value }))} className="input font-bold" placeholder="e.g. East Branch" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Operating Hours</label>
                  <input required value={editingBranch.hours} onChange={e => setEditingBranch(b => ({ ...b, hours: e.target.value }))} className="input font-bold" placeholder="09:00 - 21:00" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Phone Number</label>
                  <input required value={editingBranch.phone} onChange={e => setEditingBranch(b => ({ ...b, phone: e.target.value }))} className="input font-bold" placeholder="+966-50..." />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Assigned Manager</label>
                  <input value={editingBranch.manager || ''} onChange={e => setEditingBranch(b => ({ ...b, manager: e.target.value }))} className="input font-bold" placeholder="Manager Name" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Full Address</label>
                  <textarea required value={editingBranch.addr} onChange={e => setEditingBranch(b => ({ ...b, addr: e.target.value }))} className="input font-bold min-h-[80px] py-3" placeholder="Street, District, City" />
                </div>
              </div>
              <div className="pt-4 flex justify-between items-center">
                {editingBranch.id && (
                  <button type="button" onClick={() => deleteBranch(editingBranch.id)} className="text-danger text-xs font-bold hover:underline flex items-center gap-1">
                    <X size={14} /> Remove Branch
                  </button>
                )}
                <div className="flex gap-3 ml-auto">
                  <button type="button" onClick={() => setEditingBranch(null)} className="btn-ghost font-bold text-xs uppercase tracking-widest px-6">Cancel</button>
                  <button type="submit" className="btn-primary px-8 font-black text-xs uppercase tracking-widest py-3">Save Location</button>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {branches.map((br) => (
                <div key={br.id} className={`group p-5 rounded-[2.5rem] border-2 transition-all relative overflow-hidden ${br.active ? 'bg-white border-primary shadow-xl shadow-primary/5' : 'bg-slate-50 border-slate-100'}`}>
                  {br.active && <div className="absolute top-0 right-0 px-6 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-bl-3xl shadow-lg">Active</div>}
                  
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-4">
                       <div className={`w-14 h-14 rounded-3xl flex items-center justify-center transition-all ${br.active ? 'bg-primary/10 text-primary shadow-inner' : 'bg-slate-200 text-slate-400'}`}>
                         <MapPin size={24} />
                       </div>
                       <div>
                         <h4 className={`text-lg font-black tracking-tight ${br.active ? 'text-slate-800' : 'text-slate-500'}`}>{br.name}</h4>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{br.staffCount} Team Members Assigned</p>
                       </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/50 border border-black/5">
                      <Clock size={16} className="text-primary/60" />
                      <span className="text-xs font-bold text-slate-600">{br.hours}</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/50 border border-black/5">
                      <Mail size={16} className="text-primary/60" />
                      <span className="text-xs font-bold text-slate-600 truncate">{br.addr}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-black/5">
                    <button onClick={() => handleBranchEdit(br)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors flex items-center gap-2">
                       <ShieldCheck size={14} /> Edit Configuration
                    </button>
                    <div 
                      onClick={() => handleBranchToggle(br.id)}
                      className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all duration-500 relative ${br.active ? 'bg-primary' : 'bg-slate-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow-lg transition-transform duration-500 ${br.active ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                  </div>
                </div>
              ))}
              <button 
                onClick={() => setEditingBranch({ name: '', addr: '', phone: '', hours: '' })}
                className="w-full py-5 border-3 border-dashed border-slate-200 rounded-[2.5rem] text-slate-300 font-black text-xs uppercase tracking-[0.2em] hover:border-primary hover:text-primary hover:bg-primary/5 transition-all group flex flex-col items-center gap-2"
              >
                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Globe size={20} />
                </div>
                Add Registration
              </button>
            </div>
          )}
        </SettingModal>
      )}

      {activeModal === 'roles' && (
        <SettingModal title="Role Permissions" subtitle="Control platform access with granular precision" onClose={() => { setActiveModal(null); setActiveRole(null); }}>
          {activeRole ? (
            <div className="space-y-6 animate-scale-in">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setActiveRole(null)} className="text-primary font-bold text-xs uppercase tracking-widest flex items-center gap-1 hover:underline">
                  <Icon name="ChevronLeft" size={14} /> Back to Roles
                </button>
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest border-l-4 border-primary pl-3">Configuring: {activeRole.name}</h4>
              </div>

              <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4 scrollbar-hide">
                {permissions[activeRole.id] && Object.keys(permissions[activeRole.id]).map((module) => (
                  <div key={module} className="p-4 rounded-3xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-black text-slate-800 uppercase tracking-widest capitalize">{module.replace(/([A-Z]|_)/g, ' $1')}</p>
                      <button 
                        type="button"
                        onClick={() => {
                          const allPermissions = ['view', 'create', 'edit', 'delete', 'export'];
                          const current = permissions[activeRole.id][module];
                          const isAll = allPermissions.every(p => current.includes(p));
                          setPermissions(prev => ({
                            ...prev,
                            [activeRole.id]: {
                              ...prev[activeRole.id],
                              [module]: isAll ? [] : allPermissions
                            }
                          }));
                        }}
                        className="text-[10px] font-bold text-primary hover:underline"
                      >
                        Toggle All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['view', 'create', 'edit', 'delete', 'export'].map((perm) => {
                        const isSelected = permissions[activeRole.id][module].includes(perm);
                        return (
                          <button
                            key={perm}
                            onClick={() => {
                              setPermissions(prev => {
                                const current = prev[activeRole.id][module];
                                const next = isSelected 
                                  ? current.filter(p => p !== perm)
                                  : [...current, perm];
                                return {
                                  ...prev,
                                  [activeRole.id]: {
                                    ...prev[activeRole.id],
                                    [module]: next
                                  }
                                };
                              });
                            }}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                              isSelected 
                                ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' 
                                : 'bg-white text-slate-400 border-slate-100 hover:border-primary/30'
                            }`}
                          >
                            {perm}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-2 flex justify-end">
                <button 
                  onClick={savePermissions} 
                  className="btn-primary w-full py-3.5 font-black text-xs uppercase tracking-widest"
                >
                  Apply Permission Set
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
               {rolesList.map((r) => (
                 <div key={r.id} onClick={() => setActiveRole(r)} className="flex flex-col p-4 rounded-3xl bg-white border border-slate-100 hover:shadow-xl hover:border-primary/20 transition-all cursor-pointer group">
                   <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-slate-100 group-hover:scale-110 transition-transform`}>
                      <ShieldCheck size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-slate-800 tracking-tight">{r.name}</p>
                      <p className="text-[10px] font-bold text-slate-400">{r._count?.users || 0} users assigned</p>
                    </div>
                   </div>
                   <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{r.description}</p>
                 </div>
               ))}
            </div>
          )}
        </SettingModal>
      )}

      {activeModal === 'system' && (
        <SettingModal title="System Configuration" subtitle="Manage surgical and operational classifications" onClose={() => setActiveModal(null)}>
          <div className="space-y-6">
            <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
              {['prosthesisTypes', 'vendorCategories', 'expenseCategories'].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveRole(tab)} // Reusing activeRole for tab state
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${(!activeRole && tab === 'prosthesisTypes') || activeRole === tab ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
                >
                  {tab.replace(/([A-Z])/g, ' $1')}
                </button>
              ))}
            </div>
            
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
              {(sysConfig[activeRole || 'prosthesisTypes'] || []).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-2xl group">
                  <span className="text-sm font-bold text-slate-800">{item}</span>
                  <button 
                    onClick={() => {
                      const tab = activeRole || 'prosthesisTypes';
                      setSysConfig(prev => ({
                        ...prev,
                        [tab]: prev[tab].filter((_, i) => i !== idx)
                      }));
                    }}
                    className="p-1.5 text-slate-300 hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <input 
                id="newCategoryInput"
                placeholder="Enter new label..." 
                className="flex-1 input text-xs font-bold" 
                onKeyDown={e => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    const tab = activeRole || 'prosthesisTypes';
                    setSysConfig(prev => ({ ...prev, [tab]: [...prev[tab], e.target.value.trim()] }));
                    e.target.value = '';
                  }
                }}
              />
              <button 
                onClick={() => {
                  const input = document.getElementById('newCategoryInput');
                  if (input.value.trim()) {
                     const tab = activeRole || 'prosthesisTypes';
                     setSysConfig(prev => ({ ...prev, [tab]: [...prev[tab], input.value.trim()] }));
                     input.value = '';
                  }
                }}
                className="btn-primary w-12 flex items-center justify-center rounded-xl"
              >
                <Icon name="Plus" size={20} />
              </button>
            </div>
          </div>
        </SettingModal>
      )}

      {activeModal === 'reminder_config' && (
        <SettingModal title="Reminder Settings" subtitle="Configure system-wide alert thresholds" onClose={() => setActiveModal(null)}>
          <div className="space-y-4">
            {Object.keys(reminderConfig).map((key) => (
              <div key={key} className="p-4 bg-slate-50 border border-slate-100 rounded-[2rem] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      <Icon name={key.includes('Expiry') ? 'Clock' : 'Package'} size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{reminderConfig[key].notifyType}</p>
                    </div>
                  </div>
                  <div 
                    onClick={() => setReminderConfig(prev => ({ ...prev, [key]: { ...prev[key], active: !prev[key].active } }))}
                    className={`w-11 h-5 rounded-full p-1 cursor-pointer transition-colors ${reminderConfig[key].active ? 'bg-primary' : 'bg-slate-300'}`}
                  >
                    <div className={`w-3 h-3 bg-white rounded-full transition-transform ${reminderConfig[key].active ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                </div>
                
                <div className="flex items-center gap-4 bg-white/50 p-3 rounded-2xl border border-black/5">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex-1">
                    {key.includes('Stock') ? 'Threshold Units' : 'Alert Days Before'}
                  </span>
                  <input 
                    type="number" 
                    value={reminderConfig[key].daysBefore || reminderConfig[key].threshold}
                    onChange={e => {
                      const val = parseInt(e.target.value);
                      setReminderConfig(prev => ({
                        ...prev,
                        [key]: { ...prev[key], [key.includes('Stock') ? 'threshold' : 'daysBefore']: val }
                      }));
                    }}
                    className="w-16 bg-transparent text-right font-black text-primary border-none outline-none"
                  />
                </div>
              </div>
            ))}
            <button onClick={() => { showSuccess('Alert thresholds updated'); setActiveModal(null); }} className="btn-primary w-full py-3.5 font-black text-xs uppercase tracking-widest mt-2">Save Reminder Profile</button>
          </div>
        </SettingModal>
      )}


      {activeModal === 'billing' && (
        <SettingModal title="Subscription & Billing" subtitle="Manage your enterprise license" onClose={() => setActiveModal(null)}>
          <div className="space-y-6">
            <div className="p-6 bg-gradient-sidebar rounded-3xl text-white relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 p-4 opacity-10"><CreditCard size={80} /></div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">Current Plan</p>
              <h4 className="text-2xl font-black mb-4">{subscription.plan}</h4>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-3xl font-black">${subscription.monthlyRate}</span>
                <span className="text-xs font-bold text-white/40 pb-1">/ month</span>
              </div>
              <div className="flex gap-2">
                 <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase border border-white/5">Active</span>
                 <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase border border-white/5">Next Billing: {subscription.expiryDate}</span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Payment History</p>
              <div className="bg-slate-50 border border-slate-100 rounded-3xl overflow-hidden divide-y divide-slate-100">
                {subscription.history.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-4 hover:bg-white transition-colors group">
                    <div>
                      <p className="text-xs font-black text-slate-800">{inv.id}</p>
                      <p className="text-[10px] font-medium text-slate-400">{inv.date}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-slate-700">${inv.amount}</span>
                      <button onClick={() => exportToCSV([inv], `Invoice_${inv.id}`)} className="p-2 bg-white rounded-xl text-slate-400 hover:text-primary hover:shadow-md transition-all">
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button className="w-full flex items-center justify-center gap-2 py-4 bg-primary/5 text-primary text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-primary/10 transition-all border border-primary/10">
              <Icon name="RefreshCw" size={16} /> Update Plan Configuration
            </button>
          </div>
        </SettingModal>
      )}


      <div className="pt-10 pb-16 flex flex-col items-center gap-4 border-t border-slate-100">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">DentalCloud v2.0 Enterprise</p>
        <div className="h-1 w-12 bg-primary/20 rounded-full" />
      </div>
    </div>
  );
}
