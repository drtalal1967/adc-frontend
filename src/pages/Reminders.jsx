import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Calendar, Clock, CheckCircle2, Info, Settings as SettingsIcon, Trash2, X, Plus, User, ChevronDown, Edit2, Upload, Eye, FileText, Image as ImageIcon, Settings, Tag, Loader2, Search } from 'lucide-react';
import API, { BACKEND_URL } from '../api';
import FilePreviewModal from '../components/FilePreviewModal';
import CategoryManagerModal from '../components/CategoryManagerModal';

const BRANCHES = ['Manama Branch', 'Tubli Branch'];
const DEFAULT_REMINDER_CATEGORIES = ['License Renewal', 'Visa Expiry', 'Equipment Service', 'Training', 'Work Permit', 'Others'];

function CreateReminderModal({ onClose, onSave, initialData, employees = [], categories = [], onManageCategories }) {
  const fileInputRef = React.useRef(null);
  const [form, setForm] = useState(() => {
    if (initialData) {
      const matchedEmp = employees.find(e => e.userId === initialData.targetUserId);
      const url = initialData.attachmentUrl || '';
      const cleanUrl = url.startsWith('/') ? url : `/${url}`;
      const fullUrl = url ? (url.startsWith('http') ? url : `${BACKEND_URL}${cleanUrl}`) : null;
      
      return {
        branch: initialData.branch || 'All Branches',
        employeeId: matchedEmp ? matchedEmp.id : '',
        category: initialData.body || initialData.title || 'License Renewal',
        title: initialData.body ? initialData.title : '',
        dueDate: initialData.dueAt ? initialData.dueAt.split('T')[0] : '',
        notifyDate: initialData.notifyAt ? initialData.notifyAt.split('T')[0] : '',
        method: initialData.method || 'Both',
        attachment: fullUrl,
        fileName: url ? url.split('/').pop() : '',
        description: initialData.description || ''
      };
    }
    return {
      branch: 'All Branches',
      employeeId: '',
      category: 'License Renewal',
      title: '',
      dueDate: '',
      notifyDate: '',
      method: 'Both',
      attachment: null,
      fileName: '',
      description: ''
    };
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.notifyDate && form.dueDate && new Date(form.notifyDate) > new Date(form.dueDate)) {
      alert("Notify date cannot be after due date");
      return;
    }

    const formData = new FormData();
    formData.append('title', form.title || form.category);
    formData.append('body', form.category);
    formData.append('description', form.description || '');
    formData.append('severity', form.category.includes('Expiry') || form.category.includes('Renewal') ? 'warning' : 'info');
    formData.append('dueDate', form.dueDate);
    formData.append('notifyDate', form.notifyDate);
    formData.append('method', form.method);
    formData.append('branch', form.branch);
    if (form.employeeId && form.employeeId !== 'General') {
      formData.append('employeeId', form.employeeId);
    }
    if (fileInputRef.current?.files[0]) {
      formData.append('file', fileInputRef.current.files[0]);
    }

    try {
      if (initialData?.id) {
        await API.put(`/reminders/${initialData.id}`, formData);
      } else {
        await API.post('/reminders', formData);
      }
      onSave();
      onClose();
    } catch (err) {
      console.error('Save reminder error:', err);
      alert(err.response?.data?.message || err.message || 'Failed to save reminder. Please try again.');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm(prev => ({ ...prev, attachment: URL.createObjectURL(file), fileName: file.name }));
    }
  };

  return (
    <div className="modal-overlay z-[100]" onClick={onClose}>
      <div className="modal-content w-[95%] sm:max-w-md bg-white overflow-hidden shadow-2xl animate-scale-in max-h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-header px-6 py-5 flex items-center justify-between text-white">
          <h2 className="font-bold text-lg">{initialData ? 'Edit Reminder' : 'Create Reminder'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Reminder Title *</label>
            <input 
              required
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              placeholder="e.g. Follow up with patient"
              className="input w-full font-bold text-gray-700" 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Branch (Optional)</label>
            <div className="relative">
              <select 
                value={form.branch || 'All Branches'}
                onChange={e => setForm({...form, branch: e.target.value})}
                className="input w-full appearance-none pr-10"
              >
                <option value="All Branches">All Branches</option>
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Employee (Optional)</label>
            <div className="relative">
              <select 
                value={form.employeeId || ''}
                onChange={e => setForm({...form, employeeId: e.target.value})}
                className="input w-full appearance-none pr-10"
              >
                <option value="">Select employee...</option>
                <option value="General">General (No Employee)</option>
                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between pl-1">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Reminder Type *</label>
              <button 
                type="button"
                onClick={() => onManageCategories?.()}
                className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest flex items-center gap-1"
              >
                <Settings size={10} /> Manage
              </button>
            </div>
            <div className="relative">
              <select 
                required
                value={form.category}
                onChange={e => setForm({...form, category: e.target.value})}
                className="input w-full appearance-none pr-10 font-bold text-gray-700"
              >
                {Array.from(new Set([...DEFAULT_REMINDER_CATEGORIES, ...categories])).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Due Date *</label>
              <input 
                type="date" 
                required
                value={form.dueDate}
                onChange={e => setForm({...form, dueDate: e.target.value})}
                className="input w-full" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Notify On *</label>
              <input 
                type="date" 
                required
                value={form.notifyDate}
                onChange={e => setForm({...form, notifyDate: e.target.value})}
                className="input w-full" 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Method *</label>
            <div className="relative">
              <select 
                required
                value={form.method}
                onChange={e => setForm({...form, method: e.target.value})}
                className="input w-full appearance-none pr-10"
              >
                <option>Email</option>
                <option>In-App</option>
                <option>Both</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Description (Optional)</label>
            <textarea 
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              rows="3"
              className="input w-full py-3"
              placeholder="Enter reminder details here..."
            />
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Attachment (Optional)</label>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
            {!form.fileName ? (
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="btn-outline py-2 px-4 shadow-sm hover:border-primary hover:bg-primary/5 flex items-center justify-center w-full gap-2 border-dashed border-2"
              >
                <Upload size={16} className="text-gray-400" /> <span className="text-gray-500">Click to upload file</span>
              </button>
            ) : (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-primary" />
                  </div>
                  <span className="text-xs font-bold text-gray-700 truncate">{form.fileName}</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, attachment: null, fileName: '' }))}
                  className="p-1.5 hover:bg-rose-100 hover:text-rose-600 rounded-lg text-gray-400 transition-colors"
                  title="Remove attachment"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={onClose} className="btn-ghost w-full sm:flex-1 py-3 text-sm order-2 sm:order-1">Cancel</button>
            <button type="submit" className="btn-primary w-full sm:flex-[2] py-3 text-sm rounded-xl shadow-lg shadow-primary/20 order-1 sm:order-2">
              {initialData ? 'Update Reminder' : 'Create Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ViewReminderModal({ reminder, onClose }) {
  const [previewFile, setPreviewFile] = useState(null);

  const getFullUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${BACKEND_URL}${cleanUrl}`;
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return <FileText size={18} className="text-gray-400" />;
    const ext = fileName.split('.').pop().toLowerCase();
    if (['pdf'].includes(ext)) return <FileText size={18} className="text-red-500" />;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <ImageIcon size={18} className="text-blue-500" />;
    if (['doc', 'docx'].includes(ext)) return <FileText size={18} className="text-orange-500" />;
    return <FileText size={18} className="text-gray-500" />;
  };

  return (
    <div className="modal-overlay z-[100]" onClick={onClose}>
      <div className="modal-content max-w-md bg-white overflow-hidden shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-header px-6 py-5 flex items-center justify-between text-white">
          <h2 className="font-bold text-lg">Reminder Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4 p-5 rounded-[1.5rem] bg-slate-50 border border-slate-100 shadow-inner">
             <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary border border-slate-100 flex-shrink-0">
               <Bell size={28} />
             </div>
             <div className="min-w-0">
               <div className="flex items-center gap-2">
                 <h3 className="font-bold text-gray-900 text-lg tracking-tight truncate">{reminder.title}</h3>
                 <span className="px-2 py-0.5 rounded-lg bg-gray-100 border border-gray-200 text-gray-600 text-[9px] font-black uppercase tracking-widest whitespace-nowrap shrink-0">{reminder.body || (reminder.isSystem ? 'System' : reminder.title)}</span>
               </div>
               <div className="flex items-center gap-2 mt-1">
                 <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">{reminder.branch || 'All Branches'}</span>
                 {reminder.recipient?.employee && (
                   <span className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                     <User size={10} /> {reminder.recipient.employee.firstName} {reminder.recipient.employee.lastName}
                   </span>
                 )}
               </div>
             </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 shadow-sm flex flex-col justify-between">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] mb-2 flex items-center gap-1.5"><Calendar size={12} /> Due Date</p>
              <p className="text-sm font-black text-gray-800 tracking-tight">{reminder.dueAt ? reminder.dueAt.split('T')[0] : reminder.date}</p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 shadow-sm flex flex-col justify-between">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] mb-2 flex items-center gap-1.5"><Clock size={12} /> Notify On</p>
              <p className="text-sm font-black text-gray-800 tracking-tight">{reminder.notifyAt ? reminder.notifyAt.split('T')[0] : 'Not set'}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] mb-2 flex items-center gap-1.5"><Info size={12} /> Method</p>
              <p className="text-xs font-bold text-gray-700">{reminder.method || 'In-App'}</p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] mb-2 flex items-center gap-1.5"><User size={12} /> Assigned To</p>
              <p className="text-xs font-bold text-gray-700 truncate">{reminder.recipient?.employee ? `${reminder.recipient.employee.firstName} ${reminder.recipient.employee.lastName}` : 'General / Everyone'}</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 shadow-sm">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] mb-2 block border-l-2 border-primary pl-2">Summary / Instructions</label>
            <p className="text-xs text-gray-600 leading-relaxed font-medium mt-3 italic bg-white/50 p-3 rounded-xl border border-gray-50">
              {reminder.description || 'No description provided.'}
            </p>
          </div>

          {reminder.attachmentUrl && (
            <div 
              className="p-4 rounded-2xl bg-white border border-gray-100 transition-all hover:border-primary/30 cursor-pointer shadow-sm group hover:bg-slate-50/50"
              onClick={() => setPreviewFile(getFullUrl(reminder.attachmentUrl))}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  {getFileIcon(reminder.attachmentUrl.split('/').pop())}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-gray-800 truncate group-hover:text-primary transition-colors">
                    {reminder.attachmentUrl.split('/').pop()}
                  </p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Attached Document • Click to view</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-primary group-hover:bg-primary/10 transition-all">
                  <Eye size={18} />
                </div>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button onClick={onClose} className="btn-primary w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-xs">Close Details</button>
          </div>
        </div>
      </div>
      {previewFile && (
        <FilePreviewModal 
          file={previewFile} 
          onClose={() => setPreviewFile(null)} 
        />
      )}
    </div>
  );
}

export default function Reminders() {
  const [modal, setModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [viewingReminder, setViewingReminder] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCatManager, setShowCatManager] = useState(false);
  const [customCategories, setCustomCategories] = useState([]);
  // Filters
  const [filterType, setFilterType] = useState('All');
  const [filterEmployee, setFilterEmployee] = useState('All');
  const [filterBranch, setFilterBranch] = useState('All');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  useEffect(() => {
    fetchData();
    fetchCustomCategories();
  }, []);
 
  const fetchCustomCategories = React.useCallback(async () => {
    try {
      const res = await API.get('/categories?module=REMINDERS');
      setCustomCategories(res.data.map(c => c.name));
    } catch (err) {
      console.error('Error fetching reminder categories:', err);
    }
  }, []);
 
  const fetchData = async () => {
    setLoading(true);
    try {
      const remRes = await API.get('/reminders');
      // Sorting is now handled by the backend, but we'll ensure it's correct here too
      const sorted = (remRes.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setReminders(sorted);
 
      try {
        const empRes = await API.get('/employees');
        setEmployees(empRes.data);
      } catch (empErr) {
        console.warn('Could not fetch employees (likely permission restriction).');
      }
    } catch (err) {
      console.error('Error fetching reminders:', err);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    try {
      await API.delete(`/reminders/${id}`);
      setReminders(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Failed to delete reminder:', err);
    }
  };

  const markAllRead = async () => {
    try {
      await Promise.all(reminders.map(r => API.delete(`/reminders/${r.id}`)));
      setReminders([]);
    } catch (err) {
      console.error('Failed to clear reminders:', err);
    }
  };

  // Filter logic
  const allReminderTypes = React.useMemo(() => {
    return Array.from(new Set([...DEFAULT_REMINDER_CATEGORIES, ...customCategories]));
  }, [customCategories]);

  const filteredReminders = React.useMemo(() => {
    return reminders.filter(r => {
      const category = r.body || r.title;
      let matchType = filterType === 'All' || category === filterType;
      
      // Match system alerts to dropdown categories
      if (!matchType && r.isSystem && filterType !== 'All') {
        if (filterType.toLowerCase().includes('license') && r.title.toLowerCase().startsWith('license')) matchType = true;
        if (filterType.toLowerCase().includes('visa') && r.title.toLowerCase().startsWith('visa')) matchType = true;
        if (filterType.toLowerCase().includes('work permit') && r.title.toLowerCase().startsWith('work permit')) matchType = true;
      }
      
      // Employee filter: for manual reminders use recipient.employee.id, for system alerts use employeeId
      const matchEmployee = filterEmployee === 'All' ||
        (filterEmployee === 'general' && !r.targetUserId && !r.employeeId) ||
        (r.recipient?.employee?.id && String(r.recipient.employee.id) === filterEmployee) ||
        (r.employeeId && String(r.employeeId) === filterEmployee);
      
      const matchBranch = filterBranch === 'All' || r.branch === filterBranch;
      const dueDate = r.dueAt ? new Date(r.dueAt) : null;
      const matchFrom = !filterDateFrom || (dueDate && dueDate >= new Date(filterDateFrom));
      const matchTo = !filterDateTo || (dueDate && dueDate <= new Date(filterDateTo + 'T23:59:59'));
      return matchType && matchEmployee && matchBranch && matchFrom && matchTo;
    });
  }, [reminders, filterType, filterEmployee, filterBranch, filterDateFrom, filterDateTo]);
  const getTypeStyle = (type) => {
    switch (type) {
      case 'critical': return 'bg-rose-50 border-rose-100 text-rose-700';
      case 'warning': return 'bg-amber-50 border-amber-100 text-amber-700';
      case 'info': return 'bg-blue-50 border-blue-100 text-blue-700';
      default: return 'bg-gray-50 border-gray-100 text-gray-700';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'critical': return <AlertTriangle size={20} className="text-rose-500" />;
      case 'warning': return <Clock size={20} className="text-amber-500" />;
      case 'info': return <Bell size={20} className="text-blue-500" />;
      default: return <Bell size={20} className="text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title text-xl md:text-2xl flex items-center gap-3">
             Reminders & System Alerts
          </h1>
          <p className="section-subtitle text-xs md:text-sm">Stay updated on critical license expiries and operational tasks</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setModal(true)}
            className="btn-outline w-full sm:w-auto justify-center py-2.5 text-sm transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={16} /> Add Reminder
          </button>
          {reminders.length > 0 && (
            <button 
              onClick={markAllRead}
              className="btn-primary w-full sm:w-auto justify-center py-2.5 text-sm shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
            >
              <CheckCircle2 size={16} /> Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-100 rounded-xl text-[11px] font-black text-gray-600 appearance-none focus:ring-2 focus:ring-primary/20 shadow-sm uppercase tracking-wider">
              <option value="All">All Types</option>
              {allReminderTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="relative">
            <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-100 rounded-xl text-[11px] font-black text-gray-600 appearance-none focus:ring-2 focus:ring-primary/20 shadow-sm">
              <option value="All">All Employees</option>
              <option value="general">General (No Employee)</option>
              {employees.map(emp => <option key={emp.id} value={String(emp.id)}>{emp.firstName}{emp.lastName && emp.lastName.trim() && emp.lastName !== '.' ? ' ' + emp.lastName : ''}</option>)}
            </select>
          </div>
          <div className="relative">
            <Bell size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-100 rounded-xl text-[11px] font-black text-gray-600 appearance-none focus:ring-2 focus:ring-primary/20 shadow-sm uppercase tracking-wider">
              <option value="All">All Branches</option>
              {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="relative">
            <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
              className="w-full pl-9 pr-2 py-2.5 bg-white border border-gray-100 rounded-xl text-[10px] font-black text-gray-600 appearance-none focus:ring-2 focus:ring-primary/20 shadow-sm" />
          </div>
          <div className="relative">
            <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
              className="w-full pl-9 pr-2 py-2.5 bg-white border border-gray-100 rounded-xl text-[10px] font-black text-gray-600 appearance-none focus:ring-2 focus:ring-primary/20 shadow-sm" />
          </div>
        </div>
        {(filterType !== 'All' || filterEmployee !== 'All' || filterBranch !== 'All' || filterDateFrom || filterDateTo) && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{filteredReminders.length} of {reminders.length} reminders shown</p>
            <button onClick={() => { setFilterType('All'); setFilterEmployee('All'); setFilterBranch('All'); setFilterDateFrom(''); setFilterDateTo(''); }}
              className="text-[10px] font-black text-rose-500 hover:underline uppercase tracking-widest flex items-center gap-1">
              <X size={10} /> Clear Filters
            </button>
          </div>
        )}
      </div>
      {modal && (
          <CreateReminderModal 
            employees={employees}
            categories={customCategories}
            onManageCategories={() => setShowCatManager(true)}
            onClose={() => setModal(false)}
            onSave={fetchData}
          />
        )}
        {editingReminder && (
          <CreateReminderModal 
            employees={employees}
            categories={customCategories}
            initialData={editingReminder}
            onManageCategories={() => setShowCatManager(true)}
            onClose={() => setEditingReminder(null)} 
            onSave={fetchData} 
          />
        )}

      {viewingReminder && (
        <ViewReminderModal 
          reminder={viewingReminder} 
          onClose={() => setViewingReminder(null)} 
        />
      )}

      <div className="grid grid-cols-1 gap-4">
        {filteredReminders.length === 0 ? (
          <div className="card py-16 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-gray-100">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 tracking-tight">System Clear</h3>
              <p className="text-sm text-gray-400 max-w-xs mx-auto">All alerts have been processed. Your dental center is operating smoothly.</p>
            </div>
          </div>
        ) : (
          filteredReminders.map((reminder) => (
            <div key={reminder.id} className={`card flex flex-col sm:flex-row items-start gap-4 border ${getTypeStyle(reminder.type)} transition-all duration-200 hover:shadow-lg group relative overflow-hidden`}>
              {/* Importance Indicator Strip */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                reminder.type === 'critical' ? 'bg-rose-500' : 
                reminder.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
              }`} />
              
              <div className="flex items-start gap-4 flex-1">
                <div className={`p-3 rounded-2xl bg-white shadow-soft flex-shrink-0 relative`}>
                  {getIcon(reminder.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                    <h3 className="font-bold text-gray-800 tracking-tight flex items-center gap-2 overflow-hidden">
                       <span className="truncate">{reminder.title}</span>
                       <span className="text-[9px] font-black text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md whitespace-nowrap uppercase tracking-wider shrink-0">
                         {reminder.body || (reminder.isSystem ? 'System' : reminder.title)}
                       </span>
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest opacity-40">
                        <Calendar size={10} /> {reminder.dueAt ? reminder.dueAt.split('T')[0] : reminder.date}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs opacity-80 leading-relaxed font-medium line-clamp-2 sm:line-clamp-none">
                    {reminder.description}
                  </p>
                </div>
              </div>
              
              <div className="flex sm:flex-col items-center justify-end w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-black/5 sm:border-none gap-2">
                <button 
                  onClick={() => setViewingReminder(reminder)}
                  className="btn-ghost p-2.5 rounded-xl hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-colors group-hover:opacity-100"
                  title="View Details"
                >
                  <Eye size={18} />
                </button>
                {!reminder.isSystem && (
                  <>
                    <button 
                      onClick={() => setEditingReminder(reminder)}
                      className="btn-ghost p-2.5 rounded-xl hover:bg-primary/10 text-gray-400 hover:text-primary transition-colors group-hover:opacity-100"
                      title="Edit Reminder"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => markRead(reminder.id)}
                      className="btn-ghost p-2.5 rounded-xl hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-colors group-hover:opacity-100"
                      title="Delete Reminder"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>



      <div className="flex flex-col items-center justify-center p-6 text-center space-y-2 opacity-30 grayscale pointer-events-none">
        <Info size={16} />
        <p className="text-[10px] uppercase font-bold tracking-widest">End of Notification Registry</p>
      </div>

      <CategoryManagerModal 
        isOpen={showCatManager} 
        onClose={() => setShowCatManager(false)} 
        module="REMINDERS"
        onUpdate={fetchCustomCategories}
      />
    </div>
  );
}
