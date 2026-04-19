import React, { useState, useEffect } from 'react';
import { LABS as INITIAL_LABS } from '../data/mockData';
import { Plus, Search, Filter, Download, Eye, Edit2, Trash2, Mail, Phone, MapPin, Globe, X, FlaskConical, Upload, CheckCircle } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { exportToCSV } from '../utils/exportUtils';
import { useRef } from 'react';
import * as XLSX from 'xlsx';
import API from '../api';

function LabModal({ item, onClose, onSave }) {
  const [form, setForm] = useState(item || { name: '', phone: '', email: '' });
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">{item ? 'Edit Laboratory' : 'Add Laboratory'}</h2>
          <button onClick={onClose} className="btn-icon text-gray-400"><X size={18} /></button>
        </div>
        <div className="px-6 py-4 space-y-4">
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
          <button onClick={() => onSave(form)} className="btn-primary">{item ? 'Save' : 'Add Laboratory'}</button>
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
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <FlaskConical size={24} />
            </div>
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
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [importing, setImporting] = useState(false);
  const [showImportSuccess, setShowImportSuccess] = useState(false);
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
      if (editItem) {
        await API.put(`/labs/${editItem.id}`, form);
      } else {
        await API.post('/labs', form);
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title text-xl md:text-2xl">Laboratories</h1>
          <p className="section-subtitle text-xs md:text-sm">{labs.length} laboratories registered</p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          <button onClick={handleImportClick} className="btn-ghost btn-sm justify-center py-2 text-[10px] md:text-sm flex-grow sm:flex-grow-0"><Upload size={14} /> Import</button>
          <button onClick={handleExport} className="btn-ghost btn-sm justify-center py-2 text-[10px] md:text-sm flex-grow sm:flex-grow-0"><Download size={14} /> Export</button>
          <button onClick={() => setModal('add')} className="btn-primary col-span-2 sm:w-auto justify-center py-2 text-xs md:text-sm">
            <Plus size={16} /> Add Lab
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {labs.map(l => (
          <div key={l.id} className="card card-hover">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-teal flex items-center justify-center">
                <FlaskConical size={18} className="text-white" />
              </div>
              <div className="flex gap-1">
                        <button onClick={() => setViewItem(l)} className="btn-icon w-8 h-8 rounded-xl text-gray-400 hover:text-primary hover:bg-primary/5" title="View">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => { setEditItem(l); setModal('edit'); }} className="btn-icon w-8 h-8 rounded-xl text-gray-400 hover:text-secondary hover:bg-orange-50">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => setConfirmDelete(l.id)} className="btn-icon w-8 h-8 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50">
                          <Trash2 size={14} />
                        </button>
              </div>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">{l.name}</h3>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-gray-500">
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Mail size={13} className="text-primary" /> {l.email}
              </div>
            </div>
          </div>
        ))}
        {/* Add card */}
        <button onClick={() => setModal('add')} className="card card-hover border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 min-h-32 text-gray-400 hover:border-primary hover:text-primary transition-all duration-200">
          <Plus size={20} />
          <span className="text-sm font-medium">Add Laboratory</span>
        </button>
      </div>
    </div>
  );
}
