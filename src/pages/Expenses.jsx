import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import API, { BACKEND_URL } from '../api';
import { useAuth } from '../context/AuthContext';
import { Calendar, User, Hash, CreditCard, Tag, AlertCircle, Trash2, Edit2, Eye, Search, X, Upload, Download, Plus, FileText, CheckCircle, MapPin } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { exportToCSV } from '../utils/exportUtils';
import FileUpload from '../components/FileUpload';
import FilePreviewModal from '../components/FilePreviewModal';
import * as XLSX from 'xlsx';

const DEFAULT_VENDOR_CATEGORIES = ['Materials', 'Repair', 'Service', 'Groceries', 'Cleaning', 'Electricity & Water Bills', 'Phone Bills', 'Rent', 'Equipment Purchase', 'Others'];

function ExpenseModal({ item, onClose, onSave, onPreview, vendors = [], categories = [] }) {
  const initialData = {
    date: new Date().toISOString().split('T')[0],
    branch: 'Tubli Branch',
    vendorCategory: '',
    vendor: '',
    invoiceNumber: '',
    amount: '',
    paymentStatus: 'Unpaid',
    attachments: [],
    bankAccount: '',
    notes: ''
  };

  const [form, setForm] = useState(() => {
    if (!item) return initialData;
    return {
      ...initialData,
      ...item,
      attachments: Array.isArray(item.attachments) ? item.attachments : []
    };
  });

  const [pendingFiles, setPendingFiles] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) onSave({ ...form, pendingFiles });
  };

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay z-[100]" onClick={onClose}>
      <div className="modal-content max-w-2xl bg-white overflow-hidden shadow-2xl animate-scale-in flex flex-col" style={{ maxHeight: 'min(90vh, 800px)' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-[#F59E0B] px-6 py-6 flex items-center justify-between text-white border-b border-orange-400/20 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <CreditCard size={24} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-xl leading-none">{item ? 'Update Expense Record' : 'Record New Expense'}</h2>
              <p className="text-[10px] text-white/80 uppercase tracking-[0.2em] font-bold mt-1.5">Financial Management</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/70 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-0 flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-6 space-y-6 min-h-0">
            {/* Transaction Details Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-primary pl-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Transaction Details</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                    <Calendar size={13} className="text-primary" /> Expense Date
                  </label>
                  <input 
                    type="date" 
                    required
                    value={form.date} 
                    onChange={e => update('date', e.target.value)} 
                    className="input w-full bg-gray-50/50" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                    <MapPin size={13} className="text-orange-500" /> Branch
                  </label>
                  <select 
                    value={form.branch} 
                    onChange={e => update('branch', e.target.value)} 
                    className="select w-full bg-gray-50/50 rounded-xl border-gray-200"
                  >
                    <option value="Tubli Branch">Tubli Branch</option>
                    <option value="Manama Branch">Manama Branch</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                    <FileText size={13} className="text-secondary" /> Invoice Number
                  </label>
                  <input 
                    value={form.invoiceNumber} 
                    onChange={e => update('invoiceNumber', e.target.value)} 
                    placeholder="e.g. INV-2026-001" 
                    className="input w-full font-mono bg-gray-50/50" 
                  />
                </div>
              </div>
            </div>

            {/* Vendor Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-secondary pl-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Vendor Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                    <Tag size={13} className="text-indigo-500" /> Category
                  </label>
                  <select 
                    required
                    value={form.vendorCategory} 
                    onChange={e => update('vendorCategory', e.target.value)} 
                    className="select w-full bg-gray-50/50"
                  >
                    <option value="">Select category...</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                    <User size={13} className="text-emerald-500" /> Vendor Name
                  </label>
                  <select 
                    required
                    value={form.vendorId || ''} 
                    onChange={e => update('vendorId', e.target.value)} 
                    className="select w-full bg-gray-50/50"
                  >
                    <option value="">Select vendor...</option>
                    {vendors
                      .filter(v => !form.vendorCategory || (v.categories && v.categories.split(',').includes(form.vendorCategory)))
                      .map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-teal-500 pl-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Additional Information</h3>
              </div>
              <div className="space-y-1.5 focus-within:z-10">
                <label className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                  <FileText size={13} className="text-teal-500" /> Notes (Optional)
                </label>
                <textarea 
                  value={form.notes || ''} 
                  onChange={e => update('notes', e.target.value)} 
                  placeholder="Enter any additional notes..."
                  rows="3"
                  className="input w-full bg-gray-50/50 resize-none"
                />
              </div>
            </div>

            {/* Attachments Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-amber-500 pl-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Receipts & Documents</h3>
              </div>
                <FileUpload 
                  label="Upload Bill or Receipt"
                  value={pendingFiles}
                  multiple={true}
                  onChange={setPendingFiles}
                  onPreview={onPreview}
                  accept="image/*,application/pdf"
                />
            </div>

            {/* Payment Summary Section */}
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-1.5 focus-within:z-10">
                <label className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                  Amount (BHD)
                </label>
                <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                  <span className="px-3 py-2.5 bg-gray-50/50 border-r border-gray-100 text-gray-400 font-bold text-xs shrink-0">BHD</span>
                  <input 
                    type="number" 
                    required
                    step="0.01"
                    value={form.amount} 
                    onChange={e => update('amount', e.target.value)} 
                    placeholder="0.00" 
                    className="w-full px-3 py-2.5 text-lg font-bold text-gray-800 bg-transparent border-none outline-none focus:ring-0" 
                  />
                </div>
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Payment Status</label>
                <div className="flex gap-2 p-1 bg-white border border-gray-100 rounded-xl">
                  {['Paid', 'Unpaid'].map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => update('paymentStatus', status)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all duration-300 ${
                        form.paymentStatus === status 
                          ? status === 'Paid' ? 'bg-[#10B981] text-white shadow-lg' : 'bg-[#F43F5E] text-white shadow-lg'
                          : 'bg-gray-50 text-gray-400 hover:bg-gray-100 uppercase tracking-widest'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
 
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex items-center gap-4 shrink-0 mt-auto">
            <button type="button" onClick={onClose} className="px-8 py-3.5 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">Discard</button>
            <button type="submit" className="flex-1 py-4 bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold rounded-2xl shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98]">
              {item ? 'Update Expense' : 'Confirm Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ViewExpenseModal({ item, onClose, onPreview }) {
  if (!item) return null;
  return (
    <div className="modal-overlay z-[100]" onClick={onClose}>
      <div className="modal-content max-w-lg bg-white overflow-hidden rounded-[2rem] shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="bg-[#F59E0B] px-8 py-6 flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <CreditCard size={24} />
            </div>
            <div>
              <h2 className="font-bold text-xl leading-none">{item.vendor?.name || 'Expense Detail'}</h2>
              <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold mt-1">Expense Record</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={22} /></button>
        </div>
        <div className="p-8 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Date</p>
              <p className="text-sm font-black text-gray-800">{item.date}</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Branch</p>
              <p className="text-sm font-black text-gray-800">{item.branch}</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Category</p>
              <p className="text-sm font-black text-gray-800">{item.vendorCategory || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Invoice #</p>
              <p className="text-sm font-mono font-black text-primary">{item.invoiceNumber || '—'}</p>
            </div>
          </div>
          <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-5 border border-gray-100">
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Amount</p>
              <p className="text-3xl font-black text-gray-900"><span className="text-sm text-gray-400 mr-1">BHD</span>{(item.amount || 0).toLocaleString()}</p>
            </div>
              <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border ${
              item.paymentStatus === 'Paid'
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                : item.paymentStatus === 'Partial'
                  ? 'bg-amber-50 text-amber-600 border-amber-100'
                  : 'bg-rose-50 text-rose-600 border-rose-100'
            }`}>{item.paymentStatus}</span>
          </div>

          {item.notes && (
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-2 mt-4 text-left">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-1"><FileText size={12} className="text-teal-500" /> Notes</p>
              <p className="text-sm font-medium text-gray-700 whitespace-pre-wrap leading-relaxed">{item.notes}</p>
            </div>
          )}

          {item.attachments && item.attachments.length > 0 && (
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Attachments ({item.attachments.length})</p>
              <div className="flex flex-wrap gap-2">
                {item.attachments.map((url, i) => {
                  const ext = url.split('?')[0].split('.').pop().toLowerCase();
                  const isImage = ['jpg','jpeg','png','gif','webp'].includes(ext);
                  return (
                    <button
                      key={i}
                      onClick={() => onPreview(url)}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-600 hover:border-primary hover:text-primary transition-all"
                    >
                      {isImage ? <Eye size={13} /> : <FileText size={13} />}
                      {isImage ? `Image ${i+1}` : `${ext.toUpperCase()} ${i+1}`}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="px-8 pb-6">
          <button onClick={onClose} className="btn-primary w-full py-3.5 text-sm rounded-2xl">Close</button>
        </div>
      </div>
    </div>
  );
}

function BatchPaymentModal({ selectedItems, onClose, onSave }) {
  const totalPaid = selectedItems.reduce((acc, item) => acc + parseFloat(item.amountPaid || 0), 0);
  const totalAmount = selectedItems.reduce((acc, item) => acc + parseFloat(item.amount || 0), 0);
  const totalDue = Math.max(0, totalAmount - totalPaid);

  const [form, setForm] = useState({
    amount: totalDue.toFixed(2),
    method: 'Cash',
    notes: '',
    files: []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="modal-overlay z-[100]" onClick={onClose}>
      <div className="modal-content max-w-xl bg-white flex flex-col max-h-[95vh] overflow-hidden rounded-[2rem] shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shadow-sm">
                <CreditCard size={24} />
             </div>
             <div>
                <h2 className="font-bold text-gray-900 text-2xl tracking-tight">Batch Payment</h2>
                <p className="text-xs text-gray-400 font-medium mt-0.5 tracking-wide uppercase">Processing payment for {selectedItems.length} selected items</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-50 transition-all"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 text-left">
           <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100/50">
              <div className="space-y-1">
                 <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Total Previously Paid</p>
                 <p className="text-2xl font-bold text-emerald-500 tracking-tight">BHD {(totalPaid || 0).toFixed(2)}</p>
              </div>
              <div className="space-y-1 border-l border-gray-100 pl-6">
                 <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Total Due for Selected</p>
                 <p className="text-2xl font-bold text-rose-500 tracking-tight">BHD {(totalDue || 0).toFixed(2)}</p>
              </div>
           </div>
           <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-xs font-bold text-gray-800 block pl-1">Total Payment Amount (BHD) *</label>
                 <div className="relative">
                    <input 
                      required
                      type="number"
                      step="0.001"
                      value={form.amount}
                      onChange={e => setForm({ ...form, amount: e.target.value })}
                      className="input h-14 w-full rounded-2xl border-gray-200 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-gray-700"
                    />
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-xs font-bold text-gray-800 block pl-1">Payment Method *</label>
                 <select 
                   value={form.method}
                   onChange={e => setForm({ ...form, method: e.target.value })}
                   className="input h-14 w-full rounded-2xl border-gray-200 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-gray-700"
                 >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-xs font-bold text-gray-800 block pl-1">Notes (Optional)</label>
                 <textarea 
                   rows="3"
                   className="input py-4 w-full rounded-2xl border-gray-200 focus:ring-orange-500/20 text-sm"
                   value={form.notes}
                   onChange={e => setForm({ ...form, notes: e.target.value })}
                 />
              </div>
              
              <div className="space-y-4 pt-2">
                 <div className="flex items-center gap-2">
                    <FileText size={16} className="text-gray-700" />
                    <h3 className="text-sm font-bold text-gray-800 tracking-tight">Batch Payment Documents & Receipts</h3>
                 </div>
                 <FileUpload 
                   label="Upload Attachment"
                   value={form.files}
                   multiple={true}
                   onChange={(files) => setForm(prev => ({ ...prev, files: Array.isArray(files) ? files : [files] }))}
                   accept="image/*,application/pdf"
                 />
                 <p className="text-[11px] text-gray-400 font-medium italic text-center">These files will be attached to all payment records created in this batch.</p>
              </div>
           </div>
           
           <div className="flex justify-end pt-4">
              <button type="submit" className="w-full py-5 rounded-[2rem] bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-xl shadow-orange-200 transition-all active:scale-95 text-lg">
                 Process Batch Payment
              </button>
           </div>
        </form>
      </div>
    </div>
  );
}

export default function Expenses() {
  const { checkPermission } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIDs, setSelectedIDs] = useState([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); 
  const [editItem, setEditItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [importing, setImporting] = useState(false);
  const [showImportSuccess, setShowImportSuccess] = useState(false);
  const [customCategories, setCustomCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [payStatusFilter, setPayStatusFilter] = useState('All');
  const [branchFilterExp, setBranchFilterExp] = useState('All');
  const [dateFromExp, setDateFromExp] = useState('');
  const [dateToExp, setDateToExp] = useState('');
  const fileInputRef = useRef(null);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await API.get('/categories?module=VENDOR');
      setCustomCategories(res.data.map(c => c.name));
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchCategories();
  }, [fetchCategories]);

  const allCategories = useMemo(() => {
    return Array.from(new Set([...DEFAULT_VENDOR_CATEGORIES, ...customCategories]));
  }, [customCategories]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [expensesRes, vendorsRes] = await Promise.all([
        API.get('/expenses'),
        API.get('/vendors')
      ]);
      setExpenses(expensesRes.data.map(exp => {
        const amt = parseFloat(exp.amount) || 0;
        const paid = parseFloat(exp.amountPaid) || 0;
        return {
          ...exp,
          vendorName: exp.vendor?.name || 'N/A',
          vendorCategory: exp.category,
          date: exp.expenseDate ? new Date(exp.expenseDate).toLocaleDateString('en-CA') : '',
          amount: amt,
          paidAmount: paid,
          remainingAmount: Math.max(0, amt - paid),
          branch: exp.branch || 'Tubli Branch',
          paymentStatus: exp.paymentStatus === 'PAID' ? 'Paid' : (exp.paymentStatus === 'PARTIAL' ? 'Partial' : 'Pending'),
          attachments: (exp.documents || []).map(doc => {
            const url = doc.fileUrl || '';
            return url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
          })
        };
      }));
      setVendors(vendorsRes.data);
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = expenses.filter(e => {
    const matchSearch = !search || 
      (e.vendor?.name && e.vendor.name.toLowerCase().includes(search.toLowerCase())) ||
      (e.vendorName && e.vendorName.toLowerCase().includes(search.toLowerCase())) ||
      (e.invoiceNumber && e.invoiceNumber.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = categoryFilter === 'All' || e.vendorCategory === categoryFilter;
    const matchPayStatus = payStatusFilter === 'All' || e.paymentStatus === payStatusFilter;
    const matchBranch = branchFilterExp === 'All' || e.branch === branchFilterExp;
    
    // Robust date filtering using local date string comparison
    const expenseDateStr = e.date || ''; // Already local YYYY-MM-DD from mapping
    const matchDateFrom = !dateFromExp || (expenseDateStr && expenseDateStr >= dateFromExp);
    const matchDateTo = !dateToExp || (expenseDateStr && expenseDateStr <= dateToExp);
    
    return matchSearch && matchCategory && matchPayStatus && matchBranch && matchDateFrom && matchDateTo;
  });

  const totalOutstanding = expenses.reduce((a, e) => a + (e.remainingAmount || 0), 0);
  const totalSettled = expenses.reduce((a, e) => a + (e.paidAmount || 0), 0);

  const handleSave = async (form) => {
    try {
      const payload = {
        title: `${form.vendorCategory} - ${form.invoiceNumber || 'Expense'}`,
        vendorId: parseInt(form.vendorId),
        category: form.vendorCategory,
        amount: parseFloat(form.amount),
        expenseDate: new Date(form.date).toISOString(),
        invoiceNumber: form.invoiceNumber,
        branch: form.branch,
        status: form.paymentStatus === 'Paid' ? 'PAID' : 'PENDING',
        paymentStatus: form.paymentStatus === 'Paid' ? 'PAID' : 'PENDING',
        notes: form.notes
      };

      let savedId = editItem?.id;
      if (editItem) {
        await API.put(`/expenses/${editItem.id}`, payload);
      } else {
        const res = await API.post('/expenses', payload);
        savedId = res.data.id;
      }

      // Upload any pending files and link to this expense
      if (form.pendingFiles && form.pendingFiles.length > 0 && savedId) {
        for (const fileObj of form.pendingFiles) {
          const file = fileObj.file;
          const fd = new FormData();
          fd.append('file', file);
          fd.append('title', fileObj.name || file.name);
          fd.append('category', 'Expense');
          fd.append('expenseId', savedId);
          await API.post('/documents/upload', fd);
        }
      }

      fetchData();
      setModal(null);
      setEditItem(null);
    } catch (err) {
      console.error('Error saving expense:', err);
    }
  };

  const deleteExpense = async () => {
    if (confirmDelete) {
      try {
        await API.delete(`/expenses/${confirmDelete}`);
        fetchData();
        setConfirmDelete(null);
      } catch (err) {
        console.error('Error deleting expense:', err);
      }
    }
  };

  const handleExport = () => {
    exportToCSV(expenses, 'Expenses_Report');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const toggleSelect = (id) => {
    setSelectedIDs(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBatchPayment = async (paymentData) => {
    try {
      const res = await API.post('/expenses/batch-payment', {
        expenseIds: selectedIDs,
        amount: parseFloat(paymentData.amount),
        method: paymentData.method,
        notes: paymentData.notes
      });

      // Upload documents and link to each created payment
      const createdPayments = Array.isArray(res.data) ? res.data : [];
      if (paymentData.files && paymentData.files.length > 0 && createdPayments.length > 0) {
        for (const payment of createdPayments) {
          for (const fileObj of paymentData.files) {
            const file = fileObj.file;
            if (!file) continue;
            const fd = new FormData();
            fd.append('file', file);
            fd.append('title', fileObj.name || file.name);
            fd.append('category', 'Payment');
            fd.append('paymentId', payment.id.toString());
            await API.post('/documents/upload', fd);
          }
        }
      }

      fetchData();
      setSelectedIDs([]);
      setShowBatchModal(false);
    } catch (err) {
      console.error('Error processing batch payment:', err);
    }
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
          
          if (data && data.length > 0) {
            const formatted = data
              .filter(row => row.vendor || row.Vendor || row.name || row.Name)
              .map((row, index) => ({
                id: Date.now() + index,
                date: row.date || row.Date || new Date().toISOString().split('T')[0],
                branch: row.branch || row.Branch || 'Tubli Branch',
                vendorCategory: row.vendorCategory || row.Category || 'Others',
                vendor: row.vendor || row.Vendor || row.name || row.Name || 'Unknown',
                invoiceNumber: row.invoiceNumber || row.Invoice || `INV-${Date.now()}`,
                amount: parseFloat((row.amount || row.Amount || "0").toString().replace(/,/g, '')),
                paymentStatus: row.paymentStatus || row.Status || 'Unpaid',
                attachments: []
              }));
              
            if (formatted.length > 0) {
              // Send to backend
              API.post('/expenses/import', formatted)
                .then(() => {
                  fetchData();
                  setSearch('');
                  setShowImportSuccess(true);
                  setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }, 100);
                })
                .catch(err => {
                  console.error('Error importing to backend:', err);
                  alert(err.response?.data?.message || "Failed to save imported data to database");
                })
                .finally(() => {
                  setImporting(false);
                });
            } else {
              alert("No valid data found in file");
              setImporting(false);
            }
          }
        } catch(err) {
          console.error('Error importing Excel file:', err);
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
      {viewItem && <ViewExpenseModal item={viewItem} onClose={() => setViewItem(null)} onPreview={setPreviewFile} />}
      {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
      {(modal === 'add' || editItem) && (
        <ExpenseModal 
          item={editItem} 
          vendors={vendors}
          categories={allCategories}
          onClose={() => { setModal(null); setEditItem(null); }} 
          onSave={handleSave} 
          onPreview={setPreviewFile} 
        />
      )}
      {showBatchModal && (
        <BatchPaymentModal
          selectedItems={expenses.filter(e => selectedIDs.includes(e.id))}
          onClose={() => setShowBatchModal(false)}
          onSave={handleBatchPayment}
        />
      )}
      {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
      <ConfirmModal 
        isOpen={!!confirmDelete}
        title="Remove Expense?"
        message="Are you sure you want to delete this expense record? This will affect your financial reports."
        onConfirm={deleteExpense}
        onCancel={() => setConfirmDelete(null)}
      />

      <ConfirmModal 
        isOpen={showImportSuccess}
        title="Import Successful"
        message="Your expenses data has been processed and imported successfully into the system."
        onConfirm={() => setShowImportSuccess(false)}
        confirmText="Perfect"
        showCancel={false}
      />

      {(importing || loading) && (
        <div className="fixed inset-0 z-[200] bg-white/60 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-primary animate-pulse uppercase tracking-widest">{importing ? 'Processing Import...' : 'Loading Expenses...'}</p>
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
          <h1 className="section-title text-xl md:text-2xl font-bold">Expenses</h1>
          <p className="section-subtitle text-xs md:text-sm text-gray-400">{expenses.length} total records</p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          {selectedIDs.length > 0 && checkPermission('payments', 'create') && (
            <button onClick={() => setShowBatchModal(true)} className="btn-primary bg-emerald-500 hover:bg-emerald-600 border-none col-span-2 sm:w-auto justify-center py-2.5 text-xs md:text-sm font-bold shadow-md shadow-emerald-500/20 gap-2">
              <CheckCircle size={18} /> Pay Selected ({selectedIDs.length})
            </button>
          )}
          {checkPermission('expenses', 'create') && (
            <>
              <button onClick={() => setModal('add')} className="btn-primary col-span-2 sm:w-auto order-first sm:order-last justify-center py-2.5 text-xs md:text-sm font-bold shadow-md shadow-primary/20 gap-2">
                <Plus size={18} /> New Expense
              </button>
              <button onClick={handleImportClick} className="btn-ghost btn-sm border border-gray-100 justify-center py-2 text-[10px] md:text-sm flex-grow sm:flex-grow-0">
                <Upload size={14} /> Import
              </button>
            </>
          )}
          {checkPermission('expenses', 'export') && (
            <button onClick={handleExport} className="btn-ghost btn-sm border border-gray-100 justify-center py-2 text-[10px] md:text-sm flex-grow sm:flex-grow-0">
              <Download size={14} /> Export
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Volume', value: expenses.reduce((a,e)=>a+e.amount,0).toLocaleString(), color: 'slate', icon: <CreditCard size={18} /> },
          { label: 'Settled', value: totalSettled.toLocaleString(), color: 'emerald', icon: <CheckCircle size={18} /> },
          { label: 'Outstanding', value: totalOutstanding.toLocaleString(), color: 'rose', icon: <AlertCircle size={18} /> },
          { label: 'Recordings', value: expenses.length, color: 'orange', icon: <FileText size={18} /> }
        ].map((stat, i) => (
          <div key={i} className={`relative overflow-hidden group p-5 rounded-[1.5rem] border border-white shadow-lg shadow-gray-100/20 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl hover:shadow-gray-200/30 bg-gradient-to-br ${
            stat.color === 'slate' ? 'from-slate-50 to-gray-100/50' : 
            stat.color === 'emerald' ? 'from-emerald-50 to-teal-100/30' : 
            stat.color === 'rose' ? 'from-rose-50 to-pink-100/30' : 
            'from-orange-50 to-amber-100/30'
          } animate-in fade-in slide-in-from-bottom-4`} style={{ animationDelay: `${i * 100}ms` }}>
             <div className="relative z-10 flex flex-col justify-between h-full">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 shadow-sm transition-transform duration-500 group-hover:scale-110 ${
                  stat.color === 'slate' ? 'bg-slate-100 text-slate-600' : 
                  stat.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' : 
                  stat.color === 'rose' ? 'bg-rose-100 text-rose-600' : 
                  'bg-orange-100 text-orange-600'
                }`}>
                   {stat.icon}
                </div>
                <div>
                   <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-60 ${
                     stat.color === 'slate' ? 'text-slate-500' : stat.color === 'emerald' ? 'text-emerald-700' : stat.color === 'rose' ? 'text-rose-700' : 'text-orange-700'
                   }`}>{stat.label}</p>
                   <p className={`text-2xl font-black tracking-tight flex items-baseline gap-1.5 ${
                     stat.color === 'slate' ? 'text-slate-900' : stat.color === 'emerald' ? 'text-emerald-900' : stat.color === 'rose' ? 'text-rose-900' : 'text-orange-900'
                   }`}>
                     {stat.label !== 'Recordings' && <span className="text-[10px] opacity-40 uppercase font-black">BHD</span>}
                     {stat.value}
                   </p>
                </div>
             </div>
             {/* Background Decorative Icon */}
             <div className={`absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.07] group-hover:scale-110 transition-all duration-700 pointer-events-none ${
                stat.color === 'slate' ? 'text-slate-900' : stat.color === 'emerald' ? 'text-emerald-900' : stat.color === 'rose' ? 'text-rose-900' : 'text-orange-900'
             }`}>
                {React.cloneElement(stat.icon, { size: 100 })}
             </div>
          </div>
        ))}
      </div>

      {/* Search & Filtering Area */}
      <div className="bg-white/50 backdrop-blur-md p-3 rounded-[1.5rem] border border-gray-100 shadow-sm">
        <div className="flex flex-col gap-3">
          {/* Row 1: Search */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 h-11 w-full focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary transition-all group shadow-inner">
              <Search size={18} className="text-gray-300 group-focus-within:text-primary transition-colors shrink-0" />
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Filter by vendor or invoice..." 
                className="w-full bg-transparent border-none outline-none focus:ring-0 text-sm font-semibold text-gray-700 p-0 placeholder:text-gray-400" 
              />
            </div>
            <div className="hidden sm:block">
               <span className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">Found: {filtered.length} entries</span>
            </div>
          </div>
          {/* Row 2: Filters */}
          <div className="flex flex-wrap gap-2">
            {/* Vendor Category */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="h-9 appearance-none bg-gray-50 border border-gray-100 rounded-xl px-3 pr-7 text-[11px] font-bold text-gray-600 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all cursor-pointer"
            >
              <option value="All">All Categories</option>
              {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {/* Paid / Unpaid */}
            <select
              value={payStatusFilter}
              onChange={e => setPayStatusFilter(e.target.value)}
              className="h-9 appearance-none bg-gray-50 border border-gray-100 rounded-xl px-3 pr-7 text-[11px] font-bold text-gray-600 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all cursor-pointer"
            >
              <option value="All">All Payments</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Unpaid</option>
            </select>
            {/* Branch */}
            <select
              value={branchFilterExp}
              onChange={e => setBranchFilterExp(e.target.value)}
              className="h-9 appearance-none bg-gray-50 border border-gray-100 rounded-xl px-3 pr-7 text-[11px] font-bold text-gray-600 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all cursor-pointer"
            >
              <option value="All">All Branches</option>
              <option value="Tubli Branch">Tubli Branch</option>
              <option value="Manama Branch">Manama Branch</option>
            </select>
            {/* Date Range with labels */}
            <div className="flex items-center gap-1.5">
               <div className="relative group">
                 <span className="absolute -top-3 left-2 text-[8px] font-black text-gray-400 uppercase tracking-widest bg-white rounded-sm px-1.5 z-10 border border-gray-100/50">From</span>
                 <input
                   type="date"
                   value={dateFromExp}
                   onChange={e => setDateFromExp(e.target.value)}
                   className="h-9 bg-gray-50 border border-gray-100 rounded-xl px-2 text-[11px] font-bold text-gray-600 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all cursor-pointer w-28 shadow-inner"
                 />
               </div>
               <div className="relative group">
                 <span className="absolute -top-3 left-2 text-[8px] font-black text-gray-400 uppercase tracking-widest bg-white rounded-sm px-1.5 z-10 border border-gray-100/50">To</span>
                 <input
                   type="date"
                   value={dateToExp}
                   onChange={e => setDateToExp(e.target.value)}
                   className="h-9 bg-gray-50 border border-gray-100 rounded-xl px-2 text-[11px] font-bold text-gray-600 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all cursor-pointer w-28 shadow-inner"
                 />
               </div>
            </div>
            {/* Clear Filters */}
            {(categoryFilter !== 'All' || payStatusFilter !== 'All' || branchFilterExp !== 'All' || dateFromExp || dateToExp) && (
              <button
                onClick={() => { setCategoryFilter('All'); setPayStatusFilter('All'); setBranchFilterExp('All'); setDateFromExp(''); setDateToExp(''); }}
                className="h-9 px-3 rounded-xl text-[11px] font-bold text-rose-500 bg-rose-50 border border-rose-100 hover:bg-rose-100 transition-all"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop View: Table */}
      <div className="hidden md:block bg-white rounded-[2rem] overflow-hidden shadow-xl shadow-gray-200/20 border border-gray-100">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-4 py-5 w-10">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                    checked={filtered.length > 0 && selectedIDs.length === filtered.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIDs(filtered.map(f => f.id));
                      } else {
                        setSelectedIDs([]);
                      }
                    }}
                  />
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Transaction</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Entity / Category</th>
                <th className="hidden lg:table-cell px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Invoice Ref</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((e, idx) => (
                <tr key={e.id} className="hover:bg-gray-50/50 transition-colors group animate-in slide-in-from-right-2 duration-300" style={{ animationDelay: `${idx * 30}ms` }}>
                  <td className="px-4 py-4">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                      checked={selectedIDs.includes(e.id)}
                      onChange={() => toggleSelect(e.id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[11px] font-black text-gray-400 group-hover:text-primary transition-colors">{e.date}</p>
                    <p className="text-[9px] font-bold text-gray-300 uppercase mt-0.5 tracking-tight">{e.branch}</p>
                  </td>
                  <td className="px-6 py-4 text-left">
                    <div className="space-y-1">
                      <p className="text-sm font-black text-gray-800 tracking-tight">{e.vendor?.name || 'N/A'}</p>
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-[9px] font-black uppercase tracking-widest inline-block">{e.vendorCategory}</span>
                    </div>
                  </td>
                  <td className="hidden lg:table-cell px-6 py-4">
                    <p className="font-mono text-[10px] text-primary bg-primary/5 px-2.5 py-1.5 rounded-lg border border-primary/10 inline-block font-bold">#{e.invoiceNumber}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="text-[10px] text-gray-300 font-black">BHD</span>
                      <p className="text-sm font-black text-gray-900 tracking-tight">{(e.amount || 0).toLocaleString()}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                      e.paymentStatus === 'Paid' 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-100/50' 
                        : e.paymentStatus === 'Partial'
                          ? 'bg-amber-50 text-amber-600 border-amber-100 shadow-sm shadow-amber-100/50'
                          : 'bg-rose-50 text-rose-600 border-rose-100 shadow-sm shadow-rose-100/50'
                    }`}>
                      {e.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setViewItem(e)} className="w-9 h-9 rounded-xl text-gray-400 hover:text-primary hover:bg-primary/5 transition-all border border-transparent hover:border-primary/10 flex items-center justify-center shadow-sm hover:shadow-md" title="View">
                        <Eye size={14} />
                      </button>
                      {checkPermission('expenses', 'update') && (
                        <button onClick={() => { setEditItem(e); setModal('edit'); }} className="w-9 h-9 rounded-xl text-gray-400 hover:text-secondary hover:bg-orange-50 transition-all border border-transparent hover:border-orange-100 flex items-center justify-center shadow-sm hover:shadow-md" title="Edit">
                          <Edit2 size={14} />
                        </button>
                      )}
                      {checkPermission('expenses', 'delete') && (
                        <button onClick={() => setConfirmDelete(e.id)} className="w-9 h-9 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100 flex items-center justify-center shadow-sm hover:shadow-md" title="Delete">
                          <Trash2 size={14} />
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

      {/* Mobile View: Card List */}
      <div className="md:hidden space-y-4">
        {filtered.map((e, idx) => (
          <div key={e.id} className="bg-white rounded-[2rem] p-5 border border-gray-100 shadow-xl shadow-gray-200/10 active:scale-[0.98] transition-all duration-150 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${idx * 50}ms` }}>
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500 mr-2"
                    checked={selectedIDs.includes(e.id)}
                    onChange={() => toggleSelect(e.id)}
                  />
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{e.vendorCategory}</span>
                </div>
                <h3 className="font-black text-gray-800 text-base leading-tight tracking-tight">{e.vendor?.name || 'N/A'}</h3>
                <p className="text-[10px] text-primary font-bold bg-primary/5 px-2 py-0.5 rounded-md inline-block">#{e.invoiceNumber}</p>
              </div>
              <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                e.paymentStatus === 'Paid' 
                  ? 'border-emerald-100 bg-emerald-50 text-emerald-600' 
                  : e.paymentStatus === 'Partial'
                    ? 'border-amber-100 bg-amber-50 text-amber-600'
                    : 'border-rose-100 bg-rose-50 text-rose-600'
              }`}>
                {e.paymentStatus}
              </span>
            </div>

            <div className="bg-gray-50/50 rounded-2xl p-4 flex items-center justify-between border border-gray-100">
               <div className="flex flex-col gap-1">
                 <div className="flex items-center gap-2">
                   <Calendar size={12} className="text-gray-300" />
                   <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tighter">{e.date}</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <MapPin size={12} className="text-gray-300" />
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{e.branch}</span>
                 </div>
               </div>
               <div className="text-right">
                 <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Payment</p>
                 <p className="text-lg font-black text-gray-900 tracking-tight leading-none"><span className="text-[10px] text-gray-300 mr-1 uppercase">BHD</span>{(e.amount || 0).toLocaleString()}</p>
               </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-4 pt-1 border-t border-gray-50">
                <button onClick={() => setViewItem(e)} className="w-11 h-11 rounded-2xl bg-primary/5 text-primary flex items-center justify-center hover:bg-primary/10 transition-all shadow-sm active:scale-90 border border-primary/10" title="View">
                  <Eye size={18} />
                </button>
                <button onClick={() => { setEditItem(e); setModal('edit'); }} className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-all shadow-sm active:scale-90 border border-blue-100" title="Edit">
                  <Edit2 size={18} />
                </button>
                <button onClick={() => setConfirmDelete(e.id)} className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-all shadow-sm active:scale-90 border border-rose-100" title="Delete">
                  <Trash2 size={18} />
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
