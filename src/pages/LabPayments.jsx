import React, { useState, useMemo, useEffect } from 'react';
import API, { BACKEND_URL } from '../api';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, Eye, Trash2, Calendar, CreditCard, ChevronRight, ChevronDown, X, FileText, CheckCircle2, FlaskConical, Download, TrendingUp, Hash, Activity, Store } from 'lucide-react';
import { format } from 'date-fns';
import FileUpload from '../components/FileUpload';
import FilePreviewModal from '../components/FilePreviewModal';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

function StatusBadge({ status }) {
  const isPaid = status === 'Paid' || status === 'Completed';
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-tight ${
      isPaid ? 'bg-blue-900 text-white' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
    }`}>
      {status}
    </span>
  );
}

function AddPaymentModal({ onClose, onSave, labs, labCases }) {
  const [form, setForm] = useState({
    labId: '',
    invoiceNumber: '',
    paymentDate: format(new Date(), 'yyyy-MM-dd'),
    totalAmount: '',
    selectedCases: [],
    method: 'Cash',
    attachment: null
  });

  const selectedLab = labs?.find(l => l.id === parseInt(form.labId));

  const availableCases = useMemo(() => {
    if (!form.labId) return [];
    return (labCases || []).filter(c => 
      c.laboratoryId === parseInt(form.labId) && 
      c.status === 'COMPLETED' && 
      c.paymentStatus === 'PENDING'
    );
  }, [form.labId, labs, labCases]);

  const toggleCase = (caseId) => {
    setForm(prev => ({
      ...prev,
      selectedCases: prev.selectedCases.includes(caseId)
        ? prev.selectedCases.filter(id => id !== caseId)
        : [...prev.selectedCases, caseId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.selectedCases.length === 0) {
      alert("Please select at least one lab case.");
      return;
    }
    
    try {
      await API.post('/payments/batch', {
        caseIds: form.selectedCases,
        amount: parseFloat(form.totalAmount),
        method: form.method,
        notes: `Batch payment for invoice ${form.invoiceNumber}`
      });
      onSave();
      onClose();
    } catch (err) {
      alert('Failed to record payment');
    }
  };

  return (
    <div className="modal-overlay z-[100]" onClick={onClose}>
      <div className="modal-content w-[95%] sm:max-w-2xl bg-white overflow-hidden max-h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-header px-5 py-4 md:px-6 md:py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-soft">
              <CreditCard size={18} className="md:w-[20px]" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base md:text-lg tracking-tight">Add Lab Payment</h2>
              <p className="text-[10px] md:text-xs text-white/80">Record a new payment for multiple cases</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Select Laboratory</label>
              <select
                required
                value={form.labId}
                onChange={e => setForm({ ...form, labId: e.target.value, selectedCases: [] })}
                className="select w-full bg-gray-50 border-gray-100"
              >
                <option value="">Select Lab...</option>
                {(labs || []).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Invoice Number</label>
              <input
                required
                value={form.invoiceNumber}
                onChange={e => setForm({ ...form, invoiceNumber: e.target.value })}
                placeholder="e.g. INV-224"
                className="input w-full bg-gray-50 border-gray-100"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Payment Date</label>
              <input
                type="date"
                required
                value={form.paymentDate}
                onChange={e => setForm({ ...form, paymentDate: e.target.value })}
                className="input w-full bg-gray-50 border-gray-100"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Total Amount (BHD)</label>
              <input
                type="number"
                required
                value={form.totalAmount}
                onChange={e => setForm({ ...form, totalAmount: e.target.value })}
                placeholder="0.00"
                className="input w-full bg-gray-50 border-gray-100"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Payment Method</label>
              <div className="relative">
                <select
                  required
                  value={form.method}
                  onChange={e => setForm({ ...form, method: e.target.value })}
                  className="select w-full bg-gray-50 border-gray-100 appearance-none pr-10"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" size={16} />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block">Select Lab Cases (Unpaid & Completed)</label>
            <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-2xl bg-gray-50 divide-y divide-gray-100">
              {form.labId ? (
                availableCases.length > 0 ? (
                  availableCases.map(c => (
                    <label key={c.id} className="flex items-center gap-3 p-3 hover:bg-white transition-colors cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={form.selectedCases.includes(c.id)}
                        onChange={() => toggleCase(c.id)}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20"
                      />
                      <div className="flex-1 min-w-0 py-0.5">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <p className="text-sm font-bold text-gray-800 truncate">{c.patientName}</p>
                          <span className="text-[10px] font-mono text-gray-400 font-normal">{c.patientNumber}</span>
                        </div>
                        <p className="text-[10px] text-gray-500">{c.prosthesis} • {c.deliveryDate}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Completed</span>
                      </div>
                    </label>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-400 text-xs">No unpaid completed cases found for this lab.</div>
                )
              ) : (
                <div className="p-8 text-center text-gray-400 text-xs">Please select a lab first.</div>
              )}
            </div>
            {form.selectedCases.length > 0 && (
              <p className="text-[10px] font-bold text-primary uppercase">{form.selectedCases.length} cases selected</p>
            )}
          </div>

          <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
            <FileUpload
              label="Payment Attachment / Invoice Copy"
              value={form.attachment}
              onChange={(val) => setForm(prev => ({ ...prev, attachment: val }))}
            />
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={onClose} className="btn-ghost w-full sm:flex-1 py-3 text-sm rounded-2xl order-2 sm:order-1">Cancel</button>
            <button type="submit" className="btn-primary w-full sm:flex-[2] py-3 text-sm rounded-2xl shadow-lg shadow-primary/20 order-1 sm:order-2">
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



function ViewPaymentModal({ payment, onClose }) {
  if (!payment) return null;

  const isPaid = payment.status === 'Paid' || payment.status === 'Completed';

  return (
    <div className="modal-overlay z-[100]" onClick={onClose}>
      <div className="modal-content w-[95%] sm:max-w-2xl bg-white overflow-hidden max-h-[92vh] flex flex-col rounded-[2rem] shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-header px-6 py-5 flex items-center justify-between text-white border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-soft">
              <CreditCard size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight text-white">Payment Details</h2>
              <p className="text-[10px] text-white/80 uppercase tracking-widest font-bold">Transaction Record</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/70 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-8">
          {/* Summary Card */}
          <div className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${isPaid ? 'bg-blue-900 text-white' : 'bg-emerald-100 text-emerald-600'}`}>
                {payment.type?.toLowerCase() === 'lab' ? <FlaskConical size={24} /> : <Store size={24} />}
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{payment.type} Payment</p>
                <h3 className="text-xl font-black text-gray-900 leading-tight">{payment.itemName}</h3>
              </div>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
              <p className="text-3xl font-black text-blue-900 tracking-tight">BHD {Number(payment.amount).toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Transaction Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Transaction Info</h3>
              </div>
              <div className="space-y-4 bg-white p-2 rounded-2xl">
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50">
                  <div className="flex items-center gap-3 text-gray-500">
                    <Hash size={14} />
                    <span className="text-xs font-bold">Invoice Number</span>
                  </div>
                  <span className="text-xs font-black text-gray-900">{payment.invoiceNumber || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50">
                  <div className="flex items-center gap-3 text-gray-500">
                    <Calendar size={14} />
                    <span className="text-xs font-bold">Payment Date</span>
                  </div>
                  <span className="text-xs font-black text-gray-900">{payment.date}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50">
                  <div className="flex items-center gap-3 text-gray-500">
                    <CreditCard size={14} />
                    <span className="text-xs font-bold">Payment Method</span>
                  </div>
                  <span className="text-xs font-black text-gray-900">{payment.method || 'Cash'}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50">
                  <div className="flex items-center gap-3 text-gray-500">
                    <Activity size={14} />
                    <span className="text-xs font-bold">Payment Status</span>
                  </div>
                  <StatusBadge status={payment.status || 'Paid'} />
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="space-y-4">
               <div className="flex items-center gap-2 border-l-4 border-amber-500 pl-3">
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Additional Data</h3>
               </div>
               <div className="space-y-4">
                  {payment.type?.toLowerCase() === 'lab' && (
                    <div className="p-4 bg-blue-50/30 rounded-2xl border border-blue-100/50">
                      <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-2">Linked Cases</p>
                      <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center font-black text-sm italic">
                            {payment.caseCount}
                         </div>
                         <p className="text-xs font-bold text-gray-700">This payment covers {payment.caseCount} lab reports</p>
                      </div>
                    </div>
                  )}
                  <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Internal Notes</p>
                    <p className="text-xs font-medium text-gray-600 italic">
                      {payment.notes || 'No extra notes recorded for this transaction.'}
                    </p>
                  </div>
               </div>
            </div>
          </div>

          {/* Attachment Preview (if exists) */}
          {payment.originalData?.documents?.length > 0 && (
            <div className="space-y-4">
               <div className="flex items-center gap-2 border-l-4 border-primary pl-3">
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Attachments ({payment.originalData.documents.length})</h3>
               </div>
               <div className="grid gap-3">
                 {payment.originalData.documents.map((doc, idx) => {
                   let fileUrl = doc.fileUrl;
                   if (fileUrl && fileUrl.startsWith('/uploads')) {
                     fileUrl = `${BACKEND_URL}${fileUrl}`;
                   }
                   return (
                     <div key={idx} className="p-4 bg-white border border-gray-100 rounded-[1.5rem] flex items-center justify-between group hover:border-primary transition-all shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <FileText size={20} />
                          </div>
                          <div>
                            <p className="text-xs font-black text-gray-800">{doc.title || `Document ${idx + 1}`}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Receipt / Invoice Image</p>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            if (window.setLabPaymentsPreview) {
                               window.setLabPaymentsPreview(fileUrl);
                            } else {
                               window.open(fileUrl, '_blank');
                            }
                          }}
                          className="btn-primary py-2 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer"
                        >
                          View File
                        </button>
                     </div>
                   );
                 })}
               </div>
            </div>
          )}
        </div>

        <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="btn-primary w-full py-3.5 text-sm rounded-2xl shadow-lg shadow-primary/20">Close Record</button>
        </div>
      </div>
    </div>
  );
}

export default function LabPayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [labs, setLabs] = useState([]);
  const [labCases, setLabCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedMethod, setSelectedMethod] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingPayment, setViewingPayment] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  // Expose setPreviewFile window object for ViewPaymentModal
  useEffect(() => {
    window.setLabPaymentsPreview = setPreviewFile;
    return () => {
      delete window.setLabPaymentsPreview;
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Use individual try-catch to ensure one failure doesn't block others
      let payRes = { data: [] };
      let labRes = { data: [] };
      let caseRes = { data: [] };

      try {
        payRes = await API.get('/payments/all');
      } catch (err) {
        console.error('Fetch Payments Error:', err.response?.data || err.message);
      }

      try {
        labRes = await API.get('/labs');
      } catch (err) {
        console.warn('Fetch Labs Error (ignoring):', err.message);
      }

      try {
        caseRes = await API.get('/lab-cases');
      } catch (err) {
        console.warn('Fetch LabCases Error (ignoring):', err.message);
      }
      
      console.log('Payments loaded:', payRes.data?.length);
      setPayments(payRes.data || []);
      setLabs(labRes.data || []);
      setLabCases(caseRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return payments.filter(p => {
      const pItem = (p.itemName || '').toLowerCase();
      const pInvoice = (p.invoiceNumber || '').toLowerCase();
      const pRef = (p.referenceNumber || '').toLowerCase();
      const pId = (p.id || '').toString();
      const pNotes = (p.notes || '').toLowerCase();
      const s = search.toLowerCase();

      const matchesSearch = pItem.includes(s) || 
                           pInvoice.includes(s) || 
                           pRef.includes(s) || 
                           pId.includes(s) || 
                           pNotes.includes(s);
      
      const matchesType = selectedType === 'All' || (p.type || '').toLowerCase() === selectedType.toLowerCase();
      const matchesStatus = selectedStatus === 'All' || (p.status || '').toLowerCase() === selectedStatus.toLowerCase();
      const matchesMethod = selectedMethod === 'All' || (() => {
        const sm = selectedMethod.toLowerCase();
        const pm = (p.method || '').toLowerCase();
        if (sm === 'card') return pm === 'card' || pm === 'credit_card';
        if (sm === 'bank transfer') return pm === 'bank transfer' || pm === 'bank_transfer';
        return pm === sm;
      })();
      const matchesBranch = selectedBranch === 'all' || (p.branch || '').toLowerCase().includes(selectedBranch);
      
      return matchesSearch && matchesType && matchesStatus && matchesMethod && matchesBranch;
    });
  }, [payments, search, selectedType, selectedStatus, selectedMethod, selectedBranch]);
  const exportToExcel = () => {
    try {
      if (filtered.length === 0) {
        alert('No data found to export.');
        return;
      }

      const data = filtered.map(p => ({
        'ID': p.id,
        'Date': p.date,
        'Type': (p.type || '').toUpperCase(),
        'Reference': p.itemName,
        'Amount (BHD)': p.amount,
        'Method': p.method,
        'Status': p.status
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments');
      XLSX.writeFile(workbook, `payments_report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    } catch (error) {
      console.error('Excel Export Error:', error);
      alert('Failed to export Excel. Please check console for details.');
    }
  };

  const exportToPDF = () => {
    try {
      if (filtered.length === 0) {
        alert('No data found to export.');
        return;
      }

      const doc = new jsPDF();
      
      // Add header
      doc.setFontSize(20);
      doc.text('Payments Report', 14, 22);
      doc.setFontSize(10);
      doc.text(`Generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 14, 30);
      
      const tableData = filtered.map(p => [
        p.id,
        p.date,
        (p.type || '').toUpperCase(),
        p.itemName,
        `BHD ${p.amount}`,
        p.method,
        'Paid'
      ]);

      autoTable(doc, {
        head: [['ID', 'Date', 'Type', 'Reference', 'Amount', 'Method', 'Status']],
        body: tableData,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 138] }
      });

      doc.save(`payments_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('Failed to export PDF. Please check console for details.');
    }
  };


  const canCreate = ['admin', 'manager', 'accountant'].includes(user?.role);

  const handleSavePayment = (newPayment) => {
    setPayments(prev => [newPayment, ...prev]);
    setShowAddModal(false);
    alert(`Payment recorded! ${newPayment.caseCount} cases updated to Paid.`);
  };



  const handleDeletePayment = async (id) => {
    if (window.confirm("Are you sure you want to delete this payment record? This action cannot be undone.")) {
      try {
        await API.delete(`/payments/${id}`);
        fetchData();
      } catch (err) {
        console.error('Error deleting payment:', err);
        alert('Failed to delete payment');
      }
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {showAddModal && <AddPaymentModal labs={labs} labCases={labCases} onClose={() => setShowAddModal(false)} onSave={fetchData} />}
      {viewingPayment && <ViewPaymentModal payment={viewingPayment} onClose={() => setViewingPayment(null)} />}
      {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">All Payments</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Comprehensive view of all financial transactions</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Branch Selector */}
          <div className="relative group">
            <button className="bg-white border border-gray-200 px-6 py-2.5 rounded-xl shadow-sm font-bold text-sm transition-all hover:bg-gray-50 flex items-center gap-2 text-gray-700 min-w-[140px] border-orange-100 ring-2 ring-orange-500/5">
              <span className="flex-1 text-left">{selectedBranch === 'all' ? 'All Branches' : selectedBranch === 'tubli' ? 'Tubli Branch' : 'Manama Branch'}</span>
              <ChevronDown size={16} className="text-gray-400 group-hover:rotate-180 transition-transform" />
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 hidden group-hover:block z-[60] animate-in fade-in slide-in-from-top-2">
              <button 
                onClick={() => setSelectedBranch('all')} 
                className={`w-full px-4 py-2.5 text-left text-xs font-bold transition-colors ${selectedBranch === 'all' ? 'bg-blue-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                All Branches
              </button>
              <button 
                onClick={() => setSelectedBranch('tubli')} 
                className={`w-full px-4 py-2.5 text-left text-xs font-bold transition-colors ${selectedBranch === 'tubli' ? 'bg-blue-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Tubli Branch
              </button>
              <button 
                onClick={() => setSelectedBranch('manama')} 
                className={`w-full px-4 py-2.5 text-left text-xs font-bold transition-colors ${selectedBranch === 'manama' ? 'bg-blue-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Manama Branch
              </button>
            </div>
          </div>

          {/* Export Excel */}
          <button 
            onClick={exportToExcel} 
            className="bg-white border border-gray-200 px-5 py-2.5 rounded-xl shadow-sm transition-all hover:bg-gray-50 flex items-center gap-3 text-gray-700 min-h-[50px]"
          >
            <Download size={18} className="text-gray-400" />
            <div className="flex flex-col items-start leading-[1.1]">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Export</span>
              <span className="text-sm font-black text-gray-800">Excel</span>
            </div>
          </button>

          {/* Export PDF */}
          <button 
            onClick={exportToPDF} 
            className="bg-white border border-gray-200 px-5 py-2.5 rounded-xl shadow-sm transition-all hover:bg-gray-50 flex items-center gap-3 text-gray-700 min-h-[50px]"
          >
            <Download size={18} className="text-gray-400" />
            <span className="text-sm font-black text-gray-800 flex items-center gap-2">
              Export PDF
            </span>
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden border-t-4 border-t-orange-500">
        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30 flex items-center gap-2">
          <TrendingUp size={18} className="text-orange-500 rotate-180" style={{ transform: 'rotate(180deg)' }} />
          <h3 className="font-bold text-gray-800 text-sm">Advanced Filters</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by ID or notes..."
              className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/10 transition-all placeholder:text-gray-300"
            />
          </div>
          <select 
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/10 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat"
          >
            <option value="All">All Types</option>
            <option value="lab">Lab Case</option>
            <option value="expense">Vendor Payment</option>
          </select>
          <select 
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/10 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat"
          >
            <option value="All">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </select>
          <select 
            value={selectedMethod}
            onChange={e => setSelectedMethod(e.target.value)}
            className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/10 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat"
          >
            <option value="All">All Methods</option>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cheque">Cheque</option>
          </select>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <p className="text-xs font-bold text-gray-400">Showing 1 to {filtered.length} of {filtered.length} entries</p>
          <div className="flex items-center gap-3">
             <select className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 text-[10px] font-bold text-gray-600 focus:outline-none">
               <option>Date (Newest)</option>
               <option>Date (Oldest)</option>
             </select>
             <select className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 text-[10px] font-bold text-gray-600 focus:outline-none">
               <option>25 / pg</option>
               <option>50 / pg</option>
             </select>
          </div>
        </div>
        <div className="overflow-x-auto overflow-y-auto max-h-[60vh] scrollbar-hide">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Payment ID</th>
                <th className="px-4 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Date</th>
                <th className="px-4 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Type & Item</th>
                <th className="px-4 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Amount</th>
                <th className="px-4 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Method</th>
                <th className="px-4 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Status</th>
                <th className="px-4 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Files</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(filtered || []).length === 0 && (
                <tr><td colSpan={8} className="text-center text-gray-400 py-16">No payment records found.</td></tr>
              )}
              {(filtered || []).map(p => (
                <tr key={p.id} className="group hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-5">
                    <span className="text-xs font-medium text-gray-400 block tracking-tight group-hover:text-blue-900 transition-colors">
                      {p.id.toString().length > 10 ? p.id.toString().slice(0, 12) + '...' : `p${p.id}zb8nz0mt`}
                    </span>
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar size={14} className="text-gray-300" />
                      <span className="text-xs font-bold">{p.date}</span>
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <div className="space-y-1">
                      <span className={`px-2 py-0.5 rounded-full ${p.type === 'LAB' ? 'bg-blue-50 text-blue-900 border-blue-100' : 'bg-purple-50 text-purple-900 border-purple-100'} text-[10px] font-bold border tracking-tight uppercase`}>
                        {p.type}
                      </span>
                      <p className="text-[10px] font-black text-gray-900 pl-1 truncate max-w-[150px]">{p.itemName}</p>
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <p className="text-sm font-black text-gray-900 tracking-tight">BHD {p.amount}</p>
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-2 text-gray-500">
                      <CreditCard size={14} className="text-gray-300" />
                      <span className="text-[11px] font-bold">{p.method}</span>
                    </div>
                  </td>
                  <td className="px-4 py-5 text-center">
                    <StatusBadge status={p.status || 'Paid'} />
                  </td>
                  <td className="px-4 py-5 text-center">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-50 border border-gray-100">
                      <FileText size={12} className="text-gray-300" />
                      <span className="text-[10px] font-bold text-gray-400">{p.originalData?.documents?.length || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-3 opacity-30 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setViewingPayment(p)} className="text-emerald-600 hover:scale-110 transition-all"><Eye size={16} /></button>
                      <button onClick={() => handleDeletePayment(p.id)} className="text-red-500 hover:scale-110 transition-all"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-4 max-h-[60vh] overflow-y-auto scrollbar-hide py-2">
        {filtered.length === 0 && <div className="card text-center py-10 text-gray-400">No payment records found</div>}
        {filtered.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4 relative overflow-hidden border-t-4 border-t-orange-500 active:scale-[0.98] transition-transform duration-100">
             <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 block tracking-tight">
                    {p.id.toString().length > 10 ? p.id.toString().slice(0, 12) + '...' : `p${p.id}zb8nz0mt`}
                  </span>
                  <div className="flex flex-col gap-1 mt-1">
                    <span className={`w-fit px-2 py-0.5 rounded-md ${p.type === 'LAB' ? 'bg-blue-50 text-blue-900 border-blue-100' : 'bg-purple-50 text-purple-900 border-purple-100'} text-[9px] font-bold border uppercase tracking-tight`}>
                      {p.type}
                    </span>
                    <span className="text-[10px] font-black text-gray-900 truncate max-w-[120px]">{p.itemName}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-gray-900">BHD {p.amount}</p>
                  <div className="flex items-center gap-1.5 justify-end mt-1">
                    <Calendar size={12} className="text-gray-300" />
                    <span className="text-[10px] font-bold text-gray-500">{p.date}</span>
                  </div>
                </div>
             </div>

             <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <StatusBadge status={p.status || 'Paid'} />
                   <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-gray-50 border border-gray-100">
                      <FileText size={10} className="text-gray-300" />
                      <span className="text-[9px] font-bold text-gray-400">{p.originalData?.documents?.length || 0}</span>
                   </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setViewingPayment(p)} className="text-emerald-600"><Eye size={16} /></button>
                  <button onClick={() => handleDeletePayment(p.id)} className="text-red-500"><Trash2 size={16} /></button>
                </div>
             </div>
          </div>
        ))}
      </div>

    </div>
  );
}
