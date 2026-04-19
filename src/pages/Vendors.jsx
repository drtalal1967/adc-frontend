import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import API, { BACKEND_URL } from '../api';
import { Plus, Search, Filter, Download, Eye, Edit2, Trash2, Mail, Phone, MapPin, Globe, X, Upload, Store, Tag, CheckCircle, User, FileText, Settings, Check, Loader2, Calendar, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import FileUpload from '../components/FileUpload';
import FilePreviewModal from '../components/FilePreviewModal';
import { exportToCSV } from '../utils/exportUtils';
import * as XLSX from 'xlsx';
import CategoryManagerModal from '../components/CategoryManagerModal';

const DEFAULT_CATEGORIES = [
  'Materials', 'Repair', 'Service', 'Groceries', 'Cleaning', 
  'Electricity & Water Bills', 'Phone Bills', 'Rent', 'Equipment Purchase', 'Others'
];

const CATEGORY_COLORS = {
  'Materials': 'bg-teal-50 text-teal-700',
  'Repair': 'bg-blue-50 text-blue-700',
  'Service': 'bg-indigo-50 text-indigo-700',
  'Groceries': 'bg-emerald-50 text-emerald-700',
  'Cleaning': 'bg-purple-50 text-purple-700',
  'Electricity & Water Bills': 'bg-amber-50 text-amber-700',
  'Phone Bills': 'bg-sky-50 text-sky-700',
  'Rent': 'bg-rose-50 text-rose-700',
  'Equipment Purchase': 'bg-orange-50 text-orange-700',
  'Others': 'bg-gray-100 text-gray-600',
};

function VendorModal({ item, onClose, onSave, categories = [] }) {
  const initialData = { 
    name: '', 
    contactPerson: '', 
    categories: [], 
    phone: '', 
    email: '', 
    address: '', 
    notes: '',
    taxId: '',
    bankName: '',
    bankAccount: ''
  };
  
  const [form, setForm] = useState(initialData);
  const [pendingFiles, setPendingFiles] = useState([]);

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name || '',
        contactPerson: item.contactName || '',
        categories: item.categories ? item.categories.split(',') : [],
        phone: item.phone || '',
        email: item.email || '',
        address: item.address || '',
        notes: item.notes || '',
        taxId: item.taxId || '',
        bankName: item.bankName || '',
        bankAccount: item.bankAccount || ''
      });
      setPendingFiles([]);
    } else {
      setForm(initialData);
      setPendingFiles([]);
    }
  }, [item]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, pendingFiles });
  };

  const toggleCategory = (cat) => {
    setForm(prev => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat]
    }));
  };

  return (
    <div className="modal-overlay z-[100]" onClick={onClose}>
      <div className="modal-content w-[95%] sm:max-w-xl bg-white rounded-[2rem] shadow-2xl p-0 overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[90vh]">
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-[#F59E0B]">
                <Store size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">{item ? 'Edit Vendor' : 'Add New Vendor'}</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">Supplier Management</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all">
              <X size={20} />
            </button>
          </div>

          <div className="p-8 overflow-y-auto space-y-6 scrollbar-hide flex-1">
            {/* Essential Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Vendor Name *</label>
                <input 
                  required
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="e.g. Al-Noor Est for Medical Supplies"
                  className="input w-full h-11 rounded-xl border-gray-200 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Contact Person</label>
                <input 
                  value={form.contactPerson}
                  onChange={e => setForm({...form, contactPerson: e.target.value})}
                  placeholder="Contact name"
                  className="input w-full h-11 rounded-xl border-gray-200 bg-white"
                />
              </div>

              {/* Categories Section */}
              <div className="md:col-span-2 space-y-2 pt-2">
                 <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Categories (Optional)</label>
                 <div className="bg-gray-50/50 rounded-[1.5rem] border border-gray-100 p-5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4">
                       {categories.map(cat => (
                          <label key={cat} className="flex items-center gap-3 cursor-pointer select-none group">
                             <input 
                               type="checkbox"
                               className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                               checked={form.categories.includes(cat)}
                               onChange={() => toggleCategory(cat)}
                             />
                             <span className="text-xs font-semibold text-gray-600 transition-colors group-hover:text-gray-900">{cat}</span>
                          </label>
                       ))}
                    </div>
                 </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1 flex items-center gap-1.5 font-black">
                   <Phone size={12} className="text-gray-400"/> Phone
                </label>
                <input 
                  value={form.phone}
                  onChange={e => setForm({...form, phone: e.target.value})}
                  placeholder="17592291"
                  className="input w-full h-11 rounded-xl border-gray-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1 flex items-center gap-1.5 font-black">
                   <Mail size={12} className="text-gray-400"/> Email
                </label>
                <input 
                  type="email"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  placeholder="example@mail.com"
                  className="input w-full h-11 rounded-xl border-gray-200"
                />
              </div>
              
              {/* Address */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1 flex items-center gap-1.5 font-black">
                   <MapPin size={12} className="text-gray-400"/> Address
                </label>
                <input 
                  value={form.address}
                  onChange={e => setForm({...form, address: e.target.value})}
                  placeholder="Main building, 3rd Floor, Manama"
                  className="input w-full h-11 rounded-xl border-gray-200"
                />
              </div>
            </div>

            {/* Documents Section */}
            <div className="space-y-2 pt-2">
               <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Documents (Optional)</label>
               <FileUpload
                  label=""
                  value={pendingFiles}
                  multiple={true}
                  onChange={setPendingFiles}
                  accept="image/*,application/pdf"
               />
            </div>
          </div>

          <div className="px-8 py-6 bg-white border-t border-gray-100 flex justify-between items-center shrink-0">
             <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">Discard</button>
             <button type="submit" className="px-10 py-3 rounded-[1.25rem] bg-[#F59E0B] text-white font-bold shadow-lg shadow-orange-500/30 hover:scale-[1.02] active:scale-95 transition-all text-sm">
               Save
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ViewVendorModal({ item, onClose, onPreview }) {
  const categories = item.categories ? item.categories.split(',') : [];
  
  return (
    <div className="modal-overlay z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="modal-content w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl p-0 overflow-hidden animate-scale-in flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        {/* Header with Background Pattern */}
        <div className="relative px-8 py-10 bg-primary/5 border-b border-gray-100">
           <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] overflow-hidden pointer-events-none">
              <div className="grid grid-cols-8 gap-4 rotate-12 -translate-x-12 -translate-y-12">
                 {[...Array(32)].map((_, i) => <Store key={i} size={48} />)}
              </div>
           </div>
           
           <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-5">
                 <div className="w-16 h-16 rounded-[1.5rem] bg-white flex items-center justify-center text-primary shadow-xl shadow-primary/10 ring-4 ring-primary/5">
                    <Store size={32} />
                 </div>
                 <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">{item.name}</h2>
                    <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mt-1 flex items-center gap-2">
                       <span className={`w-2 h-2 rounded-full ${item.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                       {item.isActive ? 'ACTIVE VENDOR' : 'INACTIVE VENDOR'}
                    </p>
                 </div>
              </div>
              <button onClick={onClose} className="p-3 text-gray-400 hover:text-gray-600 hover:bg-white rounded-2xl transition-all shadow-sm">
                 <X size={20} />
              </button>
           </div>
        </div>
        
        <div className="p-8 overflow-y-auto space-y-8 scrollbar-hide flex-1">
           {/* Quick Stats Grid */}
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-3xl bg-gray-50 border border-gray-100 flex flex-col items-center gap-2">
                 <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center"><Store size={20} /></div>
                 <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Total Invoices</p>
                    <p className="text-lg font-black text-gray-900 text-center">{item.expenses?.length || 0}</p>
                 </div>
              </div>
              <div className="p-5 rounded-3xl bg-gray-50 border border-gray-100 flex flex-col items-center gap-2">
                 <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center"><FileText size={20} /></div>
                 <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Docs Linked</p>
                    <p className="text-lg font-black text-gray-900 text-center">{item.documents?.length || 0}</p>
                 </div>
              </div>
              <div className="p-5 rounded-3xl bg-gray-50 border border-gray-100 flex flex-col items-center gap-2">
                 <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Store size={20} /></div>
                 <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Last Active</p>
                    <p className="text-sm font-black text-gray-900 text-center">Today</p>
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Essential Contact */}
              <div className="space-y-6">
                 <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-gray-50 pb-2">
                       <User size={12} className="text-primary"/> Contact Information
                    </h3>
                    <div className="space-y-4">
                       <div className="flex items-center gap-4 group">
                          <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all"><User size={18} /></div>
                          <div>
                             <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Contact Person</p>
                             <p className="text-sm font-bold text-gray-800">{item.contactName || 'Not specified'}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-4 group">
                          <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all"><Phone size={18} /></div>
                          <div>
                             <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Phone Number</p>
                             <p className="text-sm font-bold text-gray-800">{item.phone || 'Not specified'}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-4 group">
                          <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all"><Mail size={18} /></div>
                          <div>
                             <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Business Email</p>
                             <p className="text-sm font-bold text-gray-800 break-all">{item.email || 'Not specified'}</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-gray-50 pb-2">
                       <Store size={12} className="text-primary"/> Category Scope
                    </h3>
                    <div className="flex flex-wrap gap-2">
                       {categories.length > 0 ? categories.map(c => (
                          <span key={c} className="px-3 py-1.5 rounded-xl bg-white border border-gray-100 text-[10px] font-bold text-gray-600 shadow-sm">{c}</span>
                       )) : (
                          <p className="text-xs text-gray-400 italic pl-1">No categories assigned</p>
                       )}
                    </div>
                 </div>
              </div>

              {/* Right Column: Address & Finance */}
              <div className="space-y-6">
                 <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-gray-50 pb-2">
                       <MapPin size={12} className="text-primary"/> Physical Location
                    </h3>
                    <div className="p-4 rounded-2xl bg-gray-50 text-xs font-medium text-gray-600 leading-relaxed border border-gray-100 italic">
                       {item.address || 'Address not registered'}
                    </div>
                 </div>

                 <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-gray-50 pb-2">
                       <Store size={12} className="text-primary"/> Internal Notes
                    </h3>
                    <div className="p-4 rounded-2xl bg-gray-50 text-xs font-medium text-gray-600 leading-relaxed border border-gray-100 italic">
                       {item.notes || 'No internal notes provided'}
                    </div>
                 </div>
              </div>
           </div>

           {/* Linked Documents Area */}
           <div>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-gray-50 pb-2">
                 <FileText size={12} className="text-primary"/> Business Documents ({item.documents?.length || 0})
              </h3>
              {item.documents && item.documents.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {item.documents.map(doc => (
                       <div key={doc.id} className="p-3 rounded-2xl border border-gray-100 bg-white flex items-center justify-between group hover:border-primary/30 transition-all shadow-sm">
                          <div className="flex items-center gap-3 min-w-0">
                             <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors flex-shrink-0">
                                <FileText size={14} />
                             </div>
                             <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-800 truncate">{doc.fileName || doc.title || 'Document'}</p>
                             </div>
                          </div>
                          <button 
                             onClick={() => {
                               const fullUrl = doc.fileUrl.startsWith('http') ? doc.fileUrl : `${BACKEND_URL}${doc.fileUrl}`;
                               onPreview({ ...doc, fileUrl: fullUrl });
                             }} 
                             className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                           >
                             <Eye size={16}/>
                           </button>
                       </div>
                    ))}
                 </div>
              ) : (
                 <div className="p-6 text-center bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
                    <FileText size={24} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No documents linked yet</p>
                 </div>
              )}
           </div>
        </div>

        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
           <button onClick={onClose} className="px-10 py-3 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">Close Details</button>
        </div>
      </div>
    </div>
  );
}

export default function Vendors() {
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState([]);
  const [modal, setModal] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [catFilter, setCatFilter] = useState('All');
  const [customCategories, setCustomCategories] = useState([]);
  const [importing, setImporting] = useState(false);
  const [showImportSuccess, setShowImportSuccess] = useState(false);
  const [showCatManager, setShowCatManager] = useState(false);
  const fileInputRef = useRef(null);

  const fetchCustomCategories = useCallback(async () => {
    try {
      const res = await API.get('/categories?module=VENDOR');
      setCustomCategories(res.data.map(c => c.name));
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  const allCategories = useMemo(() => {
    return Array.from(new Set([...DEFAULT_CATEGORIES, ...customCategories]));
  }, [customCategories]);

  useEffect(() => {
    fetchVendors();
    fetchCustomCategories();
  }, [fetchCustomCategories]);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await API.get('/vendors');
      setVendors(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (form) => {
    try {
      const { pendingFiles, ...data } = form;
      let savedId = editItem?.id;
      
      if (editItem) {
        await API.put(`/vendors/${editItem.id}`, data);
      } else {
        const res = await API.post('/vendors', data);
        savedId = res.data.id;
      }

      // Upload any pending files and link to this vendor
      if (pendingFiles && pendingFiles.length > 0) {
        const uploadedDocs = [];
        for (const fileObj of pendingFiles) {
          const file = fileObj.file || fileObj;
          const fd = new FormData();
          // MUST append fields BEFORE file for some multer configs
          fd.append('title', fileObj.name || file.name);
          fd.append('category', 'Vendor');
          fd.append('skipDb', 'true'); 
          fd.append('file', file);
          
          try {
            const uploadRes = await API.post('/documents/upload', fd);
            uploadedDocs.push({
              fileUrl: uploadRes.data.fileUrl,
              fileName: file.name,
              fileType: file.type,
              fileSizeKb: Math.round(file.size / 1024),
              title: fileObj.name || file.name
            });
          } catch (uploadErr) {
            console.error('File upload failed:', uploadErr);
          }
        }
        
        // Finalize by updating vendor with document links if we have new ones
        if (uploadedDocs.length > 0 && savedId) {
          await API.put(`/vendors/${savedId}`, { ...data, documents: uploadedDocs });
        }
      }

      fetchVendors();
      setModal(null);
      setEditItem(null);
    } catch (err) {
      console.error('Error saving vendor:', err);
    }
  };

  const handleDelete = async () => {
    if (confirmDelete) {
      try {
        await API.delete(`/vendors/${confirmDelete}`);
        fetchVendors();
        setConfirmDelete(null);
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting vendor');
      }
    }
  };

  const onImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        await API.post('/vendors/import', data);
        fetchVendors();
        setShowImportSuccess(true);
        setTimeout(() => setShowImportSuccess(false), 3000);
      } catch (err) {
        console.error('Import failed', err);
      } finally {
        setImporting(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const filteredVendors = vendors.filter(v => {
    if (catFilter === 'All') return true;
    return v.categories?.includes(catFilter);
  });

  return (
    <div className="space-y-5 animate-fade-in text-gray-800">
      {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
      <CategoryManagerModal 
        isOpen={showCatManager} 
        onClose={() => setShowCatManager(false)} 
        module="VENDOR"
        onUpdate={fetchCustomCategories}
      />
      {(modal === 'add' || editItem) && (
        <VendorModal 
          item={editItem} 
          categories={allCategories}
          onClose={() => { setModal(null); setEditItem(null); }} 
          onSave={handleSave} 
        />
      )}
      {viewItem && (
        <ViewVendorModal item={viewItem} onClose={() => setViewItem(null)} onPreview={setPreviewFile} />
      )}
      <ConfirmModal 
        isOpen={!!confirmDelete} 
        onCancel={() => setConfirmDelete(null)} 
        onConfirm={handleDelete} 
        title="Delete Vendor" 
        message="Are you sure you want to delete this vendor? This action cannot be undone." 
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] shadow-xl shadow-gray-200/20 border border-gray-100">
        <div>
           <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
              Partners & Vendors
              <span className="px-3 py-1 rounded-xl bg-gray-100 text-gray-400 text-xs font-bold ring-1 ring-gray-200/50">{vendors.length} Total</span>
           </h1>
           <p className="text-sm text-gray-500 font-medium mt-1">Manage supply chain and laboratory partnerships</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input type="file" ref={fileInputRef} onChange={onImport} className="hidden" accept=".csv,.xlsx,.xls" />
          <button 
            onClick={() => {
              // Generate vendor import template
              const templateData = [
                { 'Name': 'Example Vendor Co.', 'Contact Person': 'John Smith', 'Phone': '17592291', 'Email': 'vendor@example.com', 'Address': 'Block 1, Manama, Bahrain', 'Category': 'Materials', 'Notes': 'Optional notes' },
              ];
              const ws = XLSX.utils.json_to_sheet(templateData);
              ws['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 35 }, { wch: 20 }, { wch: 25 }];
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, 'Vendors');
              XLSX.writeFile(wb, 'vendor_import_template.xlsx');
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-all uppercase tracking-widest border border-emerald-100"
          >
            <Download size={14} /> Template
          </button>
          <button 
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold text-xs hover:bg-gray-200 transition-all uppercase tracking-widest disabled:opacity-50"
          >
            {importing ? 'Importing...' : <><Upload size={14} /> Import</>}
          </button>
          <button 
            onClick={() => exportToCSV(vendors, 'vendors-list')}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold text-xs hover:bg-gray-200 transition-all uppercase tracking-widest"
          >
            <Download size={14} /> Export
          </button>
          <button 
            onClick={() => setModal('add')}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-xs shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest"
          >
            <Plus size={14} /> Add Vendor
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap items-center">
        {['All', ...allCategories].map(c => (
          <button key={c} onClick={() => setCatFilter(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${catFilter === c ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100 shadow-sm'}`}>
            {c}
          </button>
        ))}
        <button 
          onClick={() => setShowCatManager(true)}
          className="p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:text-primary hover:bg-primary/5 border border-dashed border-gray-200 transition-all ml-1 group flex items-center gap-1.5 px-3"
          title="Manage Categories"
        >
          <Settings size={14} className="group-hover:rotate-90 transition-transform duration-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Manage</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
           [...Array(6)].map((_, i) => <div key={i} className="h-64 rounded-[2rem] bg-gray-100 animate-pulse" />)
        ) : filteredVendors.length === 0 ? (
           <div className="col-span-full py-20 text-center bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
              <Store size={48} className="mx-auto text-gray-200 mb-4" />
              <h3 className="text-xl font-bold text-gray-800">No active vendors found</h3>
              <p className="text-gray-400 text-sm mt-1">Try resetting your filters or join a new partner.</p>
           </div>
        ) : filteredVendors.map((v, idx) => (
          <div 
            key={v.id} 
            className="group relative bg-white rounded-[2.2rem] p-6 shadow-xl shadow-gray-200/10 border border-gray-50 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 animate-in fade-in slide-in-from-bottom-5"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
                  <Store size={24} />
                </div>
                <div>
                  <h3 className="font-black text-gray-800 tracking-tight leading-tight mb-1 group-hover:text-primary transition-colors">{v.name}</h3>
                  <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase flex items-center gap-1.5">
                    <User size={10} /> {v.contactName || 'General Partner'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => setConfirmDelete(v.id)} className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={16}/></button>
                <button onClick={() => setEditItem(v)} className="p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"><Edit2 size={16}/></button>
              </div>
            </div>

            <div className="space-y-4 mb-6">
               <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                     <Mail size={14} className="text-gray-300" />
                  </div>
                  <span className="truncate">{v.email || 'Email missing'}</span>
               </div>
               <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                     <Phone size={14} className="text-gray-300" />
                  </div>
                  <span>{v.phone || 'Phone missing'}</span>
               </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-6">
              {v.categories?.split(',').slice(0, 3).map(c => (
                <span key={c} className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${CATEGORY_COLORS[c] || 'bg-gray-100 text-gray-600'}`}>
                  {c}
                </span>
              ))}
              {(v.categories?.split(',').length || 0) > 3 && (
                <span className="px-3 py-1 rounded-lg bg-gray-50 text-gray-400 text-[9px] font-black tracking-wider group-hover:bg-primary/5 transition-colors">
                  +{(v.categories?.split(',').length || 0) - 3} MORE
                </span>
              )}
            </div>

            <button 
              onClick={() => setViewItem(v)}
              className="w-full py-3 bg-gray-50 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm"
            >
              View Full Profile
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
