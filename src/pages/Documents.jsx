import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';
import API, { BACKEND_URL } from '../api';
import FilePreviewModal from '../components/FilePreviewModal';
import FileUpload from '../components/FileUpload';
import { Search, FileText, Download, Trash2, Eye, Calendar, X, Upload, Image as ImageIcon, CheckCircle2, User, Settings, Tag, Plus, Check, Loader2, Bell } from 'lucide-react';
import CategoryManagerModal from '../components/CategoryManagerModal';
import PaginationControls from '../components/PaginationControls';
import { useAuth } from '../context/AuthContext';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const DEFAULT_CATEGORIES = ['Lab Case', 'Expense', 'Employee', 'Payment', 'Daily Income Sheet', 'License', 'Work Permit', 'Visa', 'Agreement', 'ID', 'General'];
const CATEGORY_LABELS = {
  'Lab Case': 'Lab Cases',
};
const getCategoryLabel = (category) => CATEGORY_LABELS[category] || category;
const dedupeDocumentRows = (documents) => {
  const seen = new Set();
  return documents.filter((doc) => {
    const key = [
      doc.fileName,
      doc.fileSizeKb,
      doc.title,
      doc.category,
      doc.uploadDate,
      doc.relatedType,
      doc.relatedLabel,
      doc.uploadedBy,
    ].map(value => String(value || '').trim().toLowerCase()).join('|');

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const A4_SIZE = [595.28, 841.89];

const fetchAttachmentBlob = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to fetch attachment: ${response.status}`);
  const blob = await response.blob();
  return {
    bytes: await blob.arrayBuffer(),
    type: blob.type || response.headers.get('content-type') || ''
  };
};

const drawFallbackAttachmentPage = async (pdfDoc, attachment, message = 'This attachment type cannot be embedded automatically.') => {
  const page = pdfDoc.addPage(A4_SIZE);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  page.drawText(attachment.title || 'Document', { x: 42, y: 790, size: 15, font: boldFont, color: rgb(0.08, 0.12, 0.2) });
  page.drawText(attachment.subtitle || '', { x: 42, y: 768, size: 9, font, color: rgb(0.42, 0.45, 0.5) });
  page.drawText(message, { x: 42, y: 720, size: 10, font, color: rgb(0.42, 0.45, 0.5) });
  page.drawText(attachment.url, { x: 42, y: 698, size: 8, font, color: rgb(0.02, 0.24, 0.58), maxWidth: 510 });
};

const addAttachmentPage = async (pdfDoc, attachment) => {
  try {
    const { bytes, type } = await fetchAttachmentBlob(attachment.url);
    const isPdf = type.includes('pdf') || /\.pdf(\?|#|$)/i.test(attachment.url);
    const isPng = type.includes('png') || /\.png(\?|#|$)/i.test(attachment.url);
    const isJpg = type.includes('jpeg') || type.includes('jpg') || /\.jpe?g(\?|#|$)/i.test(attachment.url);

    if (isPdf) {
      const sourcePdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pages = await pdfDoc.copyPages(sourcePdf, sourcePdf.getPageIndices());
      pages.forEach(page => pdfDoc.addPage(page));
      return;
    }

    if (isPng || isJpg) {
      const image = isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
      const page = pdfDoc.addPage(A4_SIZE);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      page.drawText(attachment.title || 'Document', { x: 42, y: 790, size: 13, font: boldFont, color: rgb(0.08, 0.12, 0.2) });
      page.drawText(attachment.subtitle || '', { x: 42, y: 770, size: 9, font, color: rgb(0.42, 0.45, 0.5) });
      const maxWidth = A4_SIZE[0] - 84;
      const maxHeight = A4_SIZE[1] - 120;
      const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      page.drawImage(image, { x: (A4_SIZE[0] - width) / 2, y: 42, width, height });
      return;
    }

    await drawFallbackAttachmentPage(pdfDoc, attachment);
  } catch (error) {
    console.warn('Could not embed document, adding link instead:', error);
    await drawFallbackAttachmentPage(pdfDoc, attachment, 'This document could not be downloaded for embedding.');
  }
};

const savePdfDocument = async (pdfDoc, fileName) => {
  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};



function UploadDocumentModal({ onClose, onSave, employees = [], laboratories = [], vendors = [], categories = [] }) {
  const [form, setForm] = useState({
    title: '',
    category: categories[0] || 'General',
    relatedTo: '',
    branch: '',
    employeeId: '',
    laboratoryId: '',
    vendorId: '',
    file: null,
    fileName: '',
    fileUrl: '',
    fileType: ''
  });

  const [files, setFiles] = useState([]);

  const branches = ['Manama Branch', 'Tubli Branch'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!files || files.length === 0) {
      alert("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('category', form.category);
    formData.append('source', 'DOCUMENT_CENTER'); // marker: uploaded from Document Center
    if (form.branch) formData.append('branch', form.branch);
    if (form.employeeId) formData.append('employeeId', form.employeeId);
    if (form.laboratoryId) formData.append('laboratoryId', form.laboratoryId);
    if (form.vendorId) formData.append('vendorId', form.vendorId);
    formData.append('file', files[0].file || files[0]);

    try {
      await API.post('/documents/upload', formData);
      onClose();   // close first
      onSave();    // then trigger parent to re-fetch
    } catch (err) {
      alert('Failed to upload document');
    }
  };

  return (
    <div className="modal-overlay z-[100]" onClick={onClose}>
      <div className="modal-content w-[95%] sm:max-w-md bg-white rounded-2xl shadow-2xl p-6 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6 shrink-0">
          <h2 className="text-lg font-bold text-gray-800">Upload Document</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Document Title *</label>
            <input 
              required
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              placeholder="e.g. Vendor Contract V2"
              className="input w-full"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Category *</label>
            <select 
              required
              value={form.category}
              onChange={e => setForm({...form, category: e.target.value})}
              className="input w-full"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Branch (Optional)</label>
              <select 
                value={form.branch}
                onChange={e => setForm({...form, branch: e.target.value})}
                className="input w-full"
              >
                <option value="">Select Branch...</option>
                {branches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Employee (Optional)</label>
              <select 
                value={form.employeeId}
                onChange={e => setForm({...form, employeeId: e.target.value})}
                className="input w-full"
              >
                <option value="">Select Employee...</option>
                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Laboratory (Optional)</label>
              <select 
                value={form.laboratoryId}
                onChange={e => setForm({...form, laboratoryId: e.target.value})}
                className="input w-full"
              >
                <option value="">Select Laboratory...</option>
                {laboratories.map(lab => <option key={lab.id} value={lab.id}>{lab.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Vendor (Optional)</label>
              <select 
                value={form.vendorId}
                onChange={e => setForm({...form, vendorId: e.target.value})}
                className="input w-full"
              >
                <option value="">Select Vendor...</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Related Case (Optional)</label>
            <input 
              value={form.relatedTo}
              onChange={e => setForm({...form, relatedTo: e.target.value})}
              placeholder="e.g. PT-001"
              className="input w-full"
            />
          </div>

          <div className="space-y-3 pt-2 border-t border-gray-100">
             <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block">File Attachment *</label>
             <FileUpload
                label=""
                value={files}
                multiple={false}
                onChange={(newFiles) => setFiles(Array.isArray(newFiles) ? newFiles : [newFiles].filter(Boolean))}
                accept="image/*,application/pdf"
             />
          </div>

          <div className="pt-4 flex justify-end gap-3 shrink-0 border-t border-gray-100 mt-4">
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <button type="submit" className="btn-primary">Upload Document</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Documents() {
  const { checkPermission } = useAuth();
  const canCreate = checkPermission('documents', 'create');
  const canDelete = checkPermission('documents', 'delete');
  const canExport = checkPermission('documents', 'export');
  const navigate = useNavigate();
  const [docs, setDocs] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [toast, setToast] = useState('');
  const [employees, setEmployees] = useState([]);
  const [laboratories, setLaboratories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCatManager, setShowCatManager] = useState(false);
  const [customCategories, setCustomCategories] = useState([]);
  const [filterEmployee, setFilterEmployee] = useState('All');
  const [filterBranch, setFilterBranch] = useState('All');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const fetchCustomCategories = useCallback(async () => {
    try {
      const res = await API.get('/categories?module=DOCUMENT');
      setCustomCategories(res.data.map(c => c.name));
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  const allCategories = useMemo(() => {
    return Array.from(new Set([...DEFAULT_CATEGORIES, ...customCategories]));
  }, [customCategories]);

  useEffect(() => {
    fetchDocs();
    fetchMetadata();
    fetchCustomCategories();
  }, [fetchCustomCategories]);

  const fetchMetadata = async () => {
    try {
      const [empRes, labRes, venRes] = await Promise.all([
        API.get('/employees'),
        API.get('/labs'),
        API.get('/vendors')
      ]);
      setEmployees(Array.isArray(empRes.data) ? empRes.data : []);
      setLaboratories(Array.isArray(labRes.data) ? labRes.data : []);
      setVendors(Array.isArray(venRes.data) ? venRes.data : []);
    } catch (err) {
      console.error('Error fetching metadata:', err);
    }
  };

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await API.get('/documents');
      const data = dedupeDocumentRows(res.data.map(doc => {
        const url = doc.fileUrl || '';
        const cleanUrl = url.startsWith('/') ? url : `/${url}`;
        const fullUrl = url.startsWith('http') ? url : `${BACKEND_URL}${cleanUrl}`;
        return { ...doc, fileUrl: fullUrl };
      })).sort((a, b) => {
        const dateA = new Date(a.uploadedAt || a.createdAt || a.uploadDate || 0).getTime();
        const dateB = new Date(b.uploadedAt || b.createdAt || b.uploadDate || 0).getTime();
        return dateB - dateA || Number(b.id || 0) - Number(a.id || 0);
      });
      setDocs(data);
    } catch (err) {
      console.error('Error fetching docs:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };


  const filteredDocs = useMemo(() => {
    return docs.filter(d => {
      const searchText = [d.title, d.fileName, d.category, d.relatedLabel, d.relatedType, d.uploadedBy]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchSearch = searchText.includes(search.toLowerCase());
      const matchCat = filterCategory === 'All' || d.category === filterCategory;
      const uploadDate = new Date(d.uploadDate);
      const matchFrom = !filterDateFrom || (uploadDate >= new Date(filterDateFrom));
      const matchTo = !filterDateTo || (uploadDate <= new Date(filterDateTo + 'T23:59:59'));
      const matchEmployee = filterEmployee === 'All' || String(d.employeeId) === filterEmployee;
      const matchBranch = filterBranch === 'All' || d.branch === filterBranch;
      return matchSearch && matchCat && matchFrom && matchTo && matchEmployee && matchBranch;
    });
  }, [docs, search, filterCategory, filterDateFrom, filterDateTo, filterEmployee, filterBranch]);

  useEffect(() => {
    setPage(1);
  }, [search, filterCategory, filterDateFrom, filterDateTo, filterEmployee, filterBranch]);

  const paginatedDocs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredDocs.slice(start, start + pageSize);
  }, [filteredDocs, page, pageSize]);

  const handleDelete = async () => {
    if (confirmDelete) {
      try {
        await API.delete(`/documents/${confirmDelete}`);
        setDocs(prev => prev.filter(d => d.id !== confirmDelete));
        setConfirmDelete(null);
        showToast('Document deleted successfully');
      } catch (err) {
        alert('Failed to delete document');
      }
    }
  };

  const handleRelatedClick = (category, relatedId) => {
    if (!relatedId) return;
    switch(category) {
      case 'Vendor': navigate('/vendors'); break;
      case 'Lab Case': navigate('/lab-cases'); break;
      case 'Employee': navigate('/employees'); break;
      case 'Payment': navigate('/lab-payments'); break;
      default: break;
    }
  };

  const handleExportAttachmentsPDF = async () => {
    const attachments = filteredDocs
      .filter(doc => doc.fileUrl)
      .map((doc, index) => ({
        url: doc.fileUrl,
        label: `Document ${index + 1}`,
        title: doc.title || doc.fileName || `Document ${index + 1}`,
        subtitle: `${doc.category || 'General'}${doc.fileName ? ` - ${doc.fileName}` : ''}`
      }));

    if (!attachments.length) {
      alert('No documents found in the current filter to export.');
      return;
    }

    const pdfDoc = await PDFDocument.create();
    for (const attachment of attachments) {
      await addAttachmentPage(pdfDoc, attachment);
    }
    await savePdfDocument(pdfDoc, `documents_attachments_${new Date().toISOString().split('T')[0]}.pdf`);
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
    <div className="space-y-6 max-w-6xl mx-auto pb-10 animate-fade-in relative text-gray-800">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up">
          <CheckCircle2 size={20} className="text-emerald-400" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      {/* Shared File Preview Modal */}
      {previewFile && (
        <FilePreviewModal 
          file={previewFile} 
          onClose={() => setPreviewFile(null)} 
        />
      )}

      {showCatManager && (
        <CategoryManagerModal 
          isOpen={showCatManager} 
          onClose={() => setShowCatManager(false)} 
          module="DOCUMENT"
          onUpdate={fetchCustomCategories}
          defaultCategories={DEFAULT_CATEGORIES}
        />
      )}

      {modalOpen && canCreate && (
        <UploadDocumentModal 
          employees={employees}
          laboratories={laboratories}
          vendors={vendors}
          categories={allCategories}
          onClose={() => setModalOpen(false)} 
          onSave={() => {
            fetchDocs();
            showToast('Document uploaded successfully');
          }} 
        />
      )}
      
      <ConfirmModal 
        isOpen={!!confirmDelete}
        title="Delete Document?"
        message="Are you sure you want to permanently delete this document? This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <div className="sticky top-0 z-30 space-y-4 bg-gray-50/95 pb-4 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
             <div className="flex items-center gap-3">
               <div className="p-2 bg-primary/10 rounded-xl">
                 <FileText size={24} className="text-primary"/>
               </div>
               <div>
                 <h1 className="section-title text-xl md:text-2xl flex items-center gap-3">
                   Document Center
                   <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-500 text-sm font-bold border border-gray-200">{filteredDocs.length}</span>
                 </h1>
                 <p className="section-subtitle mt-0.5 text-sm text-gray-500">Centralized storage for all records and attachments</p>
               </div>
             </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {canExport && (
              <button
                onClick={handleExportAttachmentsPDF}
                className="btn-export-pdf flex items-center justify-center gap-2 px-4 h-11 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
              >
                <FileText size={16} /> Attachments PDF
              </button>
            )}
            {canCreate && (
              <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center justify-center gap-2 shadow-lg shadow-primary/20 h-11">
                 <Upload size={16} /> Upload Document
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar - Two Row Design */}
        <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Row 1: Search + Date + Clear */}
          <div className="flex items-center gap-3 p-3 border-b border-gray-100">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by title or filename..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 text-sm font-medium text-gray-700 shadow-inner placeholder:text-gray-400"
              />
            </div>
            <div className="relative w-36 shrink-0">
              <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
                className="w-full pl-9 pr-2 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-black text-gray-600 appearance-none focus:ring-2 focus:ring-primary/20 shadow-inner"
              />
            </div>
            <div className="relative w-36 shrink-0">
              <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)}
                className="w-full pl-9 pr-2 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-black text-gray-600 appearance-none focus:ring-2 focus:ring-primary/20 shadow-inner"
              />
            </div>
            {(filterCategory !== 'All' || filterEmployee !== 'All' || filterBranch !== 'All' || filterDateFrom || filterDateTo || search) && (
              <button
                onClick={() => { setSearch(''); setFilterCategory('All'); setFilterEmployee('All'); setFilterBranch('All'); setFilterDateFrom(''); setFilterDateTo(''); }}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-rose-100"
              >
                <X size={11} /> Clear
              </button>
            )}
          </div>
          {/* Row 2: Dropdowns + Manage */}
          <div className="flex flex-wrap items-center gap-2 p-3">
            <div className="flex items-center gap-1.5 bg-white border border-gray-100 rounded-xl px-3 py-1.5 shadow-inner min-w-[140px] flex-1 md:flex-none">
              <Tag size={12} className="text-gray-400 shrink-0" />
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                className="flex-1 bg-transparent text-[11px] font-black text-gray-600 appearance-none outline-none cursor-pointer">
                <option value="All">All Categories</option>
                {allCategories.map(c => <option key={c} value={c}>{getCategoryLabel(c)}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1.5 bg-white border border-gray-100 rounded-xl px-3 py-1.5 shadow-inner min-w-[150px] flex-1 md:flex-none">
              <User size={12} className="text-gray-400 shrink-0" />
              <select value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}
                className="flex-1 bg-transparent text-[11px] font-black text-gray-600 appearance-none outline-none cursor-pointer">
                <option value="All">All Employees</option>
                {employees.map(emp => (
                  <option key={emp.id} value={String(emp.id)}>
                    {emp.firstName}{emp.lastName && emp.lastName.trim() && emp.lastName !== '.' ? ' ' + emp.lastName : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1.5 bg-white border border-gray-100 rounded-xl px-3 py-1.5 shadow-inner min-w-[130px] flex-1 md:flex-none">
              <Bell size={12} className="text-gray-400 shrink-0" />
              <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)}
                className="flex-1 bg-transparent text-[11px] font-black text-gray-600 appearance-none outline-none cursor-pointer">
                <option value="All">All Branches</option>
                <option value="Manama Branch">Manama Branch</option>
                <option value="Tubli Branch">Tubli Branch</option>
              </select>
            </div>
            <button onClick={() => setShowCatManager(true)}
              className="ml-auto flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gray-50 text-gray-500 hover:text-primary hover:bg-primary/5 border border-gray-100 hover:border-primary/30 transition-all group text-[10px] font-black uppercase tracking-widest shrink-0">
              <Settings size={13} className="group-hover:rotate-90 transition-transform duration-500" />
              Manage Categories
            </button>
          </div>
        </div>
      </div>

      {filteredDocs.length === 0 ? (
        <div className="card py-20 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-gray-200">
           <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
              <FileText size={32} />
           </div>
           <div>
              <h3 className="text-lg font-bold text-gray-800">No documents found</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">There are no documents matching your filters. Try adjusting them or upload a new one.</p>
           </div>
           {canCreate && (
             <button onClick={() => setModalOpen(true)} className="btn-outline px-6 py-2 mt-4 text-primary border-primary hover:bg-primary/5">Upload Document</button>
           )}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/20 border border-gray-100 overflow-hidden hidden md:block">
             <div className="table-container overflow-auto max-h-[calc(100vh-360px)]">
               <table className="table w-full">
                 <thead>
                   <tr className="bg-gray-50/50">
                     <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Document Details</th>
                     <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Category</th>
                     <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Uploaded By</th>
                     <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Date</th>
                     <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                   {paginatedDocs.map((doc, idx) => (
                     <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors group animate-in slide-in-from-bottom-2" style={{ animationDelay: `${idx*30}ms` }}>
                       <td className="px-6 py-4">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                              {getFileIcon(doc.fileName)}
                           </div>
                           <div>
                              <p className="text-sm font-bold text-gray-800 tracking-tight cursor-pointer hover:text-primary transition-colors" onClick={() => setPreviewFile(doc.fileUrl)}>{doc.title}</p>
                              <p className="text-[10px] text-gray-400 font-medium truncate max-w-[200px] mt-0.5">{doc.fileName}</p>
                           </div>
                         </div>
                       </td>
                       <td className="px-6 py-4">
                         <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-wider border border-gray-200">{getCategoryLabel(doc.category)}</span>
                         {doc.relatedId && (
                           <button onClick={() => handleRelatedClick(doc.relatedType || doc.category, doc.relatedId)} className="block mt-1.5 hover:opacity-80 transition-opacity">
                             <p className="text-[10px] text-primary font-bold flex items-center gap-1 hover:underline"><span className="w-1 h-1 rounded-full bg-primary inline-block"/> {doc.relatedType || doc.category}: {doc.relatedLabel || doc.relatedId}</p>
                           </button>
                         )}
                       </td>
                       <td className="px-6 py-4">
                         <p className="text-[11px] font-bold text-gray-600">{doc.uploadedBy}</p>
                       </td>
                       <td className="px-6 py-4 text-center">
                         <p className="text-[11px] text-gray-500 font-bold flex items-center justify-center gap-1.5"><Calendar size={12} className="text-gray-400" /> {doc.uploadDate}</p>
                       </td>
                       <td className="px-6 py-4 text-right">
                         <div className="flex items-center justify-end gap-1">
                           <button onClick={() => setPreviewFile(doc.fileUrl)} className="btn-icon w-9 h-9 rounded-xl text-blue-500 hover:bg-blue-50 hover:shadow-sm" title="View Document">
                             <Eye size={16} />
                           </button>
                          {canExport && (
                            <a href={doc.fileUrl} download={doc.fileName} className="btn-icon w-9 h-9 rounded-xl text-emerald-500 hover:bg-emerald-50 hover:shadow-sm" title="Download Document">
                              <Download size={16} />
                            </a>
                          )}
                          {canDelete && (
                            <button onClick={() => setConfirmDelete(doc.id)} className="btn-icon w-9 h-9 rounded-xl text-rose-500 hover:bg-rose-50 hover:shadow-sm" title="Delete Document">
                              <Trash2 size={16} />
                            </button>
                          )}
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>

          <div className="md:hidden space-y-3">
            {paginatedDocs.map((doc, idx) => (
              <div key={doc.id} className="card p-4 space-y-3 border border-gray-100 shadow-sm animate-in slide-in-from-bottom-2" style={{ animationDelay: `${idx*30}ms` }}>
                <div className="flex items-start gap-3">
                   <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 cursor-pointer" onClick={() => setPreviewFile(doc.fileUrl)}>
                      {getFileIcon(doc.fileName)}
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 tracking-tight truncate cursor-pointer hover:text-primary transition-colors" onClick={() => setPreviewFile(doc.fileUrl)}>{doc.title}</p>
                      <p className="text-[10px] text-gray-400 font-medium truncate">{doc.fileName}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="inline-block px-2 py-0.5 rounded border border-gray-200 bg-gray-50 text-gray-500 text-[9px] font-black uppercase tracking-wider">{getCategoryLabel(doc.category)}</span>
                        {doc.relatedId && (
                          <button onClick={() => handleRelatedClick(doc.relatedType || doc.category, doc.relatedId)} className="text-[9px] text-primary font-bold hover:underline">
                            {doc.relatedType || doc.category}: {doc.relatedLabel || doc.relatedId}
                          </button>
                        )}
                      </div>
                   </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold pt-3 border-t border-gray-50">
                   <span className="flex items-center gap-1"><Calendar size={12}/> {doc.uploadDate}</span>
                   <span>{doc.uploadedBy}</span>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                   <button onClick={() => setPreviewFile(doc.fileUrl)} className="w-10 h-10 flex items-center justify-center text-blue-500 hover:bg-blue-50 rounded-xl border border-blue-50"><Eye size={16} /></button>
                   {canExport && (
                     <a href={doc.fileUrl} download={doc.fileName} className="w-10 h-10 flex items-center justify-center text-emerald-500 hover:bg-emerald-50 rounded-xl border border-emerald-50"><Download size={16} /></a>
                   )}
                   {canDelete && (
                     <button onClick={() => setConfirmDelete(doc.id)} className="w-10 h-10 flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded-xl border border-rose-50"><Trash2 size={16} /></button>
                   )}
                </div>
              </div>
            ))}
          </div>
          <PaginationControls
            totalItems={filteredDocs.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            label="documents"
          />
        </>
      )}
    </div>
  );
}
