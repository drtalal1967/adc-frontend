import React, { useState, useEffect } from 'react';
import API from '../api';
import { useAuth } from '../context/AuthContext';
import { useLeaveContext } from '../context/LeaveContext';
import { 
  ClipboardList, 
  Check, 
  X, 
  Plus, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  FileText,
  AlertCircle,
  MessageSquare,
  ChevronRight,
  Calendar,
  Trash2
} from 'lucide-react';

const LEAVE_TYPES = ['Annual Leave', 'Sick Leave', 'Relatives Death Leave', 'Maternity Leave', 'Hajj Leave', 'Marriage Leave', 'Others'];

function RequestModal({ onClose, onSave, user }) {
  const [form, setForm] = useState({ type: 'Annual Leave', from: '', to: '', reason: '', branch: 'Manama Branch', isHalfDay: false });
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  let days = form.from && form.to ? Math.max(1, Math.round((new Date(form.to) - new Date(form.from)) / (1000 * 60 * 60 * 24)) + 1) : 0;
  if (days > 0 && form.isHalfDay) days -= 0.5;
  
  const BRANCHES = ['Manama Branch', 'Tubli Branch'];

  return (
    <div className="modal-overlay z-[100]" onClick={onClose}>
      <div className="modal-content max-w-lg bg-white overflow-hidden shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="bg-sidebar px-8 py-6 flex items-center justify-between text-white border-b border-white/5">
          <h2 className="font-bold text-xl tracking-tight">Request Leave</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/70 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="p-8 space-y-5">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase mb-2 block tracking-widest">Leave Type</label>
              <select value={form.type} onChange={e => update('type', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20">
                {LEAVE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase mb-2 block tracking-widest">From Date</label>
              <input type="date" value={form.from} onChange={e => update('from', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase mb-2 block tracking-widest">To Date</label>
              <input type="date" value={form.to} onChange={e => update('to', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input 
              type="checkbox" 
              id="isHalfDay" 
              checked={form.isHalfDay} 
              onChange={e => update('isHalfDay', e.target.checked)} 
              className="w-4 h-4 text-primary bg-gray-50 border-gray-300 rounded focus:ring-primary/20 cursor-pointer" 
            />
            <label htmlFor="isHalfDay" className="text-xs font-bold text-gray-500 cursor-pointer select-none">
              This leave includes a Half Day (-0.5 days)
            </label>
          </div>
          {days > 0 && (
            <div className="bg-primary/5 border border-primary/10 rounded-2xl px-4 py-3 flex items-center gap-3">
              <Clock size={16} className="text-primary" />
              <p className="text-sm text-primary font-bold">{days} day{days > 1 ? 's' : ''} requested</p>
            </div>
          )}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase mb-2 block tracking-widest">Reason for Leave</label>
            <textarea rows={3} value={form.reason} onChange={e => update('reason', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Please provide a brief reason..." />
          </div>
        </div>
        <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-4">
          <button onClick={onClose} className="px-6 py-3 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-all text-sm">Cancel</button>
          <button onClick={() => {
            onSave({ ...form, employeeName: user.name, role: user.role, employeeId: user.id, days, status: 'Pending', id: Date.now() });
          }} className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-2xl shadow-lg shadow-primary/20 font-black text-sm transition-all active:scale-95">Submit Request</button>
        </div>
      </div>
    </div>
  );
}

function ActionModal({ onClose, onConfirm, employeeName, action }) {
  const [comment, setComment] = useState('');
  const isApprove = action === 'Approved';

  return (
    <div className="modal-overlay z-[110]" onClick={onClose}>
      <div className="modal-content max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className={`h-2 ${isApprove ? 'bg-emerald-500' : 'bg-red-500'}`} />
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">{isApprove ? 'Approve Request' : 'Reject Request'}</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400">
              <X size={20} />
            </button>
          </div>
          
          <p className="text-gray-500 font-medium mb-8 leading-relaxed">
            You are about to <span className={`font-black uppercase tracking-wider ${isApprove ? 'text-emerald-500' : 'text-red-500'}`}>{isApprove ? 'approve' : 'reject'}</span> the leave request for <span className="text-gray-800 font-bold">{employeeName}</span>.
          </p>

          <div className="space-y-2 mb-8">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Comments (Optional)</label>
            <textarea 
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-100 focus:bg-white transition-all resize-none"
              placeholder="Add a note..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={onClose}
              className="px-6 py-4 rounded-2xl font-black text-gray-500 bg-gray-50 hover:bg-gray-100 transition-all text-sm tracking-wide"
            >
              Cancel
            </button>
            <button 
              onClick={() => onConfirm(comment)}
              className={`${isApprove ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'} text-white px-6 py-4 rounded-2xl shadow-xl font-black text-sm tracking-wide transition-all active:scale-95`}
            >
              Confirm {isApprove ? 'Approve' : 'Reject'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Leaves() {
  const { user, checkPermission } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [modal, setModal] = useState(false);
  const [actionModal, setActionModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myBalance, setMyBalance] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch leave requests (everyone can see)
      const leavesRes = await API.get('/leave-requests');
      setLeaves(leavesRes.data);

      // Fetch employees list only if user can approve (admin/manager)
      if (canApprove) {
        try {
          const empsRes = await API.get('/employees');
          setEmployees(empsRes.data);
        } catch (empErr) {
          console.error('Could not fetch employees list:', empErr);
        }
      }

      // Fetch leave balance using employeeId from auth token directly
      const effectiveEmpId = user.employeeId;
      if (effectiveEmpId) {
        try {
          const balRes = await API.get(`/leave-balance/${effectiveEmpId}`);
          setMyBalance(balRes.data);
        } catch (balErr) {
          console.error('Error fetching leave balance:', balErr);
        }
      }
    } catch (err) {
      console.error('Error fetching leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (fd) => {
    try {
      const empId = user.employeeId || employees.find(e => e.userId === user.id)?.id;
      if (!empId) throw new Error('Employee ID not found. Cannot apply for leave.');

      const typeMap = {
        'Annual Leave': 'ANNUAL',
        'Sick Leave': 'SICK',
        'Relatives Death Leave': 'RELATIVES_DEATH',
        'Maternity Leave': 'MATERNITY',
        'Hajj Leave': 'HAJJ',
        'Marriage Leave': 'MARRIAGE',
        'Others': 'OTHERS'
      };

      const payload = {
        employeeId: empId,
        leaveType: typeMap[fd.type] || fd.type.toUpperCase(),
        startDate: fd.from,
        endDate: fd.to,
        reason: fd.reason,
        branch: fd.branch,
        isHalfDay: fd.isHalfDay
      };
      await API.post('/leave-requests', payload);
      fetchData();
      setModal(false);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to apply for leave');
    }
  };

  const handleAction = async (comment) => {
    try {
      await API.put(`/leave-requests/${actionModal.id}/status`, {
        status: actionModal.action.toUpperCase(),
        reviewNotes: comment
      });
      fetchData();
      setActionModal(null);
    } catch (err) {
      console.error('Leave action error:', err);
      alert(err.response?.data?.message || err.message || 'Failed to update leave status. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this leave request?")) return;
    try {
      await API.delete(`/leave-requests/${id}`);
      setLeaves(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      alert('Failed to delete request');
    }
  };

  const canApprove = user?.role === 'admin' && checkPermission('leaves', 'update');
  const canApply = checkPermission('leaves', 'create');
  const canDelete = checkPermission('leaves', 'delete');
  const isEmployee = canApply && !canApprove; 

  const activeEmpId = user.employeeId || employees.find(e => e.userId === user.id)?.id;
  const myLeaves = isEmployee ? leaves.filter(l => Number(l.employeeId) === Number(activeEmpId)) : leaves;

  const STATUS_CONFIG = {
    PENDING: { badge: 'bg-amber-100 text-amber-600', dot: 'bg-amber-400', icon: <Clock size={14} /> },
    APPROVED: { badge: 'bg-emerald-100 text-emerald-600', dot: 'bg-emerald-400', icon: <CheckCircle2 size={14} /> },
    REJECTED: { badge: 'bg-red-100 text-red-600', dot: 'bg-red-400', icon: <XCircle size={14} /> },
  };

  const STATS = [
    { label: 'Pending', count: myLeaves.filter(l => l.status === 'PENDING').length, color: 'text-amber-500', accent: 'bg-amber-500', icon: <Clock size={24} /> },
    { label: 'Approved', count: myLeaves.filter(l => l.status === 'APPROVED').length, color: 'text-emerald-500', accent: 'bg-emerald-500', icon: <CheckCircle2 size={24} /> },
    { label: 'Rejected', count: myLeaves.filter(l => l.status === 'REJECTED').length, color: 'text-red-500', accent: 'bg-red-500', icon: <XCircle size={24} /> },
  ];

  const EMPLOYEE_BALANCES = isEmployee && myBalance ? [
    { label: 'Annual Leave', count: myBalance.annual?.remaining ?? myBalance.annual?.totalRemaining ?? 0, color: 'text-primary', accent: 'bg-primary', icon: <Calendar size={24} /> },
    { label: 'Sick Leave', count: myBalance.sick?.remaining ?? myBalance.sick?.totalRemaining ?? 0, color: 'text-rose-500', accent: 'bg-rose-500', icon: <AlertCircle size={24} /> },
  ] : [];

  const ALL_STATS = [...STATS, ...EMPLOYEE_BALANCES];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {modal && <RequestModal user={user} onClose={() => setModal(false)} onSave={handleApply} />}
      
      {actionModal && (
        <ActionModal 
          onClose={() => setActionModal(null)} 
          onConfirm={handleAction}
          employeeName={actionModal.name}
          action={actionModal.action}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight leading-none">{canApprove ? 'Leave Requests' : 'My Leave Requests'}</h1>
          <p className="text-sm text-gray-500 mt-1.5 font-medium">{leaves.filter(l => l.status === 'PENDING').length} pending requests</p>
        </div>
        {isEmployee && (
          <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2 px-8 py-3 rounded-2xl shadow-xl shadow-primary/20 font-bold text-sm transform transition-transform hover:scale-105 active:scale-95 leading-none">
            <Plus size={18} /> Request Leave
          </button>
        )}
      </div>

      {/* Stats */}
      <div className={`grid grid-cols-1 sm:grid-cols-3 ${EMPLOYEE_BALANCES.length > 0 ? 'lg:grid-cols-5' : 'lg:grid-cols-3'} gap-4 mb-8`}>
        {ALL_STATS.map(stat => (
          <div key={stat.label} className={`relative overflow-hidden group p-5 rounded-[1.5rem] border border-white shadow-lg shadow-gray-100/30 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl hover:shadow-gray-200/40 bg-gradient-to-br ${
            stat.label === 'Pending' ? 'from-orange-50 to-amber-50/50' :
            stat.label === 'Approved' ? 'from-emerald-50 to-teal-50/50' :
            stat.label === 'Rejected' ? 'from-rose-50 to-pink-50/50' :
            'from-blue-50 to-indigo-50/50'
          } text-left`}>
             <div className="relative z-10 flex flex-col justify-between h-full">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                  stat.label === 'Pending' ? 'bg-orange-100 text-orange-600' :
                  stat.label === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                  stat.label === 'Rejected' ? 'bg-rose-100 text-rose-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                   {React.cloneElement(stat.icon, { size: 16 })}
                </div>
                <div>
                   <p className={`text-[9px] font-bold uppercase tracking-[0.1em] mb-0.5 opacity-60 ${
                     stat.label === 'Pending' ? 'text-orange-900' :
                     stat.label === 'Approved' ? 'text-emerald-900' :
                     stat.label === 'Rejected' ? 'text-rose-900' :
                     'text-blue-900'
                   }`}>{stat.label}</p>
                   <p className={`text-2xl font-black tracking-tight ${
                     stat.label === 'Pending' ? 'text-orange-900' :
                     stat.label === 'Approved' ? 'text-emerald-900' :
                     stat.label === 'Rejected' ? 'text-rose-900' :
                     'text-blue-900'
                   }`}>{stat.count}</p>
                </div>
             </div>
             {/* Background Decorative Icon */}
             <div className={`absolute -right-3 -bottom-3 opacity-[0.03] group-hover:opacity-[0.06] group-hover:scale-105 transition-all duration-500 pointer-events-none ${
               stat.label === 'Pending' ? 'text-orange-900' :
               stat.label === 'Approved' ? 'text-emerald-900' :
               stat.label === 'Rejected' ? 'text-rose-900' :
               'text-blue-900'
             }`}>
                {React.cloneElement(stat.icon, { size: 100 })}
             </div>
          </div>
        ))}
      </div>

      {/* Leave Cards */}
      <div className="space-y-4">
        {myLeaves.map((l, index) => (
          <div 
             key={l.id} 
             className="bg-white rounded-[2rem] p-5 border border-gray-100 shadow-xl shadow-gray-200/10 hover:shadow-2xl hover:shadow-gray-200/20 transition-all duration-300 flex flex-col lg:flex-row lg:items-center gap-5 group animate-slide-up relative overflow-hidden"
             style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={`absolute top-0 right-0 w-32 h-32 ${
              l.status === 'APPROVED' ? 'bg-emerald-50/30' : 
              l.status === 'REJECTED' ? 'bg-rose-50/30' : 
              'bg-orange-50/30'
            } rounded-full -mr-16 -mt-16 blur-3xl opacity-50`} />

            <div className="flex items-center gap-4 flex-1 min-w-0 relative z-10">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                l.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-500 group-hover:bg-emerald-600 group-hover:text-white' :
                l.status === 'REJECTED' ? 'bg-rose-50 text-rose-500 group-hover:bg-rose-600 group-hover:text-white' :
                'bg-orange-50 text-orange-500 group-hover:bg-orange-600 group-hover:text-white'
              }`}>
                <FileText size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <p className="font-extrabold text-gray-900 text-base tracking-tight truncate">{l.employee ? `${l.employee.firstName} ${l.employee.lastName}` : 'Unknown'}</p>
                  <span className="px-2.5 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-black uppercase tracking-widest rounded-lg">{l.employee?.role || 'Staff'}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 font-medium">
                   <div className="flex items-center gap-1.5 capitalize">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        l.status === 'APPROVED' ? 'bg-emerald-500' : 
                        l.status === 'REJECTED' ? 'bg-rose-500' : 
                        'bg-orange-500'
                      }`} />
                      {l.leaveType} Leave
                   </div>
                   <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                      {new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()} <span className="text-[10px] font-black text-gray-400 opacity-60 ml-1">({l.totalDays} DAYS)</span>
                   </div>
                </div>
                {l.reason && (
                  <div className="mt-3 flex items-start gap-2 bg-gray-50/50 p-3 rounded-2xl group-hover:bg-blue-50/30 transition-colors">
                    <MessageSquare size={13} className="text-gray-400 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-gray-500 leading-relaxed font-medium italic">"{l.reason}"</p>
                  </div>
                )}
                {l.reviewNotes && (
                  <div className={`mt-2 flex items-start gap-2 p-3 rounded-2xl transition-colors border ${
                    l.status === 'APPROVED' ? 'bg-emerald-50/50 border-emerald-100/50 group-hover:bg-emerald-50' :
                    l.status === 'REJECTED' ? 'bg-rose-50/50 border-rose-100/50 group-hover:bg-rose-50' :
                    'bg-orange-50/50 border-orange-100/50 group-hover:bg-orange-50'
                  }`}>
                    <ClipboardList size={13} className={`mt-0.5 shrink-0 ${
                      l.status === 'APPROVED' ? 'text-emerald-500' :
                      l.status === 'REJECTED' ? 'text-rose-500' :
                      'text-orange-500'
                    }`} />
                    <p className={`text-[11px] leading-relaxed font-semibold italic ${
                      l.status === 'APPROVED' ? 'text-emerald-700' :
                      l.status === 'REJECTED' ? 'text-rose-700' :
                      'text-orange-700'
                    }`}><span className="font-black uppercase tracking-widest text-[9px] mr-1.5 opacity-70">Admin Note:</span>"{l.reviewNotes}"</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between lg:justify-end gap-5 pt-4 lg:pt-0 border-t lg:border-t-0 border-gray-50 relative z-10">
              <div className={`px-4 py-2 rounded-xl flex items-center gap-2 text-[10px] font-black tracking-wide uppercase border ${
                l.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                l.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                'bg-orange-50 text-orange-600 border-orange-100'
              }`}>
                {React.cloneElement(STATUS_CONFIG[l.status]?.icon || <Clock size={12}/>, { size: 12 })}
                {l.status}
              </div>
              
              {canApprove && (
                <div className="flex gap-2">
                  {l.status !== 'Approved' && (
                    <button 
                      onClick={() => setActionModal({ id: l.id, name: l.employee ? `${l.employee.firstName} ${l.employee.lastName}` : 'Employee', action: 'Approved' })}
                      className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center justify-center active:scale-95 border border-emerald-100"
                      title="Approve"
                    >
                      <Check size={18} strokeWidth={3} />
                    </button>
                  )}
                  {l.status !== 'Rejected' && (
                    <button 
                      onClick={() => setActionModal({ id: l.id, name: l.employee ? `${l.employee.firstName} ${l.employee.lastName}` : 'Employee', action: 'Rejected' })}
                      className="w-10 h-10 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm flex items-center justify-center active:scale-95 border border-red-100"
                      title="Reject"
                    >
                      <X size={18} strokeWidth={3} />
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(l.id)}
                    className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-all shadow-sm flex items-center justify-center active:scale-95 border border-gray-100"
                    title="Delete Request"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
              
              <div className="hidden lg:block text-gray-200 group-hover:text-gray-400 transition-colors px-2">
                <ChevronRight size={20} />
              </div>
            </div>
          </div>
        ))}

        {myLeaves.length === 0 && (
          <div className="py-20 text-center animate-fade-in">
             <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-gray-300">
                <AlertCircle size={40} />
             </div>
             <h3 className="text-xl font-bold text-gray-400">No leave requests found</h3>
             <p className="text-sm text-gray-400 mt-2 font-medium">All caught up! No requests need your attention.</p>
          </div>
        )}
      </div>
    </div>
  );
}
