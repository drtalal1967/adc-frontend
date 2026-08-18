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
  AlertTriangle,
  ChevronDown,
  FileText
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const LEAVE_TYPES = [
  { id: 'annual', label: 'Annual Leave', color: 'primary' },
  { id: 'sick', label: 'Sick Leave', color: 'rose' },
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

const LEAVE_TYPE_MAP = {
  annual: 'ANNUAL',
  sick: 'SICK',
  hajj: 'HAJJ',
  marriage: 'MARRIAGE',
  others: 'OTHERS',
  maternity: 'MATERNITY',
};

const toDateKey = (value) => {
  if (!value) return '';
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const formatReportDate = (value) => {
  const key = toDateKey(value);
  if (!key) return '';
  const [year, month, day] = key.split('-');
  return `${day}/${month}/${year}`;
};

function LeaveMovementReportModal({ rows, summary, onClose }) {
  if (!rows) return null;

  const handleExportPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const generatedAt = new Date().toLocaleString('en-GB');

    doc.setFontSize(15);
    doc.setTextColor(31, 48, 79);
    doc.text('Leave Movement Report', 12, 14);
    doc.setFontSize(9);
    doc.setTextColor(90, 100, 115);
    doc.text(summary.title || '', 12, 21);
    doc.text(summary.subtitle || '', 12, 27);
    doc.text(`Generated: ${generatedAt}`, 12, 33);
    doc.text(
      `Closing Balance: ${summary.closingBalance.toFixed(2)}    Total Additions: ${summary.totalAdditions.toFixed(2)}    Subtractions: ${summary.totalDeductions.toFixed(2)}`,
      12,
      39
    );

    autoTable(doc, {
      startY: 45,
      head: [['Date', 'Employee', 'Leave Type', 'Movement', 'Added', 'Subtracted', 'Balance', 'Notes']],
      body: rows.map(row => [
        formatReportDate(row.date),
        row.employeeName || '',
        row.leaveLabel || '',
        row.movement || '',
        row.added ? row.added.toFixed(2) : '',
        row.subtracted ? row.subtracted.toFixed(2) : '',
        Number(row.balanceAfter || 0).toFixed(2),
        row.notes || ''
      ]),
      margin: { left: 10, right: 10 },
      styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak', valign: 'middle' },
      headStyles: { fillColor: [47, 72, 151], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 38 },
        2: { cellWidth: 28 },
        3: { cellWidth: 34 },
        4: { cellWidth: 18, halign: 'right' },
        5: { cellWidth: 22, halign: 'right' },
        6: { cellWidth: 20, halign: 'right' },
        7: { cellWidth: 103 }
      }
    });

    doc.save(`Leave_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="modal-overlay z-[120]" onClick={onClose}>
      <div className="modal-content w-[98vw] max-w-[1800px] 2xl:max-w-[92vw] bg-white overflow-hidden rounded-[2rem] shadow-2xl animate-scale-in flex flex-col" style={{ maxHeight: 'min(90vh, 840px)' }} onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-header px-8 py-6 flex items-center justify-between text-white shrink-0">
          <div>
            <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold">Leave Movement Report</p>
            <h2 className="font-black text-2xl tracking-tight mt-1">{summary.title}</h2>
            <p className="text-xs text-white/70 mt-1">{summary.subtitle}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={22} /></button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-gray-50 border-b border-gray-100 shrink-0">
          <div className="rounded-2xl bg-white border border-gray-100 p-3">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Closing Balance</p>
            <p className="text-2xl font-black text-blue-700 mt-1">{summary.closingBalance.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl bg-white border border-gray-100 p-3">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Additions</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{summary.totalAdditions.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl bg-white border border-gray-100 p-3">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Subtractions</p>
            <p className="text-2xl font-black text-rose-600 mt-1">{summary.totalDeductions.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl bg-white border border-gray-100 p-3">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Net Movement</p>
            <p className="text-2xl font-black text-primary mt-1">{summary.netMovement.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl bg-white border border-gray-100 p-3">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Rows</p>
            <p className="text-2xl font-black text-gray-800 mt-1">{rows.length}</p>
          </div>
        </div>
        <div className="overflow-y-auto overflow-x-hidden flex-1">
          <table className="w-full table-fixed text-left">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Leave Type</th>
                <th className="px-4 py-3">Movement</th>
                <th className="px-4 py-3 text-right">Added</th>
                <th className="px-4 py-3 text-right">Subtracted</th>
                <th className="px-4 py-3 text-right">Balance</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.length === 0 ? (
                <tr><td colSpan="8" className="px-4 py-10 text-center text-sm font-bold text-gray-400">No leave movements found for this selection.</td></tr>
              ) : rows.map((row, index) => (
                <tr key={`${row.employeeId}-${row.leaveType}-${row.date}-${index}`} className="text-sm">
                  <td className="px-4 py-3 font-bold text-gray-700">{formatReportDate(row.date)}</td>
                  <td className="px-4 py-3 font-bold text-gray-800">{row.employeeName}</td>
                  <td className="px-4 py-3 text-gray-600">{row.leaveLabel}</td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${row.kind === 'addition' ? 'bg-emerald-50 text-emerald-600' : row.kind === 'deduction' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                      {row.movement}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-black text-emerald-600">{row.added ? row.added.toFixed(2) : ''}</td>
                  <td className="px-4 py-3 text-right font-black text-rose-600">{row.subtracted ? row.subtracted.toFixed(2) : ''}</td>
                  <td className="px-4 py-3 text-right font-black text-gray-900">{Number(row.balanceAfter || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-500">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
          <button onClick={handleExportPdf} className="btn-export-pdf px-6 py-3 rounded-2xl text-sm font-black flex items-center gap-2"><FileText size={16} /> Export PDF</button>
          <button onClick={onClose} className="btn-primary px-8 py-3 rounded-2xl text-sm font-black">Close</button>
        </div>
      </div>
    </div>
  );
}

export default function LeaveBalanceManagement() {
  const { user, checkPermission } = useAuth();
  const canUpdate = checkPermission('leave_balance', 'update');
  const canDelete = checkPermission('leave_balance', 'delete');
  const canRunMonthlyUpdate = String(user?.role || '').toLowerCase() === 'admin' && canUpdate;
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
  const [publicHolidays, setPublicHolidays] = useState([]);
  const [holidayForm, setHolidayForm] = useState({ name: '', date: '', endDate: '', notes: '' });
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [reportForm, setReportForm] = useState({
    employeeId: 'All',
    leaveType: 'annual',
    year: String(new Date().getFullYear())
  });
  const [reportData, setReportData] = useState(null);

  const canEditLeaveType = (typeId) => {
    if (!canUpdate) return false;
    if (typeId === 'annual') return user?.role === 'admin';
    return true;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [balRes, empRes, holidayRes, leavesRes] = await Promise.all([
        API.get('/leave-balance'),
        API.get('/employees'),
        API.get(`/public-holidays?year=${new Date().getFullYear()}`),
        API.get('/leave-requests')
      ]);
      setBalances(balRes.data);
      setEmployees(empRes.data);
      setPublicHolidays(holidayRes.data || []);
      setLeaveRequests(leavesRes.data || []);
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
      if (!window.confirm("Manual Monthly Update is only a backup if the automatic monthly update did not run. It will add 2.5 days to Annual Leave for all active employees and can duplicate the monthly credit if run twice. Continue?")) return;
      await API.post('/leave-balance/monthly-update');
      fetchData();
      alert('Manual monthly update completed successfully');
    } catch (err) {
      alert('Failed to run manual monthly update');
    }
  };

  const updateEditForm = (type, field, value) => {
    const numValue = parseFloat(value) || 0;
    setEditFormData(prev => {
      const updatedType = { ...prev[type], [field]: numValue };
      updatedType.remaining = updatedType.total - updatedType.used;
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

  const handleAddHoliday = async () => {
    const payload = { ...holidayForm, endDate: holidayForm.endDate || holidayForm.date };
    if (!payload.name.trim() || !payload.date) {
      alert('Please enter the holiday name and start date.');
      return;
    }
    if (payload.endDate && payload.endDate < payload.date) {
      alert('The holiday end date cannot be before the start date.');
      return;
    }
    try {
      await API.post('/public-holidays', payload);
      setHolidayForm({ name: '', date: '', endDate: '', notes: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save public holiday');
    }
  };

  const handleDeleteHoliday = async (id) => {
    if (!window.confirm('Delete this public holiday?')) return;
    try {
      await API.delete(`/public-holidays/${id}`);
      setPublicHolidays(prev => prev.filter(holiday => holiday.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete public holiday');
    }
  };

  const formatHolidayDate = (value) => {
    if (!value) return '';
    const [year, month, day] = String(value).slice(0, 10).split('-');
    return `${day}/${month}/${year}`;
  };

  const formatHolidayRange = (holiday) => {
    const start = formatHolidayDate(holiday.date);
    const end = formatHolidayDate(holiday.endDate || holiday.date);
    return start === end ? start : `${start} to ${end}`;
  };

  const buildLeaveReport = () => {
    const year = parseInt(reportForm.year, 10) || new Date().getFullYear();
    const todayKey = toDateKey(new Date());
    const selectedLeaveTypes = reportForm.leaveType === 'All'
      ? LEAVE_TYPES
      : LEAVE_TYPES.filter(type => type.id === reportForm.leaveType);
    const selectedEmployees = employees.filter(employee => {
      if (reportForm.employeeId !== 'All' && String(employee.id) !== String(reportForm.employeeId)) return false;
      return String(employee.employmentType || 'FULL_TIME').toUpperCase() !== 'PART_TIME';
    });

    const rows = [];
    const addRow = (row) => rows.push(row);

    selectedEmployees.forEach(employee => {
      const balance = balances.find(item => Number(item.employeeId) === Number(employee.id));
      const employeeName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim();

      selectedLeaveTypes.forEach(type => {
        const dbLeaveType = LEAVE_TYPE_MAP[type.id];
        const balanceType = balance?.[type.id];
        const typeAdditions = [];

        if (type.id === 'annual') {
          for (let month = 0; month < 12; month += 1) {
            const date = `${year}-${String(month + 1).padStart(2, '0')}-01`;
            if (date <= todayKey) {
              typeAdditions.push({ date, amount: 2.5, movement: 'Monthly Credit', notes: 'Automatic annual leave monthly addition' });
            }
          }
        } else if (type.id === 'sick' && employee.joiningDate) {
          const joinKey = toDateKey(employee.joiningDate);
          const [, month, day] = joinKey.split('-');
          const date = `${year}-${month}-${day}`;
          if (date <= todayKey) {
            typeAdditions.push({ date, amount: 15, movement: 'Yearly Credit', notes: 'Sick leave yearly employment anniversary addition' });
          }
        }

        const approvedRequests = leaveRequests.filter(request => (
          Number(request.employeeId) === Number(employee.id) &&
          String(request.leaveType || '').toUpperCase() === dbLeaveType &&
          String(request.status || '').toUpperCase() === 'APPROVED' &&
          String(toDateKey(request.startDate)).startsWith(String(year))
        ));
        const knownAdditionTotal = typeAdditions.reduce((sum, item) => sum + item.amount, 0);
        const knownDeductionTotal = approvedRequests.reduce((sum, request) => sum + Number(request.totalDays || 0), 0);
        const currentRemaining = Number(balanceType?.remaining || 0);
        const reconciliation = currentRemaining - knownAdditionTotal + knownDeductionTotal;

        if (Math.abs(reconciliation) > 0.001) {
          addRow({
            date: `${year}-01-01`,
            employeeId: employee.id,
            employeeName,
            leaveType: dbLeaveType,
            leaveLabel: type.label,
            kind: reconciliation >= 0 ? 'addition' : 'deduction',
            movement: reconciliation >= 0 ? 'Opening / Manual Balance' : 'Manual Reduction',
            added: reconciliation > 0 ? reconciliation : 0,
            subtracted: reconciliation < 0 ? Math.abs(reconciliation) : 0,
            order: 0,
            notes: 'Opening/reconciliation balance so the statement closing balance matches the current remaining balance.'
          });
        }

        typeAdditions.forEach(item => addRow({
          date: item.date,
          employeeId: employee.id,
          employeeName,
          leaveType: dbLeaveType,
          leaveLabel: type.label,
          kind: 'addition',
          movement: item.movement,
          added: item.amount,
          subtracted: 0,
          order: 1,
          notes: item.notes
        }));

        approvedRequests.forEach(request => addRow({
            date: toDateKey(request.startDate),
            employeeId: employee.id,
            employeeName,
            leaveType: dbLeaveType,
            leaveLabel: type.label,
            kind: 'deduction',
            movement: 'Approved Leave',
            added: 0,
            subtracted: Number(request.totalDays || 0),
            order: 2,
            notes: `${formatReportDate(request.startDate)} to ${formatReportDate(request.endDate)}${request.reason ? ` - ${request.reason}` : ''}`
          }));
      });
    });

    rows.sort((a, b) => (
      a.employeeName.localeCompare(b.employeeName) ||
      a.leaveLabel.localeCompare(b.leaveLabel) ||
      a.date.localeCompare(b.date) ||
      Number(a.order || 0) - Number(b.order || 0) ||
      a.movement.localeCompare(b.movement)
    ));

    const runningBalances = new Map();
    rows.forEach(row => {
      const key = `${row.employeeId}-${row.leaveType}`;
      const current = runningBalances.get(key) || 0;
      const next = current + Number(row.added || 0) - Number(row.subtracted || 0);
      row.balanceAfter = next;
      runningBalances.set(key, next);
    });

    const totalAdditions = rows.reduce((sum, row) => sum + Number(row.added || 0), 0);
    const totalDeductions = rows.reduce((sum, row) => sum + Number(row.subtracted || 0), 0);
    const closingBalance = Array.from(runningBalances.values()).reduce((sum, amount) => sum + Number(amount || 0), 0);
    const employeeLabel = reportForm.employeeId === 'All'
      ? 'All full-time employees'
      : selectedEmployees[0] ? `${selectedEmployees[0].firstName} ${selectedEmployees[0].lastName}` : 'Selected employee';
    const typeLabel = reportForm.leaveType === 'All'
      ? 'All leave types'
      : LEAVE_TYPES.find(type => type.id === reportForm.leaveType)?.label || 'Selected leave type';

    setReportData({
      rows,
      summary: {
        title: `${employeeLabel} - ${year}`,
        subtitle: typeLabel,
        totalAdditions,
        totalDeductions,
        netMovement: totalAdditions - totalDeductions,
        closingBalance,
      }
    });
  };

  const myBalance = useMemo(() => {
    return balances.find(b => b.employeeId === user?.id) || null;
  }, [balances, user]);

  const myLeaveBalancesSection = (
    <div className="card p-6 border-none shadow-sm bg-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-gray-800 tracking-tight leading-none">My Leave Balances</h2>
          <p className="text-sm text-gray-500 mt-1.5 font-medium">Track your available time off and history</p>
        </div>
      </div>

      {myBalance ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-500">
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

          <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-500">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10 border-t-4 border-rose-500 pt-1">
              <div className="mb-4">
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] block">Sick Leave</span>
                <p className="text-[10px] font-bold text-gray-400 mt-1">Medical sick leave certificate is required.</p>
              </div>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-6xl font-black text-gray-800 tracking-tighter">{myBalance.sick.remaining}</span>
                <span className="text-xl font-bold text-gray-300">days</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Clock size={14} className="text-rose-500" />
                <span className="text-xs font-bold uppercase tracking-widest opacity-60">Controlled manually</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50/80 backdrop-blur-md rounded-[2rem] p-6 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden group">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-inner flex items-center justify-center text-gray-400 mb-4 group-hover:scale-110 transition-transform duration-500">
              <Calendar size={32} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Next Auto-Increment</p>
            <h3 className="text-2xl font-black text-gray-800 tracking-tight">1st of each month</h3>
          </div>
        </div>
      ) : (
        <div className="card bg-gray-50 border-dashed border-2 border-gray-200 p-10 text-center">
          <Info className="mx-auto text-gray-300 mb-3" size={40} />
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No balance records found for your account</p>
        </div>
      )}
    </div>
  );

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
             className="bg-[#F58220] hover:bg-[#D97706] text-white px-10 py-3.5 rounded-2xl shadow-lg shadow-orange-500/20 flex items-center gap-2 font-black text-sm transition-all active:scale-95"
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
              <div key={type.id} className={`bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 ${!canEditLeaveType(type.id) ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-1.5 h-6 rounded-full ${ACCENT_COLORS[type.color]}`} />
                  <div className="flex-1">
                    <h3 className="font-extrabold text-gray-800 text-sm tracking-tight">{type.label}</h3>
                    {!canEditLeaveType(type.id) && <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Read only</p>}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Total Days</label>
                    <input 
                      type="number" 
                      step="any"
                      value={editFormData[type.id].total} 
                      onChange={(e) => updateEditForm(type.id, 'total', e.target.value)}
                      disabled={!canEditLeaveType(type.id)}
                      className="w-full px-3 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Used Days</label>
                    <input 
                      type="number" 
                      step="any"
                      value={editFormData[type.id].used} 
                      onChange={(e) => updateEditForm(type.id, 'used', e.target.value)}
                      disabled={!canEditLeaveType(type.id)}
                      className="w-full px-3 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-5 border-t border-gray-50">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Remaining:</span>
                  <span className={`text-2xl font-black ${editFormData[type.id].remaining >= 0 ? 'text-[#2C4697]' : 'text-red-500'}
 transition-colors`}>
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
      {reportData && <LeaveMovementReportModal rows={reportData.rows} summary={reportData.summary} onClose={() => setReportData(null)} />}
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
        {canRunMonthlyUpdate && (
          <div className="flex flex-col sm:items-end gap-2">
            <button 
              onClick={runMonthlyUpdate}
              className="btn-primary flex items-center justify-center gap-2 px-6 py-3 rounded-2xl shadow-xl shadow-primary/20 font-bold text-sm transform transition-transform hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              <Calendar size={18} /> Manual Monthly Update
            </button>
            <div className="flex items-start gap-2 max-w-sm text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-2xl px-3 py-2">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>Backup only. Automatic update already runs monthly; running this twice adds another 2.5 days.</span>
            </div>
          </div>
        )}
      </div>

      {myLeaveBalancesSection}

      {canUpdate && (
        <div className="card p-6 border-none shadow-sm bg-white">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-primary flex items-center justify-center">
                <FileText size={20} />
              </div>
              <div>
                <h2 className="text-sm font-black text-gray-800 tracking-tight">Leave Movement Report</h2>
                <p className="text-xs font-semibold text-gray-500 mt-0.5">View leave additions, approved deductions, and balance reconciliation.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1.25fr_1fr_0.75fr_auto] gap-3 flex-1 lg:max-w-4xl">
              <select
                value={reportForm.employeeId}
                onChange={e => setReportForm(prev => ({ ...prev, employeeId: e.target.value }))}
                className="h-12 rounded-2xl border border-gray-100 bg-gray-50 px-4 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="All">All Full-Time Employees</option>
                {employees
                  .filter(employee => String(employee.employmentType || 'FULL_TIME').toUpperCase() !== 'PART_TIME')
                  .map(employee => (
                    <option key={employee.id} value={employee.id}>{employee.firstName} {employee.lastName}</option>
                  ))}
              </select>
              <select
                value={reportForm.leaveType}
                onChange={e => setReportForm(prev => ({ ...prev, leaveType: e.target.value }))}
                className="h-12 rounded-2xl border border-gray-100 bg-gray-50 px-4 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="All">All Leave Types</option>
                {LEAVE_TYPES.map(type => <option key={type.id} value={type.id}>{type.label}</option>)}
              </select>
              <input
                type="number"
                value={reportForm.year}
                min="2020"
                max="2100"
                onChange={e => setReportForm(prev => ({ ...prev, year: e.target.value }))}
                className="h-12 rounded-2xl border border-gray-100 bg-gray-50 px-4 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={buildLeaveReport}
                className="h-12 px-6 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                <Eye size={16} /> View Report
              </button>
            </div>
          </div>
        </div>
      )}

      {canUpdate && (
        <div className="card p-6 border-none shadow-sm bg-white overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center">
                  <Calendar size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-gray-800 tracking-tight">Public Holidays</h2>
                  <p className="text-xs font-semibold text-gray-500 mt-0.5">These date ranges will show in Work Schedule and will not be deducted from employee leave balances.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[1.1fr_0.75fr_0.75fr_1.2fr_auto] gap-3">
                <input
                  value={holidayForm.name}
                  onChange={e => setHolidayForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Holiday name"
                  className="h-12 rounded-2xl border border-gray-100 bg-gray-50 px-4 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <input
                  type="date"
                  value={holidayForm.date}
                  onChange={e => setHolidayForm(prev => ({ ...prev, date: e.target.value, endDate: prev.endDate || e.target.value }))}
                  title="From"
                  className="h-12 rounded-2xl border border-gray-100 bg-gray-50 px-4 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <input
                  type="date"
                  value={holidayForm.endDate}
                  onChange={e => setHolidayForm(prev => ({ ...prev, endDate: e.target.value }))}
                  title="To"
                  className="h-12 rounded-2xl border border-gray-100 bg-gray-50 px-4 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <input
                  value={holidayForm.notes}
                  onChange={e => setHolidayForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notes (optional)"
                  className="h-12 rounded-2xl border border-gray-100 bg-gray-50 px-4 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={handleAddHoliday}
                  className="h-12 px-5 rounded-2xl bg-[#F58220] hover:bg-[#D97706] text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                >
                  <Plus size={16} /> Add
                </button>
              </div>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {publicHolidays.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-xs font-bold text-gray-400 md:col-span-2 xl:col-span-3">No public holidays added for this year.</div>
            ) : publicHolidays.map(holiday => (
              <div key={holiday.id} className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-black text-gray-800 truncate">{holiday.name}</p>
                  <p className="text-xs font-bold text-orange-600 mt-1">{formatHolidayRange(holiday)}</p>
                  {holiday.notes && <p className="text-[11px] font-semibold text-gray-400 mt-1 truncate">{holiday.notes}</p>}
                </div>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => handleDeleteHoliday(holiday.id)}
                    className="w-9 h-9 rounded-xl bg-white text-gray-400 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center border border-orange-100 transition-all shrink-0"
                    title="Delete holiday"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Selector Card */}
      {canUpdate && (
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
                    <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-xs font-black ${b.annual.remaining > 0 ? 'bg-blue-50 text-[#1C3756] border border-blue-100 shadow-sm' : 'bg-gray-100 text-gray-400'}`}>
                      {b.annual.remaining}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-xs font-black ${b.sick.remaining > 0 ? 'bg-rose-50 text-rose-700 border border-rose-100 shadow-sm' : 'bg-gray-100 text-gray-400'}`}>
                      {b.sick.remaining}
                    </span>
                  </td>
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
                      {canUpdate && (
                        <button
                          onClick={() => handleEdit(b.employeeId)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-secondary hover:bg-orange-50 transition-all"
                          title="Edit"
                        >
                          <Edit2 size={15} />
                        </button>
                      )}
                      {canDelete && (
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
                   {canUpdate && (
                     <button
                       onClick={() => handleEdit(b.employeeId)}
                       className="w-9 h-9 rounded-xl bg-gray-50 text-gray-400 hover:text-secondary hover:bg-orange-50 flex items-center justify-center border border-gray-100 transition-all"
                       title="Edit"
                     >
                       <Edit2 size={15} />
                     </button>
                   )}
                   {canDelete && (
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

    </div>
  );
}
