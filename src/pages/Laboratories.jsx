import React, { useState, useEffect, useMemo } from 'react';
import { LABS as INITIAL_LABS } from '../data/mockData';
import { Plus, Search, Filter, Download, Eye, Edit2, Trash2, Mail, Phone, MapPin, Globe, X, FlaskConical, Upload, CheckCircle, FileSpreadsheet } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { exportToCSV } from '../utils/exportUtils';
import { useRef } from 'react';
import * as XLSX from 'xlsx';
import API from '../api';
import { useAuth } from '../context/AuthContext';

const PartnerLogo = ({ logoUrl, name, size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'w-10 h-10 rounded-xl' : size === 'lg' ? 'w-12 h-12 rounded-2xl' : 'w-12 h-12 rounded-2xl';
  return (
    <div className={`${sizeClass} bg-white border border-teal-100 flex items-center justify-center overflow-hidden text-primary shadow-inner shrink-0`}>
      {logoUrl ? (
        <img src={logoUrl} alt={`${name || 'Laboratory'} logo`} className="w-full h-full object-contain p-1.5" />
      ) : (
        <FlaskConical size={size === 'sm' ? 18 : 24} />
      )}
    </div>
  );
};

function LabModal({ item, onClose, onSave }) {
  const [form, setForm] = useState(item || { name: '', logoUrl: '', phone: '', email: '' });
  const [pendingLogo, setPendingLogo] = useState(null);
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg overflow-hidden rounded-[2rem] bg-white" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-[#1C3756] via-[#254D78] to-[#2C4697] text-white">
          <div>
            <h2 className="font-black text-xl">{item ? 'Edit Laboratory' : 'Add Laboratory'}</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mt-1">Profile and logo</p>
          </div>
          <button onClick={onClose} className="p-2.5 text-white/80 hover:text-white hover:bg-white/15 rounded-xl transition-all"><X size={18} /></button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="rounded-[1.5rem] bg-blue-50/70 border border-blue-100 p-4">
            <label className="text-[11px] font-black text-blue-900 uppercase tracking-widest block mb-3">Laboratory Logo</label>
            <div className="flex items-center gap-4">
              <div className="scale-125 origin-left">
                <PartnerLogo logoUrl={pendingLogo?.url || form.logoUrl} name={form.name} size="lg" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-700 truncate">{pendingLogo?.name || (form.logoUrl ? 'Current logo' : 'No logo selected')}</p>
                <p className="text-[10px] font-semibold text-gray-400 mt-1">Add the logo here. It will show in Lab Cases and payments.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <label className="px-4 py-2 rounded-xl bg-[#1C3756] text-white text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-[#254D78] transition-all">
                    Upload Logo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setPendingLogo({ file, name: file.name, url: URL.createObjectURL(file) });
                        e.target.value = '';
                      }}
                    />
                  </label>
                  {(pendingLogo || form.logoUrl) && (
                    <button
                      type="button"
                      onClick={() => {
                        if (pendingLogo?.url) URL.revokeObjectURL(pendingLogo.url);
                        setPendingLogo(null);
                        update('logoUrl', '');
                      }}
                      className="px-3 py-2 rounded-xl bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div>
            <label className="input-label">Lab Name *</label>
            <input value={form.name} onChange={e => update('name', e.target.value)} placeholder="Laboratory name" className="input" />
          </div>
          <div>
            <label className="input-label">Phone</label>
            <input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+966-11-xxxxxxx" className="input" />
          </div>
          <div>
            <label className="input-label">Email</label>
            <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="lab@example.com" className="input" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={() => onSave({ ...form, pendingLogo })} className="btn-primary">{item ? 'Save' : 'Add Laboratory'}</button>
        </div>
      </div>
    </div>
  );
}

function ViewLabModal({ item, onClose }) {
  if (!item) return null;
  return (
    <div className="modal-overlay z-[100]" onClick={onClose}>
      <div className="modal-content max-w-sm bg-white overflow-hidden rounded-[2rem] shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-teal px-8 py-6 flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <PartnerLogo logoUrl={item.logoUrl} name={item.name} size="lg" />
            <div>
              <h2 className="font-bold text-xl leading-none">{item.name}</h2>
              <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold mt-1">Laboratory Details</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={22} /></button>
        </div>
        <div className="p-8 space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Phone size={18} />
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Phone</p>
              <p className="text-sm font-black text-gray-800">{item.phone || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
              <Mail size={18} />
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Email</p>
              <p className="text-sm font-black text-gray-800">{item.email || '—'}</p>
            </div>
          </div>
        </div>
        <div className="px-8 pb-6">
          <button onClick={onClose} className="btn-primary w-full py-3.5 text-sm rounded-2xl">Close</button>
        </div>
      </div>
    </div>
  );
}

export default function Laboratories() {
  const { checkPermission } = useAuth();
  const canCreate = checkPermission('laboratories', 'create');
  const canUpdate = checkPermission('laboratories', 'update');
  const canDelete = checkPermission('laboratories', 'delete');
  const canExport = checkPermission('laboratories', 'export');
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [importing, setImporting] = useState(false);
  const [showImportSuccess, setShowImportSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    setLoading(true);
    try {
      const res = await API.get('/labs');
      setLabs(res.data);
    } catch (err) {
      console.error('Error fetching laboratories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (form) => {
    try {
      const { pendingLogo } = form;
      const data = {
        name: form.name || '',
        phone: form.phone || '',
        email: form.email || '',
        logoUrl: form.logoUrl || ''
      };

      if (pendingLogo?.file) {
        const fd = new FormData();
        fd.append('title', `${data.name || 'Laboratory'} logo`);
        fd.append('category', 'Laboratory');
        fd.append('skipDb', 'true');
        fd.append('file', pendingLogo.file);
        const uploadRes = await API.post('/documents/upload', fd);
        data.logoUrl = uploadRes.data.fileUrl;
      }

      if (editItem) {
        await API.put(`/labs/${editItem.id}`, data);
      } else {
        await API.post('/labs', data);
      }
      fetchLabs();
      setModal(null);
      setEditItem(null);
    } catch (err) {
      console.error('Error saving laboratory:', err);
      alert(err.response?.data?.message || 'Error saving laboratory');
    }
  };

  const deleteLab = async () => {
    if (confirmDelete) {
      try {
        await API.delete(`/labs/${confirmDelete}`);
        await fetchLabs();
        setConfirmDelete(null);
      } catch (err) {
        console.error('Error deleting laboratory:', err);
        alert(err.response?.data?.message || 'Error deleting laboratory. It might be linked to active cases.');
        setConfirmDelete(null);
      }
    }
  };

  const handleExport = () => {
    exportToCSV(labs, 'Laboratories_List');
  };

  const filteredLabs = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return labs
      .filter(lab => {
        if (!search) return true;
        return (
          (lab.name || '').toLowerCase().includes(search) ||
          (lab.phone || '').toLowerCase().includes(search) ||
          (lab.email || '').toLowerCase().includes(search) ||
          (lab.contactName || '').toLowerCase().includes(search)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'createdNewest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        if (sortBy === 'createdOldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        if (sortBy === 'nameDesc') return (b.name || '').localeCompare(a.name || '');
        return (a.name || '').localeCompare(b.name || '');
      });
  }, [labs, searchTerm, sortBy]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImporting(true);
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          
          const formatted = data
            .filter(row => Object.keys(row).length > 0)
            .map((item, index) => ({
              id: Date.now() + index,
              name: item["Lab Name"] || item.name || item.Name || "Unnamed Lab",
              phone: item.Phone || item.phone || "",
              email: item.Email || item.email || ""
            }));

          if (formatted.length > 0) {
            API.post('/labs/import', formatted)
              .then(() => {
                fetchLabs();
                setShowImportSuccess(true);
              })
              .catch(err => {
                console.error('Error importing labs:', err);
                alert(err.response?.data?.message || "Failed to import laboratories");
              })
              .finally(() => {
                setImporting(false);
              });
          } else {
            alert("No valid lab data found in file");
            setImporting(false);
          }
        } catch(err) {
          console.error('Error importing Excel file:', err);
          alert("Error parsing Excel file");
        } finally {
          setImporting(false);
          e.target.value = '';
        }
      };
      reader.onerror = () => {
        setImporting(false);
        e.target.value = '';
      };
      reader.readAsBinaryString(file);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {viewItem && <ViewLabModal item={viewItem} onClose={() => setViewItem(null)} />}
      {(modal === 'add' || editItem) && (
        <LabModal item={editItem} onClose={() => { setModal(null); setEditItem(null); }} onSave={handleSave} />
      )}
      <ConfirmModal 
        isOpen={!!confirmDelete}
        title="Remove Laboratory?"
        message="Deleting this laboratory will remove it from all case assignments. Continue?"
        onConfirm={deleteLab}
        onCancel={() => setConfirmDelete(null)}
      />

      <ConfirmModal 
        isOpen={showImportSuccess}
        title="Laboratories Imported"
        message="The laboratory records have been successfully imported and synchronized with the system."
        onConfirm={() => setShowImportSuccess(false)}
        confirmText="Acknowledged"
        showCancel={false}
      />

      {importing && (
        <div className="fixed inset-0 z-[200] bg-white/60 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-primary animate-pulse uppercase tracking-widest text-center">Syncing Laboratory Data...</p>
          </div>
        </div>
      )}

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept=".csv,.xlsx,.xls"
      />

      <div className="relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#1C3756] via-[#254D78] to-[#2C4697] p-6 rounded-[2rem] shadow-xl shadow-blue-900/10 border border-blue-900/10">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            Laboratories
            <span className="px-3 py-1 rounded-xl bg-white/15 text-white text-xs font-bold ring-1 ring-white/20">{labs.length} Total</span>
          </h1>
          <p className="text-sm text-white/75 font-medium mt-1">Manage dental laboratory partners and case assignments</p>
        </div>
        <div className="relative z-10 grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          {canCreate && (
            <button onClick={handleImportClick} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white/15 text-white rounded-xl font-bold text-xs hover:bg-white/25 transition-all uppercase tracking-widest border border-white/10"><Upload size={14} /> Import</button>
          )}
          {canExport && (
            <button onClick={handleExport} className="flex items-center justify-center gap-2 px-5 py-2.5 btn-export-excel rounded-xl font-bold text-xs transition-all uppercase tracking-widest border"><FileSpreadsheet size={14} /> Export</button>
          )}
          {canCreate && (
            <button onClick={() => setModal('add')} className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white text-[#1C3756] rounded-xl font-bold text-xs shadow-xl shadow-blue-900/20 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest col-span-2 sm:w-auto">
              <Plus size={16} /> Add Lab
            </button>
          )}
        </div>
      </div>

      <div className="bg-blue-50/60 rounded-2xl border border-blue-100 shadow-sm p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-0">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search laboratories by name, phone, email, or contact..."
            className="w-full bg-white border border-blue-100 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-300"
          />
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="bg-white border border-blue-100 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
        >
          <option value="name">Name A-Z</option>
          <option value="nameDesc">Name Z-A</option>
          <option value="createdNewest">Newest Created</option>
          <option value="createdOldest">Oldest Created</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLabs.map((l, idx) => (
          <div
            key={l.id}
            className="group relative overflow-hidden rounded-[2.2rem] bg-gradient-to-br from-white via-blue-50/30 to-teal-50/30 p-6 border border-blue-100/60 shadow-xl shadow-gray-200/10 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 animate-in fade-in slide-in-from-bottom-5"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-teal-100/40 blur-2xl pointer-events-none" />
            <div className="relative z-10 flex items-start justify-between mb-6">
              <PartnerLogo logoUrl={l.logoUrl} name={l.name} size="sm" />
              <div className="flex gap-1">
                <button onClick={() => setViewItem(l)} className="w-9 h-9 rounded-xl text-gray-400 hover:text-primary hover:bg-primary/5 flex items-center justify-center transition-all" title="View">
                  <Eye size={14} />
                </button>
                {canUpdate && (
                  <button onClick={() => { setEditItem(l); setModal('edit'); }} className="w-9 h-9 rounded-xl text-gray-400 hover:text-secondary hover:bg-orange-50 flex items-center justify-center transition-all">
                    <Edit2 size={14} />
                  </button>
                )}
                {canDelete && (
                  <button onClick={() => setConfirmDelete(l.id)} className="w-9 h-9 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-all">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="relative z-10 mb-5">
              <h3 className="font-black text-gray-800 tracking-tight leading-tight group-hover:text-primary transition-colors">{l.name}</h3>
              <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mt-1">Dental Laboratory</p>
            </div>

            <div className="relative z-10 space-y-3 mb-6">
              <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  <Mail size={14} className="text-blue-300" />
                </div>
                <span className="truncate">{l.email || 'Email missing'}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0">
                  <Phone size={14} className="text-teal-400" />
                </div>
                <span>{l.phone || 'Phone missing'}</span>
              </div>
            </div>

            <button
              onClick={() => setViewItem(l)}
              className="relative z-10 w-full py-3 bg-white text-gray-500 border border-blue-100 rounded-2xl text-[10px] font-black uppercase tracking-widest group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm"
            >
              View Laboratory
            </button>
          </div>
        ))}
        {/* Add card */}
        {canCreate && (
          <button onClick={() => setModal('add')} className="rounded-[2.2rem] border-2 border-dashed border-blue-200 bg-blue-50/30 flex flex-col items-center justify-center gap-2 min-h-56 text-gray-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-200">
            <Plus size={20} />
            <span className="text-sm font-medium">Add Laboratory</span>
          </button>
        )}
      </div>
    </div>
  );
}
