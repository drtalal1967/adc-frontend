import React, { useState, useMemo, useEffect } from 'react';
import { CalendarDays, Search, Download, ChevronLeft, ChevronRight, Plus, X, Clock, User, MapPin } from 'lucide-react';
import API from '../api';
import { useAuth } from '../context/AuthContext';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Color per role
const ROLE_COLORS = {
  admin:     { bg: 'bg-blue-50',   border: 'border-blue-600',   text: 'text-blue-900',   badge: 'bg-blue-600'   },
  dentist:   { bg: 'bg-teal-50',   border: 'border-teal-500',   text: 'text-teal-900',   badge: 'bg-teal-500'   },
  manager:   { bg: 'bg-indigo-50', border: 'border-indigo-500', text: 'text-indigo-900', badge: 'bg-indigo-500' },
  assistant: { bg: 'bg-emerald-50',border: 'border-emerald-500',text: 'text-emerald-900',badge: 'bg-emerald-500'},
  secretary: { bg: 'bg-amber-50',  border: 'border-amber-500',  text: 'text-amber-900',  badge: 'bg-amber-500'  },
  accountant:{ bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-900', badge: 'bg-purple-500' },
};
const DEFAULT_COLOR = { bg: 'bg-gray-50', border: 'border-gray-400', text: 'text-gray-800', badge: 'bg-gray-400' };

function getColor(employeeId, employees) {
  const emp = employees.find(e => e.id === employeeId);
  return ROLE_COLORS[emp?.user?.role?.toLowerCase()] || DEFAULT_COLOR;
}

function ShiftChip({ shift, compact = false, employees }) {
  const emp = employees.find(e => e.id === shift.employeeId);
  const name = emp ? `${emp.firstName} ${emp.lastName}` : (shift.employeeName || shift.title || 'Unknown');
  const c = getColor(shift.employeeId, employees);
  return (
    <div className={`px-1.5 py-1 ${c.bg} border-l-2 ${c.border} rounded shadow-sm overflow-hidden`}>
      <p className={`text-[10px] font-bold ${c.text} truncate`}>{name}</p>
      {!compact && <p className={`text-[9px] font-medium opacity-70 ${c.text}`}>{shift.startTime}–{shift.endTime}</p>}
    </div>
  );
}

export default function WorkSchedule() {
  const { user } = useAuth();
  const [view, setView] = useState('Month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('All Branches');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [employeeFilter, setEmployeeFilter] = useState('All Employees');
  const [employees, setEmployees] = useState([]);
  const [dbSchedules, setDbSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await API.get('/employees');
        setEmployees(res.data);
      } catch (err) {
        console.error('Error fetching employees:', err);
      }
    };
    fetchEmployees();
  }, []);

  useEffect(() => {
    const fetchSchedules = async () => {
      setLoading(true);
      let start, end;

      if (view === 'Month') {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        start = formatDate(new Date(year, month, 1));
        end = formatDate(new Date(year, month + 1, 0));
      } else if (view === 'Week') {
        const d = new Date(currentDate);
        const day = d.getDay(); // 0=Sun
        const mon = new Date(d);
        mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
        const sun = new Date(mon);
        sun.setDate(mon.getDate() + 6);
        start = formatDate(mon);
        end = formatDate(sun);
      } else {
        // Day view
        start = formatDate(currentDate);
        end = formatDate(currentDate);
      }

      try {
        const res = await API.get(`/schedules?start=${start}&end=${end}`);
        let fetchedSchedules = res.data;
        const role = user.role?.toUpperCase();
        if (user && role !== 'ADMIN' && role !== 'MANAGER') {
          fetchedSchedules = fetchedSchedules.filter(s => s.employeeId === user.employeeId);
        }
        setDbSchedules(fetchedSchedules);
      } catch (err) {
        console.error('Error fetching schedule data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [view, currentDate, user]);

  const schedules = useMemo(() => {
    return dbSchedules.map(s => {
      return {
        id: s.id,
        employeeId: s.employeeId,
        date: s.date, 
        startTime: s.startTime,
        endTime: s.endTime,
        title: s.title || 'Work Shift',
        start: new Date(`${s.date}T${s.startTime || '00:00'}`),
        end: new Date(`${s.date}T${s.endTime || '00:00'}`),
        branch: s.branch || 'Tubli Branch',
        status: 'Active',
        employeeName: s.employeeName,
        employee: s.employee
      };
    });
  }, [dbSchedules]);

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const todayStr = formatDate(new Date());

  // Calendar helpers
  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startOffset = firstDayOfMonth(year, month);
    const days = [];
    const prevYear = month === 0 ? year - 1 : year;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevMonthDays = daysInMonth(prevYear, prevMonth);
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, currentMonth: false, date: new Date(prevYear, prevMonth, prevMonthDays - i) });
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push({ day: i, currentMonth: true, date: new Date(year, month, i) });
    }
    const remaining = 42 - days.length;
    const nextYear = month === 11 ? year + 1 : year;
    const nextMonth = month === 11 ? 0 : month + 1;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, currentMonth: false, date: new Date(nextYear, nextMonth, i) });
    }
    return days;
  }, [currentDate]);

  // Week days (Mon–Sun of currentDate's week)
  const weekDays = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay(); // 0=Sun
    const mon = new Date(d);
    mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    return Array.from({ length: 7 }, (_, i) => {
      const dd = new Date(mon);
      dd.setDate(mon.getDate() + i);
      return dd;
    });
  }, [currentDate]);

  const filteredSchedules = useMemo(() => {
    return schedules.filter(s => {
      const emp = employees.find(e => e.id === s.employeeId);
      const name = emp ? `${emp.firstName} ${emp.lastName}` : '';
      const job = emp?.specialization || '';
      const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) || job.toLowerCase().includes(search.toLowerCase());
      const matchesBranch = branchFilter === 'All Branches' || s.branch === branchFilter;
      const matchesStatus = statusFilter === 'All Status' || s.status === statusFilter;
      const matchesEmployee = employeeFilter === 'All Employees' || s.employeeId === parseInt(employeeFilter);
      return matchesSearch && matchesBranch && matchesStatus && matchesEmployee;
    });
  }, [schedules, employees, search, branchFilter, statusFilter, employeeFilter]);

  const handlePrev = () => {
    if (view === 'Month') setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    else if (view === 'Week') setCurrentDate(prev => { const d = new Date(prev); d.setDate(d.getDate() - 7); return d; });
    else setCurrentDate(prev => { const d = new Date(prev); d.setDate(d.getDate() - 1); return d; });
  };

  const handleNext = () => {
    if (view === 'Month') setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    else if (view === 'Week') setCurrentDate(prev => { const d = new Date(prev); d.setDate(d.getDate() + 7); return d; });
    else setCurrentDate(prev => { const d = new Date(prev); d.setDate(d.getDate() + 1); return d; });
  };

  const handleToday = () => setCurrentDate(new Date());

  const handleExport = () => {
    const header = 'Employee,Role,Branch,Date,Start Time,End Time,Status\n';
    const rows = filteredSchedules.map(s => {
      const emp = employees.find(e => e.id === s.employeeId);
      const name = emp ? `${emp.firstName} ${emp.lastName}` : (s.employeeName || 'Unknown');
      const role = emp?.user?.role || '';
      return `"${name}","${role}","${s.branch}","${s.date}","${s.startTime}","${s.endTime}","${s.status}"`;
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'work-schedule.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Selected day shifts panel data
  const selectedDayShifts = selectedDay ? filteredSchedules.filter(s => s.date === selectedDay) : [];

  // Header label
  const headerLabel = view === 'Month'
    ? `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    : view === 'Week'
    ? `${MONTHS[weekDays[0].getMonth()]} ${weekDays[0].getDate()} – ${MONTHS[weekDays[6].getMonth()]} ${weekDays[6].getDate()}, ${weekDays[6].getFullYear()}`
    : `${MONTHS[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 font-heading">Work Schedule</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and view employee shifts</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-gray-100/80 p-1 rounded-xl flex items-center shadow-sm">
            {['Day', 'Week', 'Month'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  view === v ? 'bg-blue-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-white border border-gray-100 rounded-xl p-1 shadow-sm">
            <button onClick={handlePrev} className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <button onClick={handleToday} className="px-3 text-sm font-semibold text-gray-700 hover:text-primary transition-colors">Today</button>
            <button onClick={handleNext} className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-orange-50/50 rounded-xl border border-orange-100/50 min-w-[180px]">
          <CalendarDays size={18} className="text-orange-500 shrink-0" />
          <span className="text-sm font-bold text-blue-900 truncate">{headerLabel}</span>
        </div>

        <div className="relative flex-1 min-w-[180px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        <div className="relative">
          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="appearance-none pl-3 pr-10 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option value="All Employees">All Employees</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
            ))}
          </select>
          <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="appearance-none pl-3 pr-10 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option>All Branches</option>
            <option>Tubli Branch</option>
            <option>Manama Branch</option>
          </select>
          <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none pl-3 pr-10 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option>All Status</option>
            <option>Active</option>
            <option>On Leave</option>
          </select>
          <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" />
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
        >
          <Download size={16} className="text-gray-400" />
          Export CSV
        </button>
      </div>

      {/* Role Legend */}
      <div className="flex flex-wrap items-center gap-3">
        {Object.entries(ROLE_COLORS).map(([role, c]) => (
          <div key={role} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${c.badge}`} />
            <span className="text-xs font-medium text-gray-500 capitalize">{role}</span>
          </div>
        ))}
      </div>

      {/* ===== MONTH VIEW ===== */}
      {view === 'Month' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
            {DAYS.map(day => (
              <div key={day} className="px-4 py-3 text-center text-sm font-bold text-gray-600">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 divide-x divide-y divide-gray-50">
            {calendarDays.map((d, idx) => {
              const dateStr = formatDate(d.date);
              const dayShifts = filteredSchedules.filter(s => s.date === dateStr);
              const isToday = dateStr === todayStr;
              const isSelected = selectedDay === dateStr;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                  className={`min-h-[110px] p-2 transition-colors cursor-pointer group relative ${
                    !d.currentMonth ? 'bg-gray-50/30' : ''
                  } ${isSelected ? 'ring-2 ring-inset ring-primary' : 'hover:bg-gray-50/50'}`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className={`text-sm font-medium ${
                      !d.currentMonth ? 'text-gray-300' : 'text-gray-500'
                    } ${isToday ? 'w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center -mt-0.5 -ml-0.5 shadow-sm font-bold' : ''}`}>
                      {d.day}
                    </span>
                    {d.currentMonth && (
                      <button
                        onClick={e => { e.stopPropagation(); }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-100 rounded transition-all"
                      >
                        <Plus size={13} className="text-gray-400" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {dayShifts.slice(0, 3).map(s => <ShiftChip key={s.id} shift={s} employees={employees} />)}
                    {dayShifts.length > 3 && (
                      <p className="text-[9px] font-bold text-gray-400 pl-1">+{dayShifts.length - 3} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== WEEK VIEW ===== */}
      {view === 'Week' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
            {weekDays.map((d, i) => {
              const dateStr = formatDate(d);
              const isToday = dateStr === todayStr;
              return (
                <div key={i} className={`px-4 py-4 text-center ${isToday ? 'bg-primary/5' : ''}`}>
                  <p className="text-xs font-bold text-gray-400 uppercase">{DAYS[i]}</p>
                  <span className={`mt-1 w-9 h-9 flex items-center justify-center mx-auto text-sm font-black rounded-full ${
                    isToday ? 'bg-primary text-white shadow' : 'text-gray-700'
                  }`}>{d.getDate()}</span>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-7 divide-x divide-gray-50 min-h-[400px]">
            {weekDays.map((d, i) => {
              const dateStr = formatDate(d);
              const dayShifts = filteredSchedules.filter(s => s.date === dateStr);
              const isToday = dateStr === todayStr;
              return (
                <div key={i} className={`p-3 space-y-1.5 ${isToday ? 'bg-primary/5' : 'hover:bg-gray-50/50'} transition-colors`}>
                  {dayShifts.length === 0 && (
                    <p className="text-[10px] text-gray-300 text-center mt-6 font-medium">No shifts</p>
                  )}
                  {dayShifts.map(s => {
                    const emp = employees.find(e => e.id === s.employeeId);
                    const name = emp ? `${emp.firstName} ${emp.lastName}` : (s.employeeName || 'Unknown');
                    const c = getColor(s.employeeId, employees);
                    return (
                      <div key={s.id} className={`p-2 ${c.bg} border-l-2 ${c.border} rounded-lg shadow-sm`}>
                        <p className={`text-[10px] font-bold ${c.text} truncate`}>{name}</p>
                        <p className={`text-[9px] font-medium opacity-60 ${c.text}`}>{s.startTime}–{s.endTime}</p>
                        <p className={`text-[9px] font-medium opacity-50 ${c.text} truncate`}>{s.branch}</p>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== DAY VIEW ===== */}
      {view === 'Day' && (() => {
        const dateStr = formatDate(currentDate);
        const dayShifts = filteredSchedules.filter(s => s.date === dateStr);
        const isToday = dateStr === todayStr;
        return (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className={`px-8 py-5 border-b border-gray-100 flex items-center gap-4 ${isToday ? 'bg-primary/5' : 'bg-gray-50/40'}`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm ${
                isToday ? 'bg-primary text-white' : 'bg-white text-gray-700 border border-gray-100'
              }`}>
                {currentDate.getDate()}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{DAYS[(currentDate.getDay() + 6) % 7]}</p>
                <h2 className="text-lg font-black text-gray-800">{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
                <p className="text-xs text-gray-400 font-medium">{dayShifts.length} shift{dayShifts.length !== 1 ? 's' : ''} scheduled</p>
              </div>
            </div>
            <div className="p-6 space-y-3">
              {dayShifts.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  <CalendarDays size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="font-bold text-sm uppercase tracking-widest">No shifts scheduled</p>
                </div>
              )}
              {dayShifts.map(s => {
                const emp = employees.find(e => e.id === s.employeeId);
                const name = emp ? `${emp.firstName} ${emp.lastName}` : (s.employeeName || 'Unknown');
                const c = getColor(s.employeeId, employees);
                return (
                  <div key={s.id} className={`flex items-center gap-5 p-5 ${c.bg} border-l-4 ${c.border} rounded-2xl shadow-sm`}>
                    <div className={`w-10 h-10 rounded-xl ${c.badge} flex items-center justify-center text-white font-black text-sm shrink-0`}>
                      {name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-black text-sm ${c.text}`}>{name}</p>
                      <p className={`text-xs font-medium opacity-60 ${c.text} capitalize`}>
                        {emp?.user?.role || s.employee?.employmentType || 'Employee'} · {emp?.specialization || s.title}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className={`flex items-center gap-1.5 text-xs font-bold ${c.text}`}>
                        <Clock size={12} />
                        {s.startTime} – {s.endTime}
                      </div>
                      <div className={`flex items-center gap-1.5 text-[10px] font-medium opacity-60 ${c.text}`}>
                        <MapPin size={10} />{s.branch}
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      s.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'
                    }`}>{s.status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ===== DAY DETAIL PANEL (click on month calendar day) ===== */}
      {view === 'Month' && selectedDay && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarDays size={18} className="text-primary" />
              <h3 className="font-bold text-gray-800 text-sm">
                Shifts for {new Date(selectedDay + 'T00:00:00').toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
            </div>
            <button onClick={() => setSelectedDay(null)} className="p-1.5 hover:bg-gray-100 rounded-xl transition-all text-gray-400">
              <X size={16} />
            </button>
          </div>
          <div className="p-5 space-y-2">
            {selectedDayShifts.length === 0 && (
              <p className="text-center text-sm text-gray-400 font-medium py-6">No shifts scheduled for this day.</p>
            )}
            {selectedDayShifts.map(s => {
              const emp = employees.find(e => e.id === s.employeeId);
              const name = emp ? `${emp.firstName} ${emp.lastName}` : (s.employeeName || 'Unknown');
              const c = getColor(s.employeeId, employees);
              return (
                <div key={s.id} className={`flex items-center gap-4 p-4 ${c.bg} border-l-4 ${c.border} rounded-xl shadow-sm`}>
                  <div className={`w-9 h-9 rounded-xl ${c.badge} flex items-center justify-center text-white font-black text-sm shrink-0`}>
                    {name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className={`font-black text-sm ${c.text}`}>{name}</p>
                    <p className={`text-xs opacity-60 font-medium ${c.text} capitalize`}>
                      {emp?.user?.role || s.employee?.employmentType || 'Employee'} · {s.branch}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs font-bold ${c.text}`}>
                    <Clock size={12} />{s.startTime} – {s.endTime}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                    s.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'
                  }`}>{s.status}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}





