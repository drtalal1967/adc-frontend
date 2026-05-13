import React, { useState, useEffect } from 'react';
import API from '../api';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Edit2, CalendarDays, Clock, X, Check, ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const toLocalDateKey = (value) => {
  if (!value) return '';
  const raw = String(value);
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw.slice(0, 10);
  return `${String(d.getFullYear()).padStart(4, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
};

function ScheduleModal({ onClose, onSave, employees }) {
  const today = new Date().toISOString().split('T')[0];
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextMonthStr = nextMonth.toISOString().split('T')[0];

  const [form, setForm] = useState({
    branch: 'Tubli',
    employeeId: '',
    startDate: today,
    endDate: nextMonthStr,
    daysOfWeek: ['Sun', 'Tue', 'Thu'],
    startTime: '09:00',
    endTime: '17:00'
  });

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleDay = (day) => {
    setForm(f => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(day)
        ? f.daysOfWeek.filter(d => d !== day)
        : [...f.daysOfWeek, day]
    }));
  };

  const getSelectedDates = () => {
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    const dates = [];
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];
    
    let current = new Date(start);
    while (current <= end) {
      const dayName = DAYS[current.getDay()];
      if (form.daysOfWeek.includes(dayName)) {
        dates.push(toLocalDateKey(current));
      }
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const selectedDates = getSelectedDates();
  const employee = employees.find(e => e.id === parseInt(form.employeeId));

  return (
    <div className="modal-overlay z-[100]" onClick={onClose}>
      <div className="modal-content max-w-2xl flex flex-col" style={{ maxHeight: 'min(90vh, 800px)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-xl font-bold text-gray-800">Create Multi-Day Schedule</h2>
          <button onClick={onClose} className="btn-icon text-gray-400"><X size={20} /></button>
        </div>
        
        <div className="p-6 space-y-6 flex-1 overflow-y-auto scrollbar-hide min-h-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Branch *</label>
              <select value={form.branch} onChange={e => update('branch', e.target.value)} className="input appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1em_1em] bg-[right_0.75rem_center] bg-no-repeat pr-10">
                <option value="Tubli">Tubli</option>
                <option value="Manama">Manama</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Employee *</label>
              <select value={form.employeeId} onChange={e => update('employeeId', e.target.value)} className="input appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1em_1em] bg-[right_0.75rem_center] bg-no-repeat pr-10">
                <option value="">Select employee...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Start Date *</label>
              <input type="date" value={form.startDate} onChange={e => update('startDate', e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">End Date *</label>
              <input type="date" value={form.endDate} onChange={e => update('endDate', e.target.value)} className="input" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Days of Week *</label>
            <div className="flex flex-wrap gap-2.5">
              {DAYS.map(day => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`px-4 py-2.5 rounded-full border text-sm font-medium flex items-center gap-2 transition-all
                    ${form.daysOfWeek.includes(day) 
                      ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm' 
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all
                    ${form.daysOfWeek.includes(day) ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                    {form.daysOfWeek.includes(day) && <Check size={10} className="text-white" />}
                  </div>
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Shift Start Time *</label>
              <input type="time" value={form.startTime} onChange={e => update('startTime', e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Shift End Time *</label>
              <input type="time" value={form.endTime} onChange={e => update('endTime', e.target.value)} className="input" />
            </div>
          </div>

          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex gap-4">
             <div className="stat-icon bg-white shadow-sm text-gray-400">
                <CalendarDays size={20} />
             </div>
             <div>
                <p className="font-bold text-gray-800 text-sm">Preview</p>
                <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                  Creating <span className="font-semibold text-gray-900">{selectedDates.length}</span> schedule entries 
                  from <span className="font-semibold text-gray-900">{form.startTime}</span> to <span className="font-semibold text-gray-900">{form.endTime}</span> on selected days 
                  between <span className="font-semibold text-gray-900">{form.startDate}</span> and <span className="font-semibold text-gray-900">{form.endDate}</span>.
                </p>
             </div>
          </div>
        </div>

        <div className="px-6 py-5 border-t border-gray-100 flex justify-end shrink-0 mt-auto">
          <button 
            disabled={!form.employeeId || selectedDates.length === 0}
            onClick={() => {
              const newSchedules = selectedDates.map(date => ({
                employeeId: parseInt(form.employeeId),
                date,
                startTime: form.startTime,
                endTime: form.endTime,
                branch: form.branch
              }));
              onSave(newSchedules);
            }} 
            className="btn-secondary px-8 py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-900/20"
          >
            Create {selectedDates.length} Schedules
          </button>
        </div>
      </div>

    </div>
  );
}

function EditScheduleModal({ schedule, employees, onClose, onSave }) {
  const [form, setForm] = useState({
    branch: schedule?.branch || 'Tubli',
    employeeId: schedule?.employeeId ? String(schedule.employeeId) : '',
    date: schedule?.date || '',
    startTime: schedule?.startTime?.slice(0, 5) || '09:00',
    endTime: schedule?.endTime?.slice(0, 5) || '17:00'
  });

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <div className="modal-overlay z-[100]" onClick={onClose}>
      <div className="modal-content max-w-lg bg-white overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Edit Schedule</h2>
            <p className="text-xs text-gray-400 font-semibold mt-0.5">Update this single schedule entry</p>
          </div>
          <button onClick={onClose} className="btn-icon text-gray-400"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Employee *</label>
            <select value={form.employeeId} onChange={e => update('employeeId', e.target.value)} className="input">
              <option value="">Select employee...</option>
              {employees.map(employee => (
                <option key={employee.id} value={employee.id}>{employee.firstName} {employee.lastName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Branch *</label>
            <select value={form.branch} onChange={e => update('branch', e.target.value)} className="input">
              <option value="Tubli">Tubli</option>
              <option value="Manama">Manama</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date *</label>
            <input type="date" value={form.date} onChange={e => update('date', e.target.value)} className="input" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Start Time *</label>
              <input type="time" value={form.startTime} onChange={e => update('startTime', e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">End Time *</label>
              <input type="time" value={form.endTime} onChange={e => update('endTime', e.target.value)} className="input" />
            </div>
          </div>
        </div>

        <div className="px-6 py-5 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="btn-ghost px-5 py-3 rounded-xl text-sm font-bold">Cancel</button>
          <button
            disabled={!form.employeeId || !form.date || !form.startTime || !form.endTime}
            onClick={() => onSave(schedule.id, {
              employeeId: parseInt(form.employeeId),
              branch: form.branch,
              date: form.date,
              startTime: form.startTime,
              endTime: form.endTime
            })}
            className="btn-secondary px-7 py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-900/20"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Schedule() {
  const { user, checkPermission } = useAuth();
  const canCreate = checkPermission('schedule', 'create');
  const canUpdate = checkPermission('schedule', 'update');
  const canDelete = checkPermission('schedule', 'delete');
  const [schedules, setSchedules] = useState([]);
  const [hoursSchedules, setHoursSchedules] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [modal, setModal] = useState(false);
  const [editSchedule, setEditSchedule] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('day');
  const [loading, setLoading] = useState(true);
  const [hoveredEmployee, setHoveredEmployee] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');

  useEffect(() => {
    fetchData();
  }, [selectedDate, viewMode]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let start, end;
      if (viewMode === 'day') {
        start = end = selectedDate;
      } else if (viewMode === 'week') {
        const range = getWeekRange(selectedDate);
        start = range.start;
        end = range.end;
      } else {
        const range = getMonthRange(selectedDate);
        start = range.start;
        end = range.end;
      }

      const summaryWeekRange = getWeekRange(selectedDate);
      const summaryMonthRange = getMonthRange(selectedDate);
      const summaryStart = summaryWeekRange.start < summaryMonthRange.start ? summaryWeekRange.start : summaryMonthRange.start;
      const summaryEnd = summaryWeekRange.end > summaryMonthRange.end ? summaryWeekRange.end : summaryMonthRange.end;

      const [schedRes, summarySchedRes] = await Promise.all([
        API.get('/schedules', { params: { start, end } }),
        API.get('/schedules', { params: { start: summaryStart, end: summaryEnd } }),
      ]);
      let fetchedSchedules = schedRes.data || [];
      let fetchedHoursSchedules = summarySchedRes.data || [];
      let fetchedLeaves = [];

      try {
        const leaveRes = await API.get('/leave-requests');
        fetchedLeaves = leaveRes.data || [];
        setLeaves(fetchedLeaves);
      } catch (err) {
        console.warn('Could not fetch leaves');
        setLeaves([]);
      }

      const approvedLeaves = fetchedLeaves.filter(l => {
        if (String(l.status || '').toUpperCase() !== 'APPROVED') return false;
        const leaveStart = toLocalDateKey(l.startDate);
        const leaveEnd = toLocalDateKey(l.endDate);
        return leaveStart <= summaryEnd && leaveEnd >= summaryStart;
      });

      const findLeave = (employeeId, dateStr) => approvedLeaves.find(l => {
        const leaveStart = toLocalDateKey(l.startDate);
        const leaveEnd = toLocalDateKey(l.endDate);
        return String(l.employeeId) === String(employeeId) && dateStr >= leaveStart && dateStr <= leaveEnd;
      });

      fetchedSchedules = fetchedSchedules.map(schedule => {
        const leave = findLeave(schedule.employeeId, schedule.date);
        return leave ? { ...schedule, status: 'On Leave', leaveType: leave.leaveType, title: 'On Leave' } : schedule;
      });

      fetchedHoursSchedules = fetchedHoursSchedules.map(schedule => {
        const leave = findLeave(schedule.employeeId, schedule.date);
        return leave ? { ...schedule, status: 'On Leave', leaveType: leave.leaveType, title: 'On Leave' } : schedule;
      });

      const scheduledKeys = new Set(fetchedSchedules.map(schedule => `${schedule.employeeId}|${schedule.date}`));
      const leaveOnlySchedules = [];
      approvedLeaves.forEach(leave => {
        const leaveStart = toLocalDateKey(leave.startDate);
        const leaveEnd = toLocalDateKey(leave.endDate);
        const current = new Date(leaveStart + 'T00:00:00');
        const last = new Date(leaveEnd + 'T00:00:00');
        while (current <= last) {
          const dateStr = toLocalDateKey(current);
          const key = `${leave.employeeId}|${dateStr}`;
          if (dateStr >= start && dateStr <= end && !scheduledKeys.has(key)) {
            leaveOnlySchedules.push({
              id: `leave-${leave.id}-${dateStr}`,
              employeeId: leave.employeeId,
              date: dateStr,
              startTime: '',
              endTime: '',
              branch: leave.employee?.branch || 'All Branches',
              status: 'On Leave',
              leaveType: leave.leaveType,
              title: 'On Leave',
              employeeName: leave.employee ? `${leave.employee.firstName} ${leave.employee.lastName}` : 'Employee on leave',
              employee: leave.employee,
              isLeaveOnly: true,
            });
          }
          current.setDate(current.getDate() + 1);
        }
      });

      setSchedules([...fetchedSchedules, ...leaveOnlySchedules]);
      setHoursSchedules(fetchedHoursSchedules);

      try {
        const empRes = await API.get('/employees');
        setEmployees(empRes.data);
      } catch (empErr) {
        console.warn('Could not fetch employees (likely permission limitation).');
      }
    } catch (err) {
      console.error('Error fetching schedule data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (newSchedules) => {
    try {
      await API.post('/schedules/batch', newSchedules);
      fetchData();
      setModal(false);
    } catch (err) {
      alert('Failed to save schedules');
    }
  };

  const handleUpdate = async (id, payload) => {
    try {
      await API.put(`/schedules/${id}`, payload);
      setEditSchedule(null);
      fetchData();
    } catch (err) {
      console.error('Error updating schedule:', err);
      alert(err.response?.data?.message || 'Failed to update schedule');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this shift?')) return;
    try {
      await API.delete(`/schedules/${id}`);
      setSchedules(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert('Failed to delete schedule');
    }
  };

  const getWeekRange = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat
    const daysSinceSaturday = (dayOfWeek - 6 + 7) % 7; // 0 if Sat, 1 if Sun, ...
    const start = new Date(date);
    start.setDate(date.getDate() - daysSinceSaturday);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start: toLocalDateKey(start), end: toLocalDateKey(end) };
  };

  const getMonthRange = (dateStr) => {
    const date = new Date(dateStr);
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return { start: toLocalDateKey(start), end: toLocalDateKey(end) };
  };

  const normalizeBranch = (branch) => String(branch || '')
    .toLowerCase()
    .replace(/\s+branch$/, '')
    .trim();

  const getScheduleBranch = (schedule) => {
    const emp = employees.find(e => String(e.id) === String(schedule.employeeId));
    return schedule.branch || schedule.employee?.branch || emp?.branch || '';
  };

  const filteredSchedules = schedules.filter(s => {
    const employeeMatch = selectedEmployee ? String(s.employeeId) === selectedEmployee : true;
    const branchMatch = selectedBranch ? normalizeBranch(getScheduleBranch(s)) === selectedBranch : true;
    return employeeMatch && branchMatch;
  });

  const filteredHoursSchedules = hoursSchedules.filter(s => {
    const employeeMatch = selectedEmployee ? String(s.employeeId) === selectedEmployee : true;
    const branchMatch = selectedBranch ? normalizeBranch(getScheduleBranch(s)) === selectedBranch : true;
    return employeeMatch && branchMatch;
  });

  const uniqueDates = [...new Set(filteredSchedules.map(s => s.date))].sort();

  const getViewHeader = () => {
    if (viewMode === 'day') return formatDate(selectedDate);
    if (viewMode === 'week') {
      const range = getWeekRange(selectedDate);
      return `${formatDate(range.start)} to ${formatDate(range.end)}`;
    }
    if (viewMode === 'month') {
      const date = new Date(selectedDate);
      return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    }
    return '';
  };

  const moveDate = (direction) => {
    const date = new Date(selectedDate + 'T00:00:00');
    if (viewMode === 'day') date.setDate(date.getDate() + direction);
    if (viewMode === 'week') date.setDate(date.getDate() + direction * 7);
    if (viewMode === 'month') date.setMonth(date.getMonth() + direction);
    setSelectedDate(toLocalDateKey(date));
  };

  const getMonthDays = (dateStr) => {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    // Saturday-based offset: Sat=0, Sun=1, Mon=2, ..., Fri=6
    const startOffset = (firstDay.getDay() - 6 + 7) % 7;
    
    const days = [];
    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const prevDay = prevMonthLastDay - i;
      const prevMonth = month === 0 ? 12 : month;
      const prevYear = month === 0 ? year - 1 : year;
      days.push({ day: prevDay, padding: true, date: `${prevYear}-${String(prevMonth).padStart(2,'0')}-${String(prevDay).padStart(2,'0')}` });
    }
    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ day: d, padding: false, date: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` });
    }
    // Next month padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextMonth = month + 2 > 12 ? 1 : month + 2;
      const nextYear = month + 2 > 12 ? year + 1 : year;
      days.push({ day: i, padding: true, date: `${nextYear}-${String(nextMonth).padStart(2,'0')}-${String(i).padStart(2,'0')}` });
    }
    return days;
  };

  const schedulesByDate = filteredSchedules.reduce((acc, s) => {
    if (!acc[s.date]) acc[s.date] = [];
    acc[s.date].push(s);
    return acc;
  }, {});

  const getShiftLabel = (startTime) => {
    const hour = parseInt(startTime.split(':')[0]);
    return hour < 12 ? 'Morning' : 'Evening';
  };

const getEmployeeColor = (employeeId, employee = null) => {
const isEmployeeOnLeave = (employeeId, date) => {
  return leaves.some(l => {
    if (l.status?.toUpperCase() !== 'APPROVED') return false;

    const current = date;
    const start = toLocalDateKey(l.startDate);
    const end = toLocalDateKey(l.endDate);

    return (
      String(l.employeeId) === String(employeeId) &&
      current >= start &&
      current <= end
    );
  });
};
  const colors = [
    { key: 'sky', bg: 'bg-sky-100', border: 'border-sky-600', text: 'text-sky-950', muted: 'text-sky-700', bar: 'bg-sky-600' },
    { key: 'emerald', bg: 'bg-emerald-100', border: 'border-emerald-600', text: 'text-emerald-950', muted: 'text-emerald-700', bar: 'bg-emerald-600' },
    { key: 'violet', bg: 'bg-violet-100', border: 'border-violet-600', text: 'text-violet-950', muted: 'text-violet-700', bar: 'bg-violet-600' },
    { key: 'amber', bg: 'bg-amber-100', border: 'border-amber-600', text: 'text-amber-950', muted: 'text-amber-700', bar: 'bg-amber-600' },
    { key: 'cyan', bg: 'bg-cyan-100', border: 'border-cyan-600', text: 'text-cyan-950', muted: 'text-cyan-700', bar: 'bg-cyan-600' },
    { key: 'fuchsia', bg: 'bg-fuchsia-100', border: 'border-fuchsia-600', text: 'text-fuchsia-950', muted: 'text-fuchsia-700', bar: 'bg-fuchsia-600' },
    { key: 'lime', bg: 'bg-lime-100', border: 'border-lime-600', text: 'text-lime-950', muted: 'text-lime-700', bar: 'bg-lime-600' },
    { key: 'indigo', bg: 'bg-indigo-100', border: 'border-indigo-600', text: 'text-indigo-950', muted: 'text-indigo-700', bar: 'bg-indigo-600' },
    { key: 'orange', bg: 'bg-orange-100', border: 'border-orange-600', text: 'text-orange-950', muted: 'text-orange-700', bar: 'bg-orange-600' },
    { key: 'teal', bg: 'bg-teal-100', border: 'border-teal-600', text: 'text-teal-950', muted: 'text-teal-700', bar: 'bg-teal-600' },
    { key: 'purple', bg: 'bg-purple-100', border: 'border-purple-600', text: 'text-purple-950', muted: 'text-purple-700', bar: 'bg-purple-600' },
    { key: 'pink', bg: 'bg-pink-100', border: 'border-pink-600', text: 'text-pink-950', muted: 'text-pink-700', bar: 'bg-pink-600' },
    { key: 'red', bg: 'bg-red-100', border: 'border-red-600', text: 'text-red-950', muted: 'text-red-700', bar: 'bg-red-600' },
    { key: 'blue', bg: 'bg-blue-100', border: 'border-blue-600', text: 'text-blue-950', muted: 'text-blue-700', bar: 'bg-blue-600' },
    { key: 'green', bg: 'bg-green-100', border: 'border-green-600', text: 'text-green-950', muted: 'text-green-700', bar: 'bg-green-600' },
    { key: 'yellow', bg: 'bg-yellow-100', border: 'border-yellow-600', text: 'text-yellow-950', muted: 'text-yellow-700', bar: 'bg-yellow-600' },
    { key: 'rose', bg: 'bg-rose-100', border: 'border-rose-600', text: 'text-rose-950', muted: 'text-rose-700', bar: 'bg-rose-600' },
    { key: 'slate', bg: 'bg-slate-100', border: 'border-slate-600', text: 'text-slate-950', muted: 'text-slate-700', bar: 'bg-slate-600' },
    { key: 'stone', bg: 'bg-stone-100', border: 'border-stone-600', text: 'text-stone-950', muted: 'text-stone-700', bar: 'bg-stone-600' },
    { key: 'zinc', bg: 'bg-zinc-100', border: 'border-zinc-600', text: 'text-zinc-950', muted: 'text-zinc-700', bar: 'bg-zinc-600' },
    { key: 'neutral', bg: 'bg-neutral-100', border: 'border-neutral-600', text: 'text-neutral-950', muted: 'text-neutral-700', bar: 'bg-neutral-600' },
    { key: 'gray', bg: 'bg-gray-100', border: 'border-gray-600', text: 'text-gray-950', muted: 'text-gray-700', bar: 'bg-gray-600' },
    { key: 'deepblue', bg: 'bg-blue-50', border: 'border-blue-800', text: 'text-blue-950', muted: 'text-blue-800', bar: 'bg-blue-800' },
    { key: 'deepgreen', bg: 'bg-green-50', border: 'border-green-800', text: 'text-green-950', muted: 'text-green-800', bar: 'bg-green-800' },
    { key: 'deeporange', bg: 'bg-orange-50', border: 'border-orange-800', text: 'text-orange-950', muted: 'text-orange-800', bar: 'bg-orange-800' },
  ];

  const savedColor = employee?.scheduleColor || employees.find(e => String(e.id) === String(employeeId))?.scheduleColor;
  const selectedColor = colors.find(color => color.key === savedColor);
  if (selectedColor) return selectedColor;

  const numericId = Number(employeeId);
  if (Number.isFinite(numericId) && numericId > 0) {
    return colors[(numericId - 1) % colors.length];
  }
  return colors[0];
};

  const getScheduleHours = (schedule) => {
    if (!schedule || schedule.status === 'On Leave' || schedule.isLeaveOnly) return 0;
    if (!schedule.startTime || !schedule.endTime) return 0;

    const toMinutes = (value) => {
      if (!value) return null;
      if (String(value).includes('T')) {
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d.getHours() * 60 + d.getMinutes();
      }
      const [hours, minutes] = String(value).slice(0, 5).split(':').map(Number);
      if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
      return hours * 60 + minutes;
    };

    const start = toMinutes(schedule.startTime);
    const end = toMinutes(schedule.endTime);
    if (start === null || end === null) return 0;
    const duration = end >= start ? end - start : end + 24 * 60 - start;
    return duration / 60;
  };

  const weekRange = getWeekRange(selectedDate);
  const monthRange = getMonthRange(selectedDate);
  const employeeHourSummary = (() => {
    const summary = new Map();
    filteredHoursSchedules.forEach(schedule => {
      const hours = getScheduleHours(schedule);
      if (hours <= 0) return;

      const employeeId = schedule.employeeId;
      const emp = employees.find(e => String(e.id) === String(employeeId)) || schedule.employee;
      const employeeName = schedule.employeeName || (emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown');

      if (!summary.has(employeeId)) {
        summary.set(employeeId, {
          employeeId,
          employee: emp,
          name: employeeName,
          weekHours: 0,
          monthHours: 0,
        });
      }

      const row = summary.get(employeeId);
      if (schedule.date >= weekRange.start && schedule.date <= weekRange.end) row.weekHours += hours;
      if (schedule.date >= monthRange.start && schedule.date <= monthRange.end) row.monthHours += hours;
    });

    return [...summary.values()]
      .filter(row => row.weekHours > 0 || row.monthHours > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  })();

  const formatHours = (hours) => Number(hours || 0).toLocaleString('en-US', {
    minimumFractionDigits: hours % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });
  
return (
    <div className="space-y-5 animate-fade-in">
      {modal && canCreate && <ScheduleModal onClose={() => setModal(false)} employees={employees} onSave={handleSave} />}
      {editSchedule && canUpdate && (
        <EditScheduleModal
          schedule={editSchedule}
          employees={employees}
          onClose={() => setEditSchedule(null)}
          onSave={handleUpdate}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title text-xl md:text-2xl">Schedule Setup</h1>
          <p className="section-subtitle text-xs md:text-sm">Employee working hours assignment</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {['day', 'week', 'month'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  viewMode === mode ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2 w-full lg:w-auto">

  <select
    value={selectedEmployee}
    onChange={e => setSelectedEmployee(e.target.value)}
    className="input text-sm w-full sm:w-auto"
  >
    <option value="">All Employees</option>
    {employees.map(e => (
      <option key={e.id} value={e.id}>
        {e.firstName} {e.lastName}
      </option>
    ))}
  </select>

  <select
    value={selectedBranch}
    onChange={e => setSelectedBranch(e.target.value)}
    className="input text-sm w-full sm:w-auto"
  >
    <option value="">All Branches</option>
    <option value="tubli">Tubli Branch</option>
    <option value="manama">Manama Branch</option>
  </select>

  {(selectedEmployee || selectedBranch) && (
    <button
      onClick={() => {
        setSelectedEmployee('');
        setSelectedBranch('');
      }}
      className="text-xs px-2 py-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 w-full sm:w-auto"
    >
      Clear
    </button>
  )}

  {canCreate && (
    <button
      onClick={() => setModal(true)}
      className="btn-primary w-full sm:w-auto sm:flex-none justify-center py-2 text-sm shadow-lg shadow-primary/20"
    >
      <Plus size={15} /> Assign Schedule
    </button>
  )}

</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Date sidebar */}
        <div className="card lg:col-span-1">
          <h3 className="font-semibold text-gray-800 text-sm mb-3">Scheduled Dates</h3>
          <div className="space-y-1 max-h-[300px] overflow-y-auto scrollbar-hide">
            {uniqueDates.map(d => (
              <button key={d} onClick={() => setSelectedDate(d)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all duration-200 flex items-center gap-2 ${
                  selectedDate === d ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}>
                <CalendarDays size={14} />
                {formatDate(d)}
                <span className={`ml-auto text-xs rounded-full px-1.5 py-0.5 ${selectedDate === d ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {schedules.filter(s => s.date === d).length}
                </span>
              </button>
            ))}
          </div>
          <div className="pt-4 border-t border-gray-100 mt-4">
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block tracking-wider">Jump to date</label>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="input text-sm" />
          </div>
        </div>

        {/* Schedule entries */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-3 min-w-0">
               <button
                 type="button"
                 onClick={() => moveDate(-1)}
                 className="w-9 h-9 rounded-xl border border-gray-100 bg-gray-50 text-gray-500 hover:text-primary hover:bg-blue-50 hover:border-blue-100 transition-all flex items-center justify-center shrink-0"
                 title={`Previous ${viewMode}`}
               >
                 <ChevronLeft size={18} />
               </button>
            <div className="min-w-0">
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{viewMode} VIEW</p>
               <h3 className="font-black text-gray-800 text-base tracking-tight">{getViewHeader()}</h3>
            </div>
               <button
                 type="button"
                 onClick={() => moveDate(1)}
                 className="w-9 h-9 rounded-xl border border-gray-100 bg-gray-50 text-gray-500 hover:text-primary hover:bg-blue-50 hover:border-blue-100 transition-all flex items-center justify-center shrink-0"
                 title={`Next ${viewMode}`}
               >
                 <ChevronRight size={18} />
               </button>
            </div>
            <div className="text-right">
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Shifts</p>
               <p className="text-base font-black text-primary">{filteredSchedules.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {viewMode === 'month' ? (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto shadow-sm">
                <div className="min-w-[720px] lg:min-w-0">
                <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
                  {DAYS.map(day => (
                    <div key={day} className="py-2 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 border-l border-t border-gray-100">
                  {getMonthDays(selectedDate).map((dayObj, i) => {
                    const daySchedules = schedulesByDate[dayObj.date] || [];
                    const isToday = dayObj.date === new Date().toISOString().split('T')[0];
                    return (
                      <div key={i} className={`min-h-[120px] p-2 border-r border-b border-gray-100 flex flex-col gap-1.5 transition-colors ${dayObj.padding ? 'bg-gray-50/30' : 'bg-white'} ${isToday ? 'ring-2 ring-primary ring-inset z-10' : ''}`}>
                        <div className="flex justify-between items-start mb-1">
                          <span className={`text-xs font-black ${dayObj.padding ? 'text-gray-300' : 'text-gray-800'}`}>{dayObj.day}</span>
                          {isToday && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>}
                        </div>
                        <div className="flex flex-col gap-1 overflow-y-auto scrollbar-hide">
                          {daySchedules.map(s => {
                            const isLeave = s.status === 'On Leave';
                            const color = getEmployeeColor(s.employeeId, s.employee);
                            return (
  <div
  key={s.id}
  className={`p-1.5 rounded-lg text-[9px] group relative overflow-hidden border-l-4 ${isLeave ? 'bg-rose-50 border-rose-500 ring-1 ring-rose-200' : `${color.bg} ${color.border} ring-1 ring-black/5`}`}
>
<div className="flex items-start justify-between gap-1">
<p
  className={`font-semibold text-sm truncate leading-tight ${isLeave ? 'text-rose-900' : color.text}`}
>
  {s.employeeName || (s.employee ? `${s.employee.firstName} ${s.employee.lastName}` : 'Unknown')}
</p>
  {isLeave && <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-red-500 flex-shrink-0 shadow-sm" />}
</div>
                              <p className={`font-semibold opacity-90 text-[9px] ${isLeave ? 'text-rose-700' : color.muted}`}>
  {isLeave ? `${(s.leaveType || 'Leave').replace(/_/g, ' ')} Leave` : `${s.startTime?.slice(0,5)} - ${s.endTime?.slice(0,5)}`}
</p>
                              {!isLeave && <div className={`absolute right-0 top-0 bottom-0 w-1 ${color.bar} transform translate-x-full group-hover:translate-x-0 transition-transform`} />}
                            </div>
                          );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                </div>
              </div>
            ) : (
              <>
                {filteredSchedules.length === 0 && (
                  <div className="card text-center py-16 text-gray-400 border-dashed border-2 bg-gray-50/50">
                    <CalendarDays size={40} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">No schedule assignments found for this period</p>
                  </div>
                )}
                {filteredSchedules.map(s => {
                  const emp = employees.find(e => e.id === s.employeeId);
                  const isLeave = s.status === 'On Leave';
                  const color = getEmployeeColor(s.employeeId, s.employee || emp);
                  return (
                    <div key={s.id} className={`card card-hover flex flex-col sm:flex-row sm:items-center gap-4 group border-l-4 ${isLeave ? 'border-rose-200 bg-rose-50/70 border-l-rose-500' : `${color.bg} ${color.border}`}`}>
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-soft ${isLeave ? 'bg-rose-500' : color.bar}`}>
                          {(s.employeeName || (emp ? `${emp.firstName} ${emp.lastName}` : (s.employee ? `${s.employee.firstName} ${s.employee.lastName}` : '?'))).split(' ').map(w => w[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`font-bold text-sm truncate ${isLeave ? 'text-rose-900' : color.text}`}>{s.employeeName || (emp ? `${emp.firstName} ${emp.lastName}` : (s.employee ? `${s.employee.firstName} ${s.employee.lastName}` : 'Unknown'))}</p>
                            {viewMode !== 'day' && <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold rounded-lg">{formatDate(s.date)}</span>}
                          </div>
                          <p className="text-[11px] text-gray-500 font-medium">{emp?.jobTitle || s.employee?.jobTitle} • {s.branch}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-5 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-end">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{s.status === 'On Leave' ? 'Leave Status' : 'Working Hours'}</p>
                            <div className="flex items-center gap-1.5 text-xs text-gray-700 font-bold">
                              {isLeave ? <span className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-sm" /> : <Clock size={12} className="text-primary" />}
                              <span>
  {s.status === 'On Leave' ? `${(s.leaveType || 'Leave').replace(/_/g, ' ')} Leave` : `${s.startTime?.slice(0,5)} - ${s.endTime?.slice(0,5)}`}
</span>
                            </div>
                          </div>
                        </div>
                        {!s.isLeaveOnly && (
                          <div className="flex items-center gap-2">
                            {canUpdate && (
                              <button onClick={() => setEditSchedule(s)} className="w-9 h-9 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center border border-transparent hover:border-blue-100" title="Edit Schedule">
                                <Edit2 size={16} />
                              </button>
                            )}
                            {canDelete && (
                              <button onClick={() => handleDelete(s.id)} className="w-9 h-9 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center border border-transparent hover:border-rose-100" title="Delete Schedule">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Assigned Hours</p>
                <h3 className="font-black text-gray-800 text-base tracking-tight">Employee Weekly & Monthly Totals</h3>
              </div>
              <p className="text-xs font-semibold text-gray-500">
                Week: {formatDate(weekRange.start)} to {formatDate(weekRange.end)}
              </p>
            </div>
            {employeeHourSummary.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm font-semibold text-gray-400">
                No working hours assigned for the selected filters.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                <div className="grid grid-cols-[1fr_76px_86px] sm:grid-cols-[1fr_110px_110px] gap-3 px-4 sm:px-5 py-3 bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <span>Employee</span>
                  <span className="text-right">This Week</span>
                  <span className="text-right">This Month</span>
                </div>
                {employeeHourSummary.map(row => {
                  const color = getEmployeeColor(row.employeeId, row.employee);
                  return (
                    <div key={row.employeeId} className="grid grid-cols-[1fr_76px_86px] sm:grid-cols-[1fr_110px_110px] gap-3 px-4 sm:px-5 py-3 items-center">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`h-3 w-3 rounded-full ${color.bar} flex-shrink-0 shadow-sm`} />
                        <span className={`font-bold text-sm truncate ${color.text}`}>{row.name}</span>
                      </div>
                      <span className="text-right text-sm font-black text-gray-800">{formatHours(row.weekHours)} h</span>
                      <span className="text-right text-sm font-black text-primary">{formatHours(row.monthHours)} h</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
