import API from '../api';
import { useAuth } from '../context/AuthContext';
import { useState, useMemo, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Edit2, 
  Eye,
  Trash2,
  X, 
  Save, 
  ChevronLeft, 
  Plus, 
  Calendar, 
  Clock, 
  Info,
  ChevronDown
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const LEAVE_TYPES = [
  { id: 'annual', label: 'Annual Leave', color: 'primary' },
  { id: 'sick', label: 'Sick Leave', color: 'rose' },
  { id: 'relativesDeath', label: 'Relatives Death Leave', color: 'slate' },
  { id: 'hajj', label: 'Hajj Leave', color: 'emerald' },
  { id: 'marriage', label: 'Marriage Leave', color: 'indigo' },
  { id: 'others', label: 'Others', color: 'orange' },
  { id: 'maternity', label: 'Maternity Leave', color: 'teal' },
];

const COLORS = {
  primary: 'text-primary bg-primary/5 border-primary/10',
  rose: 'text-rose-500 bg-rose-50 border-rose-100',
  slate: 'text-slate-500 bg-slate-50 border-slate-100',
  emerald: 'text-emerald-500 bg-emerald-50 border-emerald-100',
  indigo: 'text-indigo-500 bg-indigo-50 border-indigo-100',
  orange: 'text-orange-500 bg-orange-50 border-orange-100',
  teal: 'text-teal-500 bg-teal-50 border-teal-100',
};

const ACCENT_COLORS = {
  primary: 'bg-primary',
  rose: 'bg-rose-500',
  slate: 'bg-slate-500',
  emerald: 'bg-emerald-500',
  indigo: 'bg-indigo-500',
  orange: 'bg-orange-500',
  teal: 'bg-teal-500',
};

function ViewBalanceModal({ item, onClose }) {
  if (!item) return null;
  const LEAVE_TYPE_LABELS = [
    { id: 'annual',        label: 'Annual Leave',         color: 'text-primary',    bg: 'bg-primary/10' },
    { id: 'sick',          label: 'Sick Leave',            color: 'text-rose-500',   bg: 'bg-rose-50' },
    { id: 'relativesDeath',label: 'Relatives Death Leave', color: 'text-slate-500',  bg: 'bg-slate-50' },
    { id: 'hajj',          label: 'Hajj Leave',            color: 'text-emerald-500',bg: 'bg-emerald-50' },
    { id: 'marriage',      label: 'Marriage Leave',        color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { id: 'others',        label: 'Others',                color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 'maternity',     label: 'Maternity Leave',       color: 'text-teal-500',   bg: 'bg-teal-50' },
  ];
  return (
    <div className="modal-overlay z-[100]" onClick={onClose}>
      <div className="modal-content max-w-xl bg-white overflow-hidden rounded-[2rem] shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-header px-8 py-6 flex items-center justify-between text-white">
          <div>
            <h2 className="font-bold text-2xl tracking-tight">{item.employee ? `${item.employee.firstName} ${item.employee.lastName}` : 'Unknown'}</h2>
            <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold mt-0.5">Leave Balance Details</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={22} /></button>
        </div>
        <div className="p-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {LEAVE_TYPE_LABELS.map(({ id, label, color, bg }) => (
            <div key={id} className={`rounded-2xl p-4 ${bg} border border-white/60`}>
              <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${color}`}>{label}</p>
              <p className="text-3xl font-black text-gray-800">{item[id]?.remaining ?? 0}</p>
              <div className="mt-2 flex justify-between text-[10px] font-bold text-gray-400">
                <span>Total: {item[id]?.total ?? 0}</span>
                <span>Used: {item[id]?.used ?? 0}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="px-8 pb-6">
          <button onClick={onClose} className="btn-primary w-full py-3.5 text-sm rounded-2xl">Close</button>
        </div>
      </div>
    </div>
  );
}

export default function LeaveBalanceManagement() {
  const { user } = useAuth();
  const [balances, setBalances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [currentView, setCurrentView] = useState('list');
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editFormData, setEditFormData] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [balRes, empRes] = await Promise.all([
        API.get('/leave-balance'),
        API.get('/employees')
      ]);
      setBalances(balRes.data);
      setEmployees(empRes.data);
    } catch (err) {
      console.error('Error fetching balance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredBalances = useMemo(() => {
    return balances.filter(b => 
      `${b.employee?.firstName} ${b.employee?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [balances, searchTerm]);

  const handleEdit = (id) => {
    const b = balances.find(bal => bal.employeeId === id) || { 
      employee: employees.find(e => e.id === id),
      annual: { total: 30, used: 0, remaining: 30 },
      sick: { total: 15, used: 0, remaining: 15 },
      relativesDeath: { total: 3, used: 0, remaining: 3 },
      hajj: { total: 10, used: 0, remaining: 10 },
      marriage: { total: 15, used: 0, remaining: 15 },
      others: { total: 5, used: 0, remaining: 5 },
      maternity: { total: 60, used: 0, remaining: 60 },
    };

    if (b.employee) {
      setEditingEmployee(b.employee);
      setEditFormData({ 
        annual: { total: b.annual.total, used: b.annual.used, remaining: b.annual.remaining },
        sick: { total: b.sick.total, used: b.sick.used, remaining: b.sick.remaining },
        relativesDeath: { total: b.relativesDeath?.total || 0, used: b.relativesDeath?.used || 0, remaining: b.relativesDeath?.remaining || 0 },
        hajj: { total: b.hajj?.total || 0, used: b.hajj?.used || 0, remaining: b.hajj?.remaining || 0 },
        marriage: { total: b.marriage?.total || 0, used: b.marriage?.used || 0, remaining: b.marriage?.remaining || 0 },
        others: { total: b.others?.total || 0, used: b.others?.used || 0, remaining: b.others?.remaining || 0 },
        maternity: { total: b.maternity?.total || 0, used: b.maternity?.used || 0, remaining: b.maternity?.remaining || 0 },
      });
      setSelectedEmployeeId(id);
      setCurrentView('edit');
    }
  };

  const handleSaveBalance = async () => {
    try {
      await API.put(`/leave-balance/${editingEmployee.id}`, editFormData);
      fetchData();
      setCurrentView('list');
    } catch (err) {
      alert('Failed to save balances');
    }
  };

  const runMonthlyUpdate = async () => {
    try {
      if (!window.confirm("Are you sure you want to run the monthly leave update? This will add 2.5 days to Annual and 1.25 days to Sick for all active employees.")) return;
      await API.post('/leave-balance/monthly-update');
      fetchData();
      alert('Monthly update completed successfully');
    } catch (err) {
      alert('Failed to run monthly update');
    }
  };

  const updateEditForm = (type, field, value) => {
    const numValue = parseFloat(value) || 0;
    setEditFormData(prev => {
      const updatedType = { ...prev[type], [field]: numValue };
      updatedType.remaining = Math.max(0, updatedType.total - updatedType.used);
      return { ...prev, [type]: updatedType };
    });
  };

  const handleDelete = async () => {
    if (confirmDelete) {
      try {
        await API.delete(`/leave-balance/${confirmDelete}`);
        fetchData();
        setConfirmDelete(null);
      } catch (err) {
        alert('Failed to delete leave balance');
      }
    }
  };

  const myBalance = useMemo(() => {
    return balances.find(b => b.employeeId === user?.id) || null;
  }, [balances, user]);

  if (currentView === 'edit') {
    return (
      <div className="space-y-6 animate-fade-in pb-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
               onClick={() => { setCurrentView('list'); setEditingEmployee(null); }}
               className="w-10 h-10 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-500 hover:text-primary transition-all active:scale-95"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-black text-gray-800 tracking-tight leading-none">Edit Employee Balances</h1>
              <p className="text-sm text-gray-500 mt-1.5 font-medium">Adjust leave entitlements for {editingEmployee?.name}</p>
            </div>
          </div>
          <button 
             onClick={handleSaveBalance}
             className="bg-[#F59E0B] hover:bg-[#D97706] text-white px-10 py-3.5 rounded-2xl shadow-lg shadow-orange-500/20 flex items-center gap-2 font-black text-sm transition-all active:scale-95"
          >
            <Save size={18} /> Save Balances
          </button>
        </div>

        <div className="card p-8 border-none shadow-sm bg-white">
          <div className="mb-8 max-w-sm">
            <label className="text-[11px] font-bold text-gray-500 uppercase mb-2 block tracking-widest">Select Employee</label>
            <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between opacity-80">
               <span className="text-sm font-semibold text-gray-600">{editingEmployee?.firstName} {editingEmployee?.lastName}</span>
               <ChevronDown size={16} className="text-gray-300" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {LEAVE_TYPES.map(type => (
              <div key={type.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-1.5 h-6 rounded-full ${ACCENT_COLORS[type.color]}`} />
                  <h3 className="font-extrabold text-gray-800 text-sm tracking-tight">{type.label}</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Total Days</label>
                    <input 
                      type="number" 
                      step="any"
                      value={editFormData[type.id].total} 
                      onChange={(e) => updateEditForm(type.id, 'total', e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Used Days</label>
                    <input 
                      type="number" 
                      step="any"
                      value={editFormData[type.id].used} 
                      onChange={(e) => updateEditForm(type.id, 'used', e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-5 border-t border-gray-50">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Remaining:</span>
                  <span className={`text-2xl font-black ${editFormData[type.id].remaining > 0 ? 'text-[#0EA5A4]' : 'text-gray-300'} transition-colors`}>
                    {editFormData[type.id].remaining}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {viewItem && <ViewBalanceModal item={viewItem} onClose={() => setViewItem(null)} />}
      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Remove Employee Balance?"
        message="Are you sure you want to remove this employee's leave balance record?"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight leading-none">Leave Balance Management</h1>
            <p className="text-sm text-gray-500 mt-1.5 font-medium">Manage and adjust leave balances for all employees</p>
          </div>
        </div>
        {user?.role === 'admin' && (
          <button 
            onClick={runMonthlyUpdate}
            className="btn-primary flex items-center justify-center gap-2 px-6 py-3 rounded-2xl shadow-xl shadow-primary/20 font-bold text-sm transform transition-transform hover:scale-105 active:scale-95 whitespace-nowrap"
          >
            <Calendar size={18} /> Run Monthly Update
          </button>
        )}
      </div>

      {/* Top Selector Card */}
      {user?.role !== 'manager' && (
        <div className="card p-6 border-none shadow-sm bg-white overflow-visible">
          <h2 className="text-sm font-bold text-gray-800 mb-4">Edit Employee Balances</h2>
          <div className="space-y-1.5 relative w-full">
            <label className="text-[11px] font-bold text-gray-400 uppercase">Select Employee</label>
            <div className="relative group min-w-0 w-full">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Search size={18} />
              </div>
              <select 
                value={selectedEmployeeId}
                onChange={(e) => handleEdit(parseInt(e.target.value))}
                className="w-full pl-12 pr-10 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium text-gray-600 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all cursor-pointer"
              >
                <option value="">Search and select an employee...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <ChevronDown size={18} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="card p-0 overflow-hidden border-none shadow-sm bg-white">
        <div className="px-6 py-5 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-sm font-bold text-gray-800">All Employee Balances (Remaining Days)</h2>
          <div className="relative w-full md:max-w-xs shrink-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Filter by name..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            />
          </div>
        </div>

        <div className="hidden lg:block overflow-x-auto min-w-0">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Employee Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Annual</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Sick</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Relatives Death</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Hajj</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Marriage</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Others</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Maternity</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredBalances.map((b) => (
                <tr key={b.employeeId} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                        {b.employee?.firstName?.charAt(0)}
                      </div>
                      <span className="text-sm font-bold text-gray-700">{b.employee?.firstName} {b.employee?.lastName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-xs font-black ${b.annual.remaining > 0 ? 'bg-primary text-white shadow-lg shadow-primary/20 animate-pulse-slow' : 'bg-gray-100 text-gray-400'}`}>
                      {b.annual.remaining}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black ${b.sick.remaining > 0 ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-gray-50 text-gray-300'}`}>
                      {b.sick.remaining}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-xs font-bold text-gray-400">{b.relativesDeath.remaining}</td>
                  <td className="px-6 py-4 text-center text-xs font-bold text-gray-400">{b.hajj.remaining}</td>
                  <td className="px-6 py-4 text-center text-xs font-bold text-gray-400">{b.marriage.remaining}</td>
                  <td className="px-6 py-4 text-center text-xs font-bold text-gray-400">{b.others.remaining}</td>
                  <td className="px-6 py-4 text-center text-xs font-bold text-gray-400">{b.maternity?.remaining || 0}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setViewItem(b)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/5 transition-all"
                        title="View"
                      >
                        <Eye size={15} />
                      </button>
                      {user?.role !== 'manager' && (
                        <button
                          onClick={() => handleEdit(b.employeeId)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-secondary hover:bg-orange-50 transition-all"
                          title="Edit"
                        >
                          <Edit2 size={15} />
                        </button>
                      )}
                      {user?.role !== 'manager' && (
                        <button
                          onClick={() => setConfirmDelete(b.employeeId)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden divide-y divide-gray-50 min-w-0">
          {filteredBalances.length === 0 && (
             <div className="p-10 text-center text-gray-400 text-sm font-medium">No records found.</div>
          )}
          {filteredBalances.map((b) => (
            <div key={b.employeeId} className="p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-sm font-black">
                    {b.employee?.firstName?.charAt(0)}
                  </div>
                  <span className="text-sm font-black text-gray-800">{b.employee?.firstName} {b.employee?.lastName}</span>
                </div>
                 <div className="flex items-center gap-1">
                   <button
                     onClick={() => setViewItem(b)}
                     className="w-9 h-9 rounded-xl bg-gray-50 text-gray-400 hover:text-primary hover:bg-primary/5 flex items-center justify-center border border-gray-100 transition-all"
                     title="View"
                   >
                     <Eye size={15} />
                   </button>
                   {user?.role !== 'manager' && (
                     <button
                       onClick={() => handleEdit(b.employeeId)}
                       className="w-9 h-9 rounded-xl bg-gray-50 text-gray-400 hover:text-secondary hover:bg-orange-50 flex items-center justify-center border border-gray-100 transition-all"
                       title="Edit"
                     >
                       <Edit2 size={15} />
                     </button>
                   )}
                   {user?.role !== 'manager' && (
                     <button
                       onClick={() => setConfirmDelete(b.employeeId)}
                       className="w-9 h-9 rounded-xl bg-gray-50 text-gray-400 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center border border-gray-100 transition-all"
                       title="Delete"
                     >
                       <Trash2 size={15} />
                     </button>
                   )}
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Annual</p>
                  <span className={`text-lg font-black ${b.annual.remaining > 0 ? 'text-primary' : 'text-gray-300'}`}>{b.annual.remaining}</span>
                </div>
                <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Sick</p>
                  <span className={`text-lg font-black ${b.sick.remaining > 0 ? 'text-rose-500' : 'text-gray-300'}`}>{b.sick.remaining}</span>
                </div>
                <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Hajj</p>
                  <span className={`text-lg font-black ${b.hajj.remaining > 0 ? 'text-emerald-500' : 'text-gray-300'}`}>{b.hajj.remaining}</span>
                </div>
                <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Marriage</p>
                  <span className={`text-lg font-black ${b.marriage.remaining > 0 ? 'text-indigo-500' : 'text-gray-300'}`}>{b.marriage.remaining}</span>
                </div>
                <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Death</p>
                  <span className={`text-lg font-black ${b.relativesDeath.remaining > 0 ? 'text-slate-500' : 'text-gray-300'}`}>{b.relativesDeath.remaining}</span>
                </div>
                <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Maternity</p>
                  <span className={`text-lg font-black ${(b.maternity?.remaining || 0) > 0 ? 'text-teal-500' : 'text-gray-300'}`}>{b.maternity?.remaining || 0}</span>
                </div>
                <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Others</p>
                  <span className={`text-lg font-black ${b.others.remaining > 0 ? 'text-orange-500' : 'text-gray-300'}`}>{b.others.remaining}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* My Leave Balances Section */}
      <div className="pt-4 border-t border-dashed border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight leading-none">My Leave Balances</h1>
            <p className="text-sm text-gray-500 mt-1.5 font-medium">Track your available time off and history</p>
          </div>

        </div>

        {myBalance ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 block">Annual Leave</span>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-6xl font-black text-gray-800 tracking-tighter">{myBalance.annual.remaining}</span>
                  <span className="text-xl font-bold text-gray-300">days</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock size={14} className="text-primary" />
                  <span className="text-xs font-bold uppercase tracking-widest opacity-60">Accrues 2.5 days/month</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10 border-t-4 border-rose-500 pt-1">
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-4 block">Sick Leave</span>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-6xl font-black text-gray-800 tracking-tighter">{myBalance.sick.remaining}</span>
                  <span className="text-xl font-bold text-gray-300">days</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock size={14} className="text-rose-500" />
                  <span className="text-xs font-bold uppercase tracking-widest opacity-60">Accrues 1.25 days/month</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50/80 backdrop-blur-md rounded-[2.5rem] p-8 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden group">
               <div className="w-16 h-16 rounded-2xl bg-white shadow-inner flex items-center justify-center text-gray-400 mb-4 group-hover:scale-110 transition-transform duration-500">
                  <Calendar size={32} />
               </div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Next Auto-Increment</p>
               <h3 className="text-2xl font-black text-gray-800 tracking-tight">April 1, 2026</h3>
            </div>
          </div>
        ) : (
          <div className="card bg-gray-50 border-dashed border-2 border-gray-200 p-10 text-center">
            <Info className="mx-auto text-gray-300 mb-3" size={40} />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No balance records found for your account</p>
          </div>
        )}
      </div>
    </div>
  );
}
