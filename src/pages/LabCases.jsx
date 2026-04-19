import React, { useState, useRef, useEffect } from 'react';
import { LAB_CASES, LABS } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { Search, Filter, Download, Eye, Edit2, Trash2, CheckCircle, FlaskConical, Plus, Calendar, MapPin, Hash, User, Activity, CreditCard, ChevronRight, Clock, Camera, Upload, X as CloseIcon, CheckCircle2, ArrowUpRight, ArrowDownLeft, Layers, FileText } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import ConfirmModal from '../components/ConfirmModal';
import FilePreviewModal from '../components/FilePreviewModal';
import { exportToCSV } from '../utils/exportUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import FileUpload from '../components/FileUpload';
import CategoryManagerModal from '../components/CategoryManagerModal';
import API, { BACKEND_URL } from '../api';

function StatusBadge({ status }) {
  const map = {
    'Pending': 'bg-amber-50 text-amber-600 border-amber-100',
    'Completed': 'bg-teal-50 text-teal-600 border-teal-100',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] md:text-xs font-semibold border ${map[status] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>
      {status}
    </span>
  );
}

function PayBadge({ status }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] md:text-xs font-semibold border ${status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
      {status}
    </span>
  );
}

function LabCaseModal({ caseItem, onClose, onSave, setPreviewFile, labs = [], dentists = [], customCategories = [], onManageCategories }) {
  const isEdit = !!caseItem;
  const [form, setForm] = useState(caseItem || {
    patientName: '',
    patientNumber: '',
    teethNumber: '',
    prosthesis: '',
    labId: labs[0]?.id || '',
    dentistId: dentists[0]?.id || '',
    status: 'Pending',
    paymentStatus: 'Unpaid',
    createdAt: format(new Date(), 'yyyy-MM-dd'),
    branch: 'Tubli Branch',
    totalCost: '',
    notes: '',
    images: []
  });
  const [images, setImages] = useState(form.images || []);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [logs, setLogs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loadingModalData, setLoadingModalData] = useState(false);

  useEffect(() => {
    if (caseItem?.id) {
      fetchModalData();
    }
  }, [caseItem?.id]);

  const fetchModalData = async () => {
    setLoadingModalData(true);
    try {
      const [logsRes, paymentsRes] = await Promise.all([
        API.get(`/lab-cases/${caseItem.id}/logs`),
        API.get(`/lab-cases/${caseItem.id}/payments`)
      ]);
      
      setLogs((logsRes.data || []).map(l => ({
        id: l.id,
        type: l.type,
        status: l.type === 'Pickup' ? 'SENT TO LAB' : l.type === 'Delivery' ? 'RECEIVED FROM LAB' : 'UPDATE',
        date: format(new Date(l.createdAt), 'MMM d, yyyy, h:mm a'),
        notes: l.note
      })));

      setPayments((paymentsRes.data || []).map(p => ({
        id: p.id,
        date: format(new Date(p.paymentDate), 'M/d/yyyy'),
        amount: parseFloat(p.amount).toFixed(2),
        method: p.paymentMethod,
        status: 'Paid', // Assuming any record here is a payment made
        recordedBy: 'System'
      })));
    } catch (err) {
      console.error('Error fetching modal data:', err);
    } finally {
      setLoadingModalData(false);
    }
  };
  const [newLog, setNewLog] = useState({
    type: 'Pickup',
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    notes: ''
  });

  const handleAddLog = async () => {
    if (!newLog.date || !caseItem?.id) return;
    try {
      await API.post(`/lab-cases/${caseItem.id}/logs`, {
        type: newLog.type,
        note: newLog.notes,
        createdAt: newLog.date
      });
      
      // Refetch both modal data and parent list to show updated status
      await fetchModalData();
      if (onSave) {
        // This triggers a refetch in the parent component
        onSave({ ...form, id: caseItem.id, refreshOnly: true }); 
      }

      setNewLog({
        type: 'Pickup',
        date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        notes: ''
      });
    } catch (err) {
      console.error('Error adding log:', err);
      alert('Failed to add log entry');
    }
  };

  const handleDeleteLog = (id) => {
    setLogs(prev => prev.filter(l => l.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, images, logs, payments, pendingFiles });
  };

  const PROSTHESIS_TYPES = ["Crown", "Bridge", "Denture", "Implant", "Veneer", "Inlay/Onlay", "Night Guard", "Whitening Trays", "Other"];
  const ALL_TYPES = Array.from(new Set([...PROSTHESIS_TYPES, ...customCategories]));

  return (
    <div className="modal-overlay z-[100]" onClick={onClose}>
      <div className="modal-content max-w-2xl bg-white flex flex-col max-h-[95vh] overflow-hidden rounded-[2rem] shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between font-sans shrink-0">
          <h2 className="font-bold text-gray-900 text-2xl">{isEdit ? 'Edit Lab Case' : 'Create New Lab Case'}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl transition-all hover:bg-gray-50"><CloseIcon size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 font-sans scrollbar-hide space-y-10">
          {/* Main Form Section */}
          <div className="space-y-8 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block pl-1">Patient Number *</label>
                <input
                  required
                  value={form.patientNumber}
                  onChange={e => setForm({ ...form, patientNumber: e.target.value })}
                  placeholder="e.g. PT-001"
                  className="input w-full h-12 rounded-2xl border-gray-200 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block pl-1">Patient Name *</label>
                <input
                  required
                  value={form.patientName}
                  onChange={e => setForm({ ...form, patientName: e.target.value })}
                  placeholder="Enter name"
                  className="input w-full h-12 rounded-2xl border-gray-200 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block pl-1">Creation Date *</label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={form.createdAt}
                    onChange={e => setForm({ ...form, createdAt: e.target.value })}
                    className="input w-full h-12 rounded-2xl border-gray-200 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-medium pr-10 relative z-10 bg-transparent"
                    onClick={(e) => e.target.showPicker && e.target.showPicker()}
                  />
                  <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-0" size={18} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block pl-1">Teeth Number</label>
                <input
                  value={form.teethNumber}
                  onChange={e => setForm({ ...form, teethNumber: e.target.value })}
                  placeholder="e.g. 11, 21"
                  className="input w-full h-12 rounded-2xl border-gray-200 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block pl-1">Branch *</label>
                <div className="relative">
                  <select 
                    value={form.branch} 
                    onChange={e => setForm({ ...form, branch: e.target.value })}
                    className="input h-12 w-full appearance-none bg-no-repeat rounded-2xl border-gray-200 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-medium pr-10"
                  >
                    <option value="Tubli Branch">Tubli Branch</option>
                    <option value="Manama Branch">Manama Branch</option>
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" size={18} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block pl-1">Dental Lab *</label>
                <div className="relative">
                  <select 
                    required
                    value={form.labId} 
                    onChange={e => setForm({ ...form, labId: e.target.value })}
                    className="input h-12 w-full appearance-none bg-no-repeat rounded-2xl border-gray-200 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-medium pr-10"
                  >
                    <option value="">Select Lab</option>
                    {labs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" size={18} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block pl-1">Dentist *</label>
                <div className="relative">
                  <select 
                    required
                    value={form.dentistId} 
                    onChange={e => setForm({ ...form, dentistId: e.target.value })}
                    className="input h-12 w-full appearance-none bg-no-repeat rounded-2xl border-gray-200 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-medium pr-10"
                  >
                    <option value="">Select Dentist</option>
                    {dentists.map(d => <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>)}
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" size={18} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between pl-1">
                  <label className="text-xs font-bold text-gray-700 block">Prosthesis Type *</label>
                  <button 
                    type="button"
                    onClick={() => onManageCategories?.()}
                    className="text-[10px] font-black text-orange-500 hover:underline uppercase tracking-widest flex items-center gap-1"
                  >
                    Manage
                  </button>
                </div>
                <div className="relative">
                  <select 
                    value={form.prosthesis} 
                    onChange={e => setForm({ ...form, prosthesis: e.target.value })}
                    className="input h-12 w-full appearance-none bg-no-repeat rounded-2xl border-gray-200 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-medium pr-10"
                  >
                    <option value="">Select type</option>
                    {ALL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" size={18} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block pl-1">Case Status *</label>
                <div className="relative">
                  <select 
                    value={form.status} 
                    onChange={e => setForm({ ...form, status: e.target.value })}
                    className="input h-12 w-full appearance-none bg-no-repeat rounded-2xl border-gray-200 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-medium pr-10"
                  >
                    {['Pending', 'Completed'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" size={18} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block pl-1">Total Cost (BHD)</label>
                <input
                  type="number"
                  step="0.001"
                  value={form.totalCost}
                  onChange={e => setForm({ ...form, totalCost: e.target.value })}
                  placeholder="0.000"
                  className="input w-full h-12 rounded-2xl border-gray-200 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-medium"
                />
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 block pl-1">Notes (Optional)</label>
              <textarea
                value={form.notes || ''}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Add any extra details or instructions..."
                rows="3"
                className="input w-full rounded-2xl border-gray-200 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-medium resize-none py-3"
              />
            </div>

            {/* Upload Section */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-gray-700 flex items-center gap-2 pl-1">
                <span className="text-orange-500">📎</span> Case Documents & Images
              </label>
              <div className="border-2 border-dashed border-gray-200 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center space-y-4 relative bg-gray-50/40 hover:bg-gray-50/60 transition-colors group">
                <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                  <Upload size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800 tracking-tight">Click to upload or drag and drop</p>
                  <p className="text-[11px] text-gray-400 mt-1 font-medium italic">image/*, application/pdf, .doc, .docx (Max 10MB per file)</p>
                  <p className="text-[11px] text-blue-600 font-bold mt-2 uppercase tracking-widest">{images.length} / 10 files uploaded</p>
                </div>
                <input 
                  type="file" 
                  multiple 
                  className="hidden" 
                  id="modal-file-upload" 
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    setPendingFiles(prev => [...prev, ...files]);
                    setImages(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
                    e.target.value = ''; // Reset to allow re-uploading same file
                  }}
                />
                <label htmlFor="modal-file-upload" className="absolute inset-0 cursor-pointer" />
              </div>
              
              {/* Thumbnails display */}
              {images.length > 0 && (
                <div className="flex flex-wrap gap-3 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                  {images.map((img, i) => (
                    <div key={i} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-gray-200 shadow-sm animate-fade-in">
                      <img 
                        src={img} 
                        alt="" 
                        className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform" 
                        onClick={() => setPreviewFile(img)}
                      />
                      <button
                        type="button"
                        onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      >
                        <CloseIcon size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button type="submit" className="px-10 py-4 rounded-2xl font-bold bg-orange-500 hover:bg-orange-600 text-white transition-all shadow-xl shadow-orange-200 hover:shadow-orange-300 active:scale-95 flex items-center gap-2">
                Save Case
              </button>
            </div>
          </div>

          {isEdit && (
            <div className="space-y-10 border-t border-gray-100 pt-10 mt-6 text-left">
              {/* Case Logs & History */}
              <div className="space-y-8">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                     <Clock size={20} />
                   </div>
                   <h3 className="font-bold text-gray-900 text-xl tracking-tight">Case Logs & History</h3>
                 </div>

                 <div className="bg-gray-50/80 p-5 rounded-3xl border border-gray-100/50">
                   <p className="text-xs font-medium text-gray-500">Case created on <span className="text-gray-900 font-bold">{caseItem.createdAt ? format(new Date(caseItem.createdAt), 'M/d/yyyy') : 'N/A'}</span> for Dentist: <span className="text-orange-500 font-bold hover:underline cursor-pointer">{caseItem.dentistName || 'User'}</span></p>
                 </div>

                 <div className="space-y-4">
                    {logs.map(log => (
                      <div key={log.id} className="flex items-center justify-between p-5 rounded-[2rem] border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-center gap-5">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${log.type === 'Pickup' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                             {log.type === 'Pickup' ? <ArrowUpRight size={22} /> : <ArrowDownLeft size={22} />}
                           </div>
                           <div className="space-y-1">
                              <div className="flex items-center gap-3">
                                <p className="font-bold text-gray-900 text-base">{log.type}</p>
                                <span className="bg-gray-100 px-3 py-1 rounded-xl text-[10px] font-bold text-gray-500 uppercase tracking-wider border border-gray-200/50">{log.status}</span>
                              </div>
                              <p className="text-xs text-gray-400 font-medium">{log.date}</p>
                               {log.notes && (
                                 <p className="text-xs font-semibold text-gray-600 mt-2 bg-gray-50/50 p-2 rounded-lg border border-gray-100/50 italic">
                                   "{log.notes}"
                                 </p>
                               )}
                           </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => handleDeleteLog(log.id)}
                          className="p-2.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100 shadow-sm border border-transparent hover:border-rose-100"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                 </div>

                 {/* Add Log Form */}
                 <div className="bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="space-y-2">
                          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Type</label>
                          <div className="relative">
                            <select 
                              value={newLog.type}
                              onChange={e => setNewLog({ ...newLog, type: e.target.value })}
                              className="input h-12 py-0 text-sm w-full rounded-2xl appearance-none pr-10"
                            >
                              <option value="Pickup">Pickup</option>
                              <option value="Delivery">Delivery</option>
                            </select>
                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" size={16} />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Date & Time</label>
                          <input 
                            type="datetime-local" 
                            className="input h-12 py-0 text-sm w-full rounded-2xl" 
                            value={newLog.date}
                            onChange={e => setNewLog({ ...newLog, date: e.target.value })}
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Notes</label>
                          <input 
                            placeholder="Optional notes..." 
                            className="input h-12 text-sm w-full rounded-2xl" 
                            value={newLog.notes}
                            onChange={e => setNewLog({ ...newLog, notes: e.target.value })}
                          />
                       </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={handleAddLog}
                      className="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-xl shadow-orange-200 transition-all active:scale-[0.98]"
                    >
                      Add Log Entry
                    </button>
                  </div>
              </div>

              {/* Payment History Section */}
              <div className="space-y-8">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                       <CreditCard size={20} />
                     </div>
                     <h3 className="font-bold text-gray-900 text-xl tracking-tight">Payment History</h3>
                   </div>
                 </div>

                 <div className="overflow-hidden border border-gray-100 rounded-[2rem] bg-white shadow-lg shadow-gray-50 overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="bg-gray-50/60">
                             {['Date', 'Amount', 'Method', 'Status', 'Recorded By'/*, 'Actions'*/].map(h => <th key={h} className="px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>)}
                          </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                      {(payments || []).map((p, i) => (
                         <tr key={i} className="hover:bg-gray-50/40 transition-colors group">
                           <td className="px-6 py-6 text-xs font-semibold text-gray-600 flex items-center gap-2">
                             <Calendar size={14} className="text-gray-300" />
                             {p.date}
                           </td>
                           <td className="px-6 py-6">
                             <div className="space-y-1">
                               <p className="font-bold text-gray-900 tracking-tight">BHD {p.amount}</p>
                               <p className="text-[10px] text-gray-400 font-medium">Recorded on: {p.date}</p>
                             </div>
                           </td>
                           <td className="px-6 py-6">
                             <span className="px-3 py-1.5 rounded-xl bg-gray-50 text-[10px] font-bold text-gray-600 border border-gray-100">
                               {p.method}
                             </span>
                           </td>
                           <td className="px-6 py-6">
                             <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-wider ${p.status === 'Paid' ? 'bg-[#1C3756] text-white' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                               {p.status}
                             </span>
                           </td>
                           <td className="px-6 py-6">
                             <div className="flex items-center gap-2">
                               <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 border border-white shadow-sm">
                                 {p.recordedBy.charAt(0)}
                               </div>
                               <div>
                                 <p className="text-[11px] font-bold text-gray-700">{p.recordedBy}</p>
                                 <p className="text-[10px] text-gray-400 mt-0.5 italic">Batch payment.</p>
                               </div>
                             </div>
                           </td>
                           {/* <td className="px-6 py-6">
                             <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button type="button" title="Edit Payment" className="p-2 text-indigo-500 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100"><Edit2 size={14} /></button>
                               <button type="button" title="Delete Payment" className="p-2 text-rose-500 bg-rose-50/50 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"><Trash2 size={14} /></button>
                             </div>
                           </td> */}
                         </tr>
                       ))}
                     </tbody>
                    </table>
                 </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

function ViewModal({ caseItem, onClose, userRole, onUpdateStatus, setPreviewFile }) {
  if (!caseItem) return null;
  return (
    <div className="modal-overlay z-[100]" onClick={onClose}>
      <div className="modal-content max-w-lg bg-white overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-primary px-6 py-5 flex items-center justify-between text-white font-sans">
          <div className="flex items-center gap-3">
            <Eye size={20} />
            <h2 className="font-bold text-lg">Case Overview</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg">✕</button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto scrollbar-hide p-6 space-y-4 font-sans text-left">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
              {(caseItem.patientName || 'P').charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-gray-800">{caseItem.patientName}</h3>
              <p className="text-xs font-mono text-primary uppercase">{caseItem.patientNumber}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Teeth No.', value: caseItem.teethNumber, icon: Activity },
              { label: 'Dentist', value: caseItem.dentistName, icon: User },
              { label: 'Total Cost', value: caseItem.totalCost ? `BHD ${caseItem.totalCost}` : '—', icon: CreditCard },
              { label: 'Laboratory', value: caseItem.labName, icon: FlaskConical },
              { label: 'Prosthesis', value: caseItem.prosthesis, icon: FlaskConical },
              { label: 'Created', value: caseItem.createdAt, icon: Calendar },
              { label: 'Sent', value: caseItem.sentDate || '—', icon: Clock },
              { label: 'Received', value: caseItem.receivedDate || '—', icon: Clock },
            ].map(item => (
              <div key={item.label} className="space-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{item.label}</span>
                <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                   {item.value}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-2 text-left">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Payment Status</span>
            <PayBadge status={caseItem.paymentStatus} />
          </div>

          <div className="space-y-3 pt-4 border-t border-gray-50 text-left">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Workflow Status</span>
            <div className="flex flex-wrap gap-2">
              {['Pending', 'Completed'].map(s => {
                const isAllowed = ['admin', 'manager'].includes(userRole) || 
                                 (userRole === 'secretary' && s === 'Pending') ||
                                 (userRole === 'assistant' && s === 'Pending') ||
                                 (userRole === 'dentist');
                const isCurrent = caseItem.status === s;
                return (
                  <button
                    key={s}
                    disabled={!isAllowed || isCurrent}
                    onClick={() => onUpdateStatus(caseItem.id, s)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${isCurrent ? 'bg-primary border-primary text-white shadow-md' : isAllowed ? 'bg-white border-gray-200 text-gray-600 hover:border-primary hover:text-primary cursor-pointer' : 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed opacity-50'}`}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
          </div>

          {caseItem.notes && (
            <div className="space-y-2 pt-4 border-t border-gray-50 text-left">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Notes</span>
              <p className="text-sm font-medium text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-xl border border-gray-100">{caseItem.notes}</p>
            </div>
          )}

          {caseItem.timeline && caseItem.timeline.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-gray-50 mt-4 text-left">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Case Timeline</span>
              <div className="space-y-3 pl-2">
                {caseItem.timeline.map((event, i) => (
                  <div key={i} className="relative pl-4 border-l-2 border-gray-100">
                    <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-primary ring-4 ring-white" />
                    <p className="text-sm font-bold text-gray-700 leading-tight">{event.status}</p>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">{event.date}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {caseItem.paymentStatus === 'Paid' && (
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-3 text-left">
              <div className="flex items-center gap-2 border-l-2 border-emerald-500 pl-2">
                <h4 className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Payment Information</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] text-emerald-600 font-bold uppercase">Payment ID</p>
                  <p className="text-xs font-mono font-bold text-gray-700">#PAY-99283</p>
                </div>
                <div>
                  <p className="text-[9px] text-emerald-600 font-bold uppercase">Invoice No.</p>
                  <p className="text-xs font-bold text-gray-700">INV-22485</p>
                </div>
                <div>
                  <p className="text-[9px] text-emerald-600 font-bold uppercase">Payment Date</p>
                  <p className="text-xs font-bold text-gray-700">{caseItem.createdAt || '—'}</p>
                </div>
              </div>
            </div>
          )}

          {caseItem.images && caseItem.images.length > 0 && (
            <div className="space-y-2 pt-2 text-left">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Attachments ({caseItem.images.length})</span>
              <div className="flex gap-3 flex-wrap">
                {caseItem.images.map((url, i) => {
                  const ext = url.split('?')[0].split('.').pop().toLowerCase();
                  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
                  return (
                    <div
                      key={i}
                      className="relative group w-20 h-20 rounded-xl overflow-hidden border border-gray-100 shadow-sm transition-all hover:border-primary hover:shadow-md cursor-pointer"
                      onClick={() => setPreviewFile(url)}
                    >
                      {isImage ? (
                        <img src={url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 gap-1">
                          <FileText size={24} className="text-primary" />
                          <span className="text-[9px] font-bold text-gray-500 uppercase">{ext}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <Eye size={16} className="text-white" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end font-sans">
          <button onClick={onClose} className="btn-primary px-8 py-2 text-sm rounded-xl">Got it</button>
        </div>
      </div>
    </div>
  );
}

function BatchPaymentModal({ selectedItems, onClose, onSave }) {
  const totalPaid = selectedItems.reduce((acc, item) => acc + parseFloat(item.amountPaid || 0), 0);
  const totalCost = selectedItems.reduce((acc, item) => acc + parseFloat(item.totalCost || 0), 0);
  const totalDue = Math.max(0, totalCost - totalPaid);

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
      <div className="modal-content max-w-xl bg-white overflow-hidden rounded-[2rem] shadow-2xl flex flex-col max-h-[95vh]" onClick={e => e.stopPropagation()}>
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shadow-sm">
                <Layers size={24} />
             </div>
             <div>
                <h2 className="font-bold text-gray-900 text-2xl tracking-tight">Batch Payment</h2>
                <p className="text-xs text-gray-400 font-medium mt-0.5 tracking-wide uppercase">Processing payment for {selectedItems.length} selected items</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-50 transition-all"><CloseIcon size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 font-sans scrollbar-hide space-y-8 text-left">
           <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100/50">
              <div className="space-y-1">
                 <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Total Previously Paid</p>
                 <p className="text-2xl font-bold text-emerald-500 tracking-tight">BHD {totalPaid.toFixed(2)}</p>
              </div>
              <div className="space-y-1 border-l border-gray-100 pl-6">
                 <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Total Due for Selected</p>
                 <p className="text-2xl font-bold text-rose-500 tracking-tight">BHD {totalDue.toFixed(2)}</p>
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
                 <div className="relative">
                    <select 
                      value={form.method}
                      onChange={e => setForm({ ...form, method: e.target.value })}
                      className="input h-14 w-full appearance-none rounded-2xl border-gray-200 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-gray-700 pr-10"
                    >
                       <option value="Cash">Cash</option>
                       <option value="Card">Card</option>
                       <option value="Bank Transfer">Bank Transfer</option>
                       <option value="Cheque">Cheque</option>
                    </select>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" size={18} />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-bold text-gray-800 block pl-1">Notes (Optional)</label>
                 <textarea 
                   rows="3"
                   placeholder="Add any reference numbers or details..."
                   className="input py-4 w-full rounded-2xl border-gray-200 focus:ring-orange-500/20 focus:border-orange-500 text-sm"
                   value={form.notes}
                   onChange={e => setForm({ ...form, notes: e.target.value })}
                 />
              </div>

              <div className="space-y-4">
                 <label className="text-xs font-bold text-gray-800 block pl-1 flex items-center gap-2">
                    <span className="text-orange-500">📄</span> Batch Payment Documents & Receipts
                 </label>
                 <FileUpload
                   label="Upload Attachment"
                   value={form.files}
                   multiple={true}
                   onChange={(files) => setForm(prev => ({ ...prev, files: Array.isArray(files) ? files : [files] }))}
                   accept="image/*,application/pdf"
                 />
                 <p className="text-[10px] text-gray-400 italic text-center">These files will be attached to all payment records created in this batch.</p>
              </div>
           </div>

           <div className="flex justify-end pt-4">
              <button type="submit" className="w-full py-5 rounded-[2rem] bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-xl shadow-orange-200 transition-all active:scale-95 flex items-center justify-center gap-2 text-lg">
                 Process Batch Payment
              </button>
           </div>
        </form>
      </div>
    </div>
  );
}


export default function LabCases() {
  const { user, checkPermission } = useAuth();
  const navigate = useNavigate();
  const [viewItem, setViewItem] = useState(null);
  const [modal, setModal] = useState(null); // 'add' or 'edit'
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedIDs, setSelectedIDs] = useState([]);
  const [editItem, setEditItem] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [cases, setCases] = useState([]);
  const [labs, setLabs] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [payFilter, setPayFilter] = useState('All');
  const [branchFilter, setBranchFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null); // id of case to delete
  const [importing, setImporting] = useState(false);
  const [showImportSuccess, setShowImportSuccess] = useState(false);
  const [showCatManager, setShowCatManager] = useState(false);
  const [customProsthesisCategories, setCustomProsthesisCategories] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchData();
    fetchCustomCategories();
  }, []);

  const fetchCustomCategories = React.useCallback(async () => {
    try {
      const res = await API.get('/categories?module=LAB_CASES');
      setCustomProsthesisCategories(res.data.map(c => c.name));
    } catch (err) {
      console.error('Error fetching prosthesis categories:', err);
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Use individual try-catch for each API to ensure one failure doesn't block others
      let casesRes = { data: [] };
      let labsRes = { data: [] };
      let dentistsRes = { data: [] };

      try {
        casesRes = await API.get('/lab-cases');
      } catch (err) {
        console.error('Fetch LabCases Error:', err.response?.data || err.message);
      }

      try {
        labsRes = await API.get('/labs');
      } catch (err) {
        console.warn('Fetch Labs Error (ignoring):', err.message);
      }

      try {
        dentistsRes = await API.get('/employees/dentists');
      } catch (err) {
        console.warn('Fetch Dentists Error (ignoring):', err.message);
      }

      const formattedCases = (casesRes.data || []).map(c => ({
        ...c,
        id: c.id,
        patientName: c.patientName,
        patientNumber: c.patientNumber,
        teethNumber: c.toothNumbers || '',
        prosthesis: c.prosthesisType,
        labId: c.labId || c.laboratoryId,
        labName: c.laboratory?.name || 'Unknown Lab',
        dentistId: c.dentistId,
        dentistName: c.dentist ? `${c.dentist.firstName} ${c.dentist.lastName}` : 'Unknown Dentist',
        status: formatStatus(c.status),
        paymentStatus: formatPaymentStatus(c.paymentStatus),
        totalCost: c.cost,
        createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-CA') : '',
        sentDate: c.sentDate ? new Date(c.sentDate).toLocaleDateString('en-CA') : '',
        receivedDate: c.receivedDate ? new Date(c.receivedDate).toLocaleDateString('en-CA') : '',
        branch: c.branch || 'Tubli Branch', 
        images: (c.documents || []).map(doc => {
          const url = doc.fileUrl || '';
          // if already absolute (http), use as-is; otherwise prepend backend base
          return url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
        })
      }));
      
      setCases(formattedCases);
      setLabs(labsRes.data);
      setDentists(dentistsRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatStatus = (status) => {
    const map = {
      'PENDING': 'Pending',
      'PICKED_UP': 'Picked Up',
      'IN_LAB': 'In Lab',
      'DELIVERED': 'Delivered',
      'COMPLETED': 'Completed'
    };
    return map[status] || 'Pending';
  };

  const formatPaymentStatus = (status) => {
    const map = {
      'PAID': 'Paid',
      'PARTIAL': 'Partial',
      'PENDING': 'Unpaid'
    };
    return map[status] || 'Unpaid';
  };

  const apiStatusMap = {
    'Pending': 'PENDING',
    'Picked Up': 'PICKED_UP',
    'In Lab': 'IN_LAB',
    'Delivered': 'DELIVERED',
    'Completed': 'COMPLETED'
  };
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'add') {
      setModal('add');
      navigate('/lab-cases', { replace: true });
    }
  }, [location, navigate]);

  const statuses = ['All', 'Pending', 'Completed'];
  const payStatuses = ['All', 'Paid', 'Unpaid'];

  const filtered = cases.filter(c => {
    const matchSearch = !search || (c.patientName || '').toLowerCase().includes(search.toLowerCase()) || (c.patientNumber || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchPay = payFilter === 'All' || c.paymentStatus === payFilter;
    const matchBranch = branchFilter === 'All' || c.branch === branchFilter;
    
    // Robust date filtering using local date string comparison
    const caseDate = c.createdAt || ''; // Already local YYYY-MM-DD from mapping
    const matchDateFrom = !dateFrom || (caseDate && caseDate >= dateFrom);
    const matchDateTo = !dateTo || (caseDate && caseDate <= dateTo);
    
    return matchSearch && matchStatus && matchPay && matchBranch && matchDateFrom && matchDateTo;
  });

  const canEdit = ['admin', 'manager', 'secretary'].includes(user?.role);
  const canMarkPaid = ['admin', 'manager', 'accountant'].includes(user?.role);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await API.put(`/lab-cases/${id}`, { status: apiStatusMap[newStatus] });
      fetchData();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleSave = async (form) => {
    if (form.refreshOnly) {
      await fetchData();
      return;
    }
    try {
      const payload = {
        patientName: form.patientName,
        patientNumber: form.patientNumber,
        toothNumbers: form.teethNumber,
        prosthesisType: form.prosthesis,
        laboratoryId: parseInt(form.labId),
        dentistId: parseInt(form.dentistId),
        status: apiStatusMap[form.status],
        cost: parseFloat(form.totalCost) || 0,
        branch: form.branch,
        notes: form.notes,
        createdAt: form.createdAt ? new Date(form.createdAt).toISOString() : undefined
      };

      let savedId;
      if (editItem) {
        await API.put(`/lab-cases/${editItem.id}`, payload);
        savedId = editItem.id;
      } else {
        const res = await API.post('/lab-cases', payload);
        savedId = res.data.id;
      }

      // Upload any pending files and associate with this lab case
      if (form.pendingFiles && form.pendingFiles.length > 0 && savedId) {
        for (const file of form.pendingFiles) {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('title', file.name);
          fd.append('category', 'Lab Case');
          fd.append('labCaseId', savedId.toString());
          await API.post('/documents/upload', fd);
        }
      }

      fetchData();
      setModal(null);
      setEditItem(null);
    } catch (err) {
      console.error('Error saving lab case:', err);
      alert(err.response?.data?.message || 'Error saving lab case');
    }
  };

  const markPaid = (id) => {
    setCases(prev => prev.map(c => c.id === id ? { ...c, paymentStatus: 'Paid' } : c));
  };

  const deleteCase = async () => {
    if (confirmDelete) {
      try {
        await API.delete(`/lab-cases/${confirmDelete}`);
        fetchData();
        setConfirmDelete(null);
        setSelectedIDs(prev => prev.filter(id => id !== confirmDelete));
      } catch (err) {
        console.error('Error deleting lab case:', err);
      }
    }
  };

  const toggleSelect = (id) => {
    setSelectedIDs(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    const allFilteredIDs = filtered.map(c => c.id);
    if (selectedIDs.length === allFilteredIDs.length) {
      setSelectedIDs([]);
    } else {
      setSelectedIDs(allFilteredIDs);
    }
  };

  const handleBatchSave = async (paymentData) => {
    try {
      const res = await API.post('/payments/batch', {
        caseIds: selectedIDs,
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
      setShowBatchModal(false);
      setSelectedIDs([]);
    } catch (err) {
      console.error('Error processing batch payment:', err);
      alert('Failed to process batch payment');
    }
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
          
          if (data && data.length > 0) {
            const formatted = data
              .filter(row => row.patientName || row.PatientName || row.name || row.Name)
              .map((item, index) => ({
                id: Date.now() + index,
                patientNumber: item.patientNumber || item.PatientNumber || `PT-${Date.now()}`,
                patientName: item.patientName || item.PatientName || item.name || item.Name || 'Unknown Patient',
                teethNumber: item.teethNumber || item.Teeth || '',
                prosthesis: item.prosthesis || item.Prosthesis || 'Crown',
                lab: item.lab || item.Lab || LABS[0]?.name || '',
                labId: item.labId || LABS[0]?.id || '',
                status: item.status || item.Status || 'Pending',
                paymentStatus: item.paymentStatus || item.Payment || 'Unpaid',
                branch: item.branch || item.Branch || 'Tubli Branch',
                totalCost: item.totalCost || item.Cost || '',
                createdAt: item.createdAt || item.Date || format(new Date(), 'yyyy-MM-dd'),
                images: []
              }));
            setCases(prev => [...formatted, ...prev]);
          }
        } catch(err) {
          console.error('Error importing Excel file:', err);
        } finally {
          setImporting(false);
          setShowImportSuccess(true);
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

  const handleExportExcel = () => {
    const exportData = filtered.map(c => ({
      'Case Number': c.patientNumber,
      'Patient Name': c.patientName,
      'Teeth Number': c.teethNumber,
      'Prosthesis Type': c.prosthesis,
      'Dental Lab': c.laboratory?.name || c.lab || 'Unknown Lab',
      'Branch': c.branch,
      'Dentist': c.dentist?.name || c.dentist || 'Unknown',
      'Status': c.status,
      'Payment Status': c.paymentStatus,
      'Total Cost (BHD)': c.totalCost || 0,
      'Amount Paid (BHD)': c.amountPaid || 0,
      'Due Amount (BHD)': parseFloat(c.totalCost || 0) - parseFloat(c.amountPaid || 0),
      'Created Date': c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
      'Expected Date': c.expectedDate ? new Date(c.expectedDate).toLocaleDateString() : '',
    }));
    exportToCSV(exportData, 'Lab_Cases_Report');
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(18);
    doc.text('Lab Cases Report', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    const tableColumn = ["Case No", "Patient Name", "Lab Name", "Prosthesis", "Status", "Total (BHD)", "Due (BHD)", "Date"];
    const tableRows = [];

    filtered.forEach(c => {
      const rowData = [
        c.patientNumber,
        c.patientName,
        c.laboratory?.name || c.lab || 'Unknown',
        c.prosthesis,
        c.status,
        c.totalCost || 0,
        (parseFloat(c.totalCost || 0) - parseFloat(c.amountPaid || 0)).toFixed(2),
        c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [28, 55, 86] },
    });

    doc.save(`Lab_Cases_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in text-left font-sans">
      {viewItem && <ViewModal caseItem={viewItem} onClose={() => setViewItem(null)} userRole={user?.role} onUpdateStatus={handleUpdateStatus} setPreviewFile={setPreviewFile} />}
      {modal && (
        <LabCaseModal 
          caseItem={editItem} 
          labs={labs} 
          dentists={dentists}
          customCategories={customProsthesisCategories}
          onManageCategories={() => setShowCatManager(true)}
          onClose={() => { setModal(null); setEditItem(null); }} 
          onSave={handleSave} 
          setPreviewFile={setPreviewFile} 
        />
      )}
      {showBatchModal && <BatchPaymentModal selectedItems={cases.filter(c => selectedIDs.includes(c.id))} onClose={() => setShowBatchModal(false)} onSave={handleBatchSave} />}
      {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
      
      {loading && (
        <div className="fixed inset-0 z-[200] bg-white/60 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-primary animate-pulse uppercase tracking-widest">Loading Lab Cases...</p>
          </div>
        </div>
      )}
      
      <ConfirmModal 
        isOpen={!!confirmDelete}
        title="Delete Lab Case?"
        message="Are you sure you want to remove this medical case? This action cannot be undone."
        onConfirm={deleteCase}
        onCancel={() => setConfirmDelete(null)}
        confirmText="Yes, Delete"
      />

      <ConfirmModal 
        isOpen={showImportSuccess}
        title="Import Successful"
        message="Laboratory cases have been successfully imported and registered in the clinical workflow."
        onConfirm={() => setShowImportSuccess(false)}
        confirmText="Perfect"
        showCancel={false}
      />

      {importing && (
        <div className="fixed inset-0 z-[200] bg-white/60 backdrop-blur-sm flex items-center justify-center text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-primary animate-pulse uppercase tracking-widest">Importing Medical Cases...</p>
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

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h1 className="section-title text-xl md:text-2xl font-bold text-gray-900 font-heading">Lab Cases</h1>
          <p className="text-gray-500 text-xs md:text-sm mt-0.5">Track dental prosthesis cases and deliveries</p>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
           <select 
             value={branchFilter}
             onChange={e => setBranchFilter(e.target.value)}
             className="w-full sm:w-auto flex-1 md:flex-none btn-ghost border border-gray-200 text-xs font-semibold py-2 px-3 sm:px-4 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1em_1em] bg-[right_0.5rem_center] md:bg-[right_0.75rem_center] bg-no-repeat pr-8 sm:pr-10 min-w-0"
           >
              <option value="All">All Branches</option>
              <option value="Tubli Branch">Tubli Branch</option>
              <option value="Manama Branch">Manama Branch</option>
           </select>
           <div className="flex gap-2 w-full sm:w-auto">
             <button onClick={handleExportExcel} className="w-full sm:w-auto flex-1 btn-ghost border border-gray-200 text-[11px] font-semibold py-2 px-3 sm:px-4 rounded-xl flex items-center justify-center gap-1.5 bg-white min-w-0">
                <Download size={13} className="text-gray-600 shrink-0" /> <span className="hidden sm:inline">Export Excel</span><span className="sm:hidden">Excel</span>
             </button>
             <button onClick={handleExportPDF} className="w-full sm:w-auto flex-1 btn-ghost border border-gray-200 text-[11px] font-semibold py-2 px-3 sm:px-4 rounded-xl flex items-center justify-center gap-1.5 bg-white min-w-0">
                <Download size={13} className="text-gray-600 shrink-0" /> <span className="hidden sm:inline">Export PDF</span><span className="sm:hidden">PDF</span>
             </button>
           </div>
        </div>
      </div>

      {/* Filters & Actions Card */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/20 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50/50 rounded-full -mr-12 -mt-12 blur-2xl opacity-40" />
        <div className="flex items-center gap-2 mb-4 pl-1 relative z-10">
           <div className="w-1.5 h-4 bg-orange-500 rounded-full" />
           <h3 className="text-base font-bold text-gray-900 font-heading tracking-tight">Filters & Actions</h3>
        </div>
        <div className="flex flex-col lg:flex-row gap-3 relative z-10 w-full">
          <div className="flex-1 relative text-left group min-w-0 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={16} />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by patient name or number..." 
              className="w-full pl-10 h-11 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 transition-all border outline-none text-xs font-medium min-w-0" 
            />
          </div>
          <div className="flex flex-col sm:flex-row lg:flex gap-3 w-full lg:w-auto shrink-0 min-w-0">
            <div className="relative w-full sm:w-1/2 lg:w-auto min-w-0">
              <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)}
                className="h-11 w-full lg:min-w-[140px] appearance-none bg-gray-50/50 border border-gray-100 rounded-xl px-3 pr-8 text-[11px] font-bold text-gray-600 focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 outline-none transition-all cursor-pointer min-w-0"
              >
                <option value="All">All Status</option>
                {statuses.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" size={14} />
            </div>
            <div className="relative w-full sm:w-1/2 lg:w-auto min-w-0">
              <select 
                value={payFilter} 
                onChange={e => setPayFilter(e.target.value)}
                className="h-11 w-full lg:min-w-[140px] appearance-none bg-gray-50/50 border border-gray-100 rounded-xl px-3 pr-8 text-[11px] font-bold text-gray-600 focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 outline-none transition-all cursor-pointer min-w-0"
              >
                <option value="All">All Payment</option>
                {payStatuses.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" size={14} />
            </div>
            {/* Date Range with Clarity */}
            <div className="flex items-center gap-2">
              <div className="relative group">
                <span className="absolute -top-3 left-2 text-[8px] font-black text-gray-400 uppercase tracking-widest bg-white rounded-sm px-1.5 z-10 border border-gray-100/50">From</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="h-11 w-full lg:min-w-[130px] bg-gray-50/50 border border-gray-100 rounded-xl px-3 text-[11px] font-bold text-gray-600 focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 outline-none transition-all cursor-pointer min-w-0 shadow-inner"
                />
              </div>
              <div className="relative group">
                <span className="absolute -top-3 left-2 text-[8px] font-black text-gray-400 uppercase tracking-widest bg-white rounded-sm px-1.5 z-10 border border-gray-100/50">To</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="h-11 w-full lg:min-w-[130px] bg-gray-50/50 border border-gray-100 rounded-xl px-3 text-[11px] font-bold text-gray-600 focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 outline-none transition-all cursor-pointer min-w-0 shadow-inner"
                />
              </div>
            </div>
            {/* Clear Filters */}
            {(statusFilter !== 'All' || payFilter !== 'All' || branchFilter !== 'All' || dateFrom || dateTo) && (
              <button
                onClick={() => { setStatusFilter('All'); setPayFilter('All'); setBranchFilter('All'); setDateFrom(''); setDateTo(''); }}
                className="h-11 px-4 rounded-xl text-[11px] font-bold text-rose-500 bg-rose-50 border border-rose-100 hover:bg-rose-100 transition-all whitespace-nowrap min-w-0 active:scale-95"
              >
                Clear Filters
              </button>
            )}
          </div>
          <div className="flex gap-3 w-full lg:w-auto shrink-0 min-w-0">
            {selectedIDs.length > 0 && checkPermission('payments', 'create') && (
              <button 
                onClick={() => setShowBatchModal(true)}
                className="w-full lg:w-auto px-6 h-11 rounded-xl bg-[#1C3756] hover:bg-[#152a42] text-white font-bold transition-all shadow-lg shadow-blue-900/10 flex items-center justify-center gap-2 text-xs active:scale-95 min-w-0"
              >
                <Layers size={16} className="shrink-0" />
                <span className="truncate">Batch Pay ({selectedIDs.length})</span>
              </button>
            )}
            {checkPermission('lab_cases', 'create') && (
              <button 
                onClick={() => setModal('add')} 
                className="w-full lg:w-auto h-11 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold whitespace-nowrap shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2 text-xs transition-all active:scale-95 min-w-0"
              >
                <Plus size={18} className="shrink-0" /> New Case
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'TOTAL CASES', value: cases.length, color: 'blue', icon: Layers, gradient: 'from-blue-50 to-indigo-50/50' },
          { label: 'PENDING', value: cases.filter(c => c.status === 'Pending').length, color: 'orange', icon: Clock, gradient: 'from-orange-50 to-amber-50/50' },
          { label: 'COMPLETE', value: cases.filter(c => c.status === 'Completed').length, color: 'emerald', icon: CheckCircle2, gradient: 'from-emerald-50 to-teal-50/50' },
          { label: 'UNPAID CASES', value: cases.filter(c => c.paymentStatus === 'Unpaid').length, color: 'rose', icon: CreditCard, gradient: 'from-rose-50 to-pink-50/50' }
        ].map(stat => (
          <div key={stat.label} className={`relative overflow-hidden group p-5 rounded-[1.5rem] border border-white shadow-lg shadow-gray-100/30 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl hover:shadow-gray-200/40 bg-gradient-to-br ${stat.gradient} text-left`}>
             <div className="relative z-10 flex flex-col justify-between h-full">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                  stat.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                  stat.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                  stat.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                  'bg-rose-100 text-rose-600'
                }`}>
                   <stat.icon size={16} />
                </div>
                <div>
                   <p className={`text-[9px] font-bold uppercase tracking-[0.1em] mb-0.5 opacity-60 ${
                     stat.color === 'blue' ? 'text-blue-900' :
                     stat.color === 'orange' ? 'text-orange-900' :
                     stat.color === 'emerald' ? 'text-emerald-900' :
                     'text-rose-900'
                   }`}>{stat.label}</p>
                   <p className={`text-2xl font-black tracking-tight ${
                     stat.color === 'blue' ? 'text-blue-900' :
                     stat.color === 'orange' ? 'text-orange-900' :
                     stat.color === 'emerald' ? 'text-emerald-900' :
                     'text-rose-900'
                   }`}>{stat.value}</p>
                </div>
             </div>
             {/* Background Decorative Icon */}
             <div className={`absolute -right-3 -bottom-3 opacity-[0.03] group-hover:opacity-[0.06] group-hover:scale-105 transition-all duration-500 pointer-events-none ${
               stat.color === 'blue' ? 'text-blue-900' :
               stat.color === 'orange' ? 'text-orange-900' :
               stat.color === 'emerald' ? 'text-emerald-900' :
               'text-rose-900'
             }`}>
                <stat.icon size={100} />
             </div>
          </div>
        ))}
      </div>

      {/* Table / Cards View */}
      <div className="mt-6">
        {/* Desktop Table */}
        <div className="hidden lg:block card p-0 overflow-hidden border-gray-100 shadow-sm rounded-3xl min-w-0">
          <div className="table-container">
            <table className="table w-full">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="w-14 text-center px-4">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded-full border-gray-300 text-primary focus:ring-primary cursor-pointer transition-all active:scale-90" 
                      checked={filtered.length > 0 && selectedIDs.length === filtered.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase text-left">Patient Name</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase text-left">Prosthesis</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase text-left">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase text-left">Amount Due</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase text-left">Payment</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-left">
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-gray-400 py-20 font-medium">No lab cases matching your criteria found.</td></tr>
                )}
                {filtered.map(c => (
                  <tr key={c.id} className={`transition-colors group ${selectedIDs.includes(c.id) ? 'bg-orange-50/20' : 'hover:bg-gray-50/20'}`}>
                    <td className="text-center px-4 py-3">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded-full border-gray-300 text-primary focus:ring-primary cursor-pointer transition-all active:scale-90" 
                        checked={selectedIDs.includes(c.id)}
                        onChange={() => toggleSelect(c.id)}
                      />
                    </td>
                    <td className="px-5 py-3 cursor-pointer" onClick={() => setViewItem(c)}>
                      <p className="font-bold text-gray-900 text-xs tracking-tight">{c.patientNumber}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5 font-medium">{c.patientName}</p>
                    </td>
                    <td className="px-5 py-3" onClick={() => setViewItem(c)}>
                      <span className="bg-gray-100 px-2 py-0.5 rounded-lg text-[9px] font-bold text-gray-600 border border-gray-200/50">{c.prosthesis}</span>
                      <span className="block text-[9px] text-gray-400 mt-1.5 font-medium">{c.branch}</span>
                    </td>
                    <td className="px-5 py-3">
                       <span className={`px-2 py-1 rounded-xl text-[9px] font-bold border ${c.status === 'Completed' ? 'bg-teal-50 text-teal-600 border-teal-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                          {c.status}
                       </span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-bold text-gray-900 text-xs">BHD {(parseFloat(c.totalCost || 0) - parseFloat(c.amountPaid || 0)).toFixed(2)}</p>
                      <p className="text-[9px] text-gray-400 mt-0.5 font-medium">Total: BHD {parseFloat(c.totalCost || 20).toFixed(2)}</p>
                    </td>
                    <td className="px-5 py-3">
                       <div className="flex flex-col items-start gap-0.5">
                          <span className={`px-3 py-0.5 rounded-xl text-[9px] font-bold ${
                            c.paymentStatus === 'Paid' ? 'bg-[#1C3756] text-white' : 
                            c.paymentStatus === 'Partial' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                            'bg-rose-50 text-rose-600 border border-rose-100'
                          }`}>
                            {c.paymentStatus}
                          </span>
                          <p className="text-[9px] text-gray-400 mt-0.5 font-mono font-medium">{c.createdAt}</p>
                       </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => { console.log('View clicked:', c); setViewItem(c); }} title="View Detail" className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-lg transition-all border border-gray-100 shadow-sm bg-white">
                            <Eye size={14} />
                          </button>
                          {checkPermission('lab_cases', 'update') && (
                            <button onClick={() => { console.log('Edit clicked:', c); setEditItem(c); setModal('edit'); }} title="Edit Case" className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-gray-100 shadow-sm bg-white">
                              <Edit2 size={14} />
                            </button>
                          )}
                          {checkPermission('lab_cases', 'delete') && (
                            <button onClick={() => setConfirmDelete(c.id)} title="Delete Case" className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all border border-gray-100 shadow-sm bg-white">
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

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-4 min-w-0">
          {filtered.length === 0 && (
            <div className="text-center text-gray-400 py-10 font-medium">No lab cases found.</div>
          )}
          {filtered.map(c => (
            <div key={c.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm relative overflow-hidden text-left">
              <div className="flex items-start justify-between mb-3">
                <div onClick={() => setViewItem(c)} className="cursor-pointer">
                  <p className="font-extrabold text-gray-900 text-sm tracking-tight">{c.patientNumber}</p>
                  <p className="text-xs text-gray-500 font-medium">{c.patientName}</p>
                </div>
                <div className="flex items-center gap-1.5">
                   {checkPermission('lab_cases', 'update') && (
                     <button onClick={() => { setEditItem(c); setModal('edit'); }} className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                        <Edit2 size={16} />
                     </button>
                   )}
                   {checkPermission('lab_cases', 'delete') && (
                     <button onClick={() => setConfirmDelete(c.id)} className="p-2 text-gray-400 hover:text-rose-600 transition-colors">
                        <Trash2 size={16} />
                     </button>
                   )}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className="bg-gray-50 px-2.5 py-1 rounded-lg text-[10px] font-bold text-gray-600 border border-gray-100">{c.prosthesis}</span>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${c.status === 'Completed' ? 'bg-teal-50 text-teal-600 border-teal-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                  {c.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 py-3 border-t border-gray-50">
                <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Amount Due</p>
                   <p className="font-black text-gray-900 text-sm">BHD {(parseFloat(c.totalCost || 0) - parseFloat(c.amountPaid || 0)).toFixed(2)}</p>
                </div>
                <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Payment</p>
                   <span className={`inline-block px-2 py-0.5 rounded-lg text-[9px] font-black tracking-tight ${
                     c.paymentStatus === 'Paid' ? 'bg-primary/10 text-primary' : 
                     c.paymentStatus === 'Partial' ? 'bg-indigo-50 text-indigo-600' :
                     'bg-rose-50 text-rose-600'
                   }`}>
                      {c.paymentStatus.toUpperCase()}
                   </span>
                </div>
              </div>

              <button 
                onClick={() => setViewItem(c)}
                className="w-full mt-2 py-2.5 rounded-xl bg-gray-50 text-gray-600 text-xs font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
              >
                <Eye size={14} /> View Full Details
              </button>
            </div>
          ))}
        </div>
      </div>

      <CategoryManagerModal 
        isOpen={showCatManager} 
        onClose={() => setShowCatManager(false)} 
        module="LAB_CASES"
        onUpdate={fetchCustomCategories}
      />
    </div>
  );
}
