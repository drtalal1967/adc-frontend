import React, { useState, useEffect } from 'react';
import API from '../api';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, CalendarDays, Clock, X, Check } from 'lucide-react';

const DAYS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

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
        dates.push(current.toISOString().split('T')[0]);
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

export default function Schedule() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [modal, setModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('day');
  const [loading, setLoading] = useState(true);

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

      const schedRes = await API.get('/schedules', { params: { start, end } });
      let fetchedSchedules = schedRes.data;
      
      // Filter for regular employees so they only see their own schedule
      if (user && user.role !== 'admin' && user.role !== 'manager') {
        fetchedSchedules = fetchedSchedules.filter(s => s.employeeId === user.employeeId);
      }
      setSchedules(fetchedSchedules);

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
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
  };

  const getMonthRange = (dateStr) => {
    const date = new Date(dateStr);
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
  };

  const filteredSchedules = schedules;

  const uniqueDates = [...new Set(schedules.map(s => s.date))].sort();

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

  const schedulesByDate = schedules.reduce((acc, s) => {
    if (!acc[s.date]) acc[s.date] = [];
    acc[s.date].push(s);
    return acc;
  }, {});

  const getShiftLabel = (startTime) => {
    const hour = parseInt(startTime.split(':')[0]);
    return hour < 12 ? 'Morning' : 'Evening';
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {modal && <ScheduleModal onClose={() => setModal(false)} employees={employees} onSave={handleSave} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title text-xl md:text-2xl">Schedule</h1>
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
          {!['dentist', 'assistant'].includes(user?.role) && (
            <button onClick={() => setModal(true)} className="btn-primary flex-1 sm:flex-none justify-center py-2 text-sm shadow-lg shadow-primary/20">
              <Plus size={15} /> Assign Schedule
            </button>
          )}
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
            <div>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{viewMode} VIEW</p>
               <h3 className="font-black text-gray-800 text-base tracking-tight">{getViewHeader()}</h3>
            </div>
            <div className="text-right">
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Shifts</p>
               <p className="text-base font-black text-primary">{filteredSchedules.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {viewMode === 'month' ? (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
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
                          {daySchedules.map(s => (
                            <div key={s.id} className="p-1.5 rounded-lg bg-primary/5 border border-primary/10 text-[9px] group relative overflow-hidden">
                              <p className="font-black text-primary truncate leading-tight">{s.employeeName || (s.employee ? `${s.employee.firstName} ${s.employee.lastName}` : 'Unknown')}</p>
                              <p className="text-gray-500 font-bold opacity-70">({getShiftLabel(s.startTime)})</p>
                              <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-primary transform translate-x-full group-hover:translate-x-0 transition-transform" />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
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
                  return (
                    <div key={s.id} className="card card-hover flex flex-col sm:flex-row sm:items-center gap-4 group">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-header flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-soft">
                          {(s.employeeName || (emp ? `${emp.firstName} ${emp.lastName}` : (s.employee ? `${s.employee.firstName} ${s.employee.lastName}` : '?'))).split(' ').map(w => w[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-800 text-sm truncate">{s.employeeName || (emp ? `${emp.firstName} ${emp.lastName}` : (s.employee ? `${s.employee.firstName} ${s.employee.lastName}` : 'Unknown'))}</p>
                            {viewMode !== 'day' && <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold rounded-lg">{formatDate(s.date)}</span>}
                          </div>
                          <p className="text-[11px] text-gray-500 font-medium">{emp?.jobTitle || s.employee?.jobTitle} • {s.branch}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-5 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-end">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Working Hours</p>
                            <div className="flex items-center gap-1.5 text-xs text-gray-700 font-bold">
                              <Clock size={12} className="text-primary" />
                              <span>{s.startTime} - {s.endTime}</span>
                            </div>
                          </div>
                        </div>
                        {!['dentist', 'assistant'].includes(user?.role) && (
                          <button onClick={() => handleDelete(s.id)} className="w-9 h-9 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center border border-transparent hover:border-rose-100">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
