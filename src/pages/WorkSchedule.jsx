import React, { useState, useMemo, useEffect } from 'react';
import { CalendarDays, Search, Download, FileSpreadsheet, FileText, ChevronLeft, ChevronRight, Plus, X, Clock, User, MapPin, Mail } from 'lucide-react';
import API from '../api';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';

const DAYS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const EMPLOYEE_COLORS = [
  { key: 'sky', bg: 'bg-sky-100', border: 'border-sky-600', text: 'text-sky-950', badge: 'bg-sky-600' },
  { key: 'emerald', bg: 'bg-emerald-100', border: 'border-emerald-600', text: 'text-emerald-950', badge: 'bg-emerald-600' },
  { key: 'violet', bg: 'bg-violet-100', border: 'border-violet-600', text: 'text-violet-950', badge: 'bg-violet-600' },
  { key: 'amber', bg: 'bg-amber-100', border: 'border-amber-600', text: 'text-amber-950', badge: 'bg-amber-600' },
  { key: 'cyan', bg: 'bg-cyan-100', border: 'border-cyan-600', text: 'text-cyan-950', badge: 'bg-cyan-600' },
  { key: 'fuchsia', bg: 'bg-fuchsia-100', border: 'border-fuchsia-600', text: 'text-fuchsia-950', badge: 'bg-fuchsia-600' },
  { key: 'lime', bg: 'bg-lime-100', border: 'border-lime-600', text: 'text-lime-950', badge: 'bg-lime-600' },
  { key: 'indigo', bg: 'bg-indigo-100', border: 'border-indigo-600', text: 'text-indigo-950', badge: 'bg-indigo-600' },
  { key: 'orange', bg: 'bg-orange-100', border: 'border-orange-600', text: 'text-orange-950', badge: 'bg-orange-600' },
  { key: 'teal', bg: 'bg-teal-100', border: 'border-teal-600', text: 'text-teal-950', badge: 'bg-teal-600' },
  { key: 'purple', bg: 'bg-purple-100', border: 'border-purple-600', text: 'text-purple-950', badge: 'bg-purple-600' },
  { key: 'pink', bg: 'bg-pink-100', border: 'border-pink-600', text: 'text-pink-950', badge: 'bg-pink-600' },
  { key: 'red', bg: 'bg-red-100', border: 'border-red-600', text: 'text-red-950', badge: 'bg-red-600' },
  { key: 'blue', bg: 'bg-blue-100', border: 'border-blue-600', text: 'text-blue-950', badge: 'bg-blue-600' },
  { key: 'green', bg: 'bg-green-100', border: 'border-green-600', text: 'text-green-950', badge: 'bg-green-600' },
  { key: 'yellow', bg: 'bg-yellow-100', border: 'border-yellow-600', text: 'text-yellow-950', badge: 'bg-yellow-600' },
  { key: 'rose', bg: 'bg-rose-100', border: 'border-rose-600', text: 'text-rose-950', badge: 'bg-rose-600' },
  { key: 'slate', bg: 'bg-slate-100', border: 'border-slate-600', text: 'text-slate-950', badge: 'bg-slate-600' },
  { key: 'stone', bg: 'bg-stone-100', border: 'border-stone-600', text: 'text-stone-950', badge: 'bg-stone-600' },
  { key: 'zinc', bg: 'bg-zinc-100', border: 'border-zinc-600', text: 'text-zinc-950', badge: 'bg-zinc-600' },
  { key: 'neutral', bg: 'bg-neutral-100', border: 'border-neutral-600', text: 'text-neutral-950', badge: 'bg-neutral-600' },
  { key: 'gray', bg: 'bg-gray-100', border: 'border-gray-600', text: 'text-gray-950', badge: 'bg-gray-600' },
  { key: 'deepblue', bg: 'bg-blue-50', border: 'border-blue-800', text: 'text-blue-950', badge: 'bg-blue-800' },
  { key: 'deepgreen', bg: 'bg-green-50', border: 'border-green-800', text: 'text-green-950', badge: 'bg-green-800' },
  { key: 'deeporange', bg: 'bg-orange-50', border: 'border-orange-800', text: 'text-orange-950', badge: 'bg-orange-800' },
];
const DEFAULT_COLOR = { bg: 'bg-gray-100', border: 'border-gray-500', text: 'text-gray-900', badge: 'bg-gray-500' };
const LEAVE_COLOR = { bg: 'bg-rose-50', border: 'border-rose-500', text: 'text-rose-900', badge: 'bg-rose-500' };

const PDF_COLORS = [
  { fill: [224, 242, 254], border: [2, 132, 199], text: [12, 74, 110] },
  { fill: [209, 250, 229], border: [5, 150, 105], text: [6, 78, 59] },
  { fill: [237, 233, 254], border: [124, 58, 237], text: [76, 29, 149] },
  { fill: [254, 243, 199], border: [217, 119, 6], text: [120, 53, 15] },
  { fill: [207, 250, 254], border: [8, 145, 178], text: [21, 94, 117] },
  { fill: [250, 232, 255], border: [192, 38, 211], text: [112, 26, 117] },
  { fill: [236, 252, 203], border: [101, 163, 13], text: [63, 98, 18] },
  { fill: [224, 231, 255], border: [79, 70, 229], text: [49, 46, 129] },
  { fill: [255, 237, 213], border: [234, 88, 12], text: [124, 45, 18] },
  { fill: [204, 251, 241], border: [13, 148, 136], text: [19, 78, 74] },
  { fill: [243, 232, 255], border: [147, 51, 234], text: [88, 28, 135] },
  { fill: [252, 231, 243], border: [219, 39, 119], text: [131, 24, 67] },
  { fill: [254, 226, 226], border: [220, 38, 38], text: [127, 29, 29] },
  { fill: [219, 234, 254], border: [37, 99, 235], text: [30, 64, 175] },
  { fill: [220, 252, 231], border: [22, 163, 74], text: [22, 101, 52] },
  { fill: [254, 249, 195], border: [202, 138, 4], text: [113, 63, 18] },
  { fill: [255, 228, 230], border: [225, 29, 72], text: [136, 19, 55] },
  { fill: [241, 245, 249], border: [71, 85, 105], text: [15, 23, 42] },
  { fill: [245, 245, 244], border: [87, 83, 78], text: [28, 25, 23] },
  { fill: [244, 244, 245], border: [82, 82, 91], text: [24, 24, 27] },
  { fill: [245, 245, 245], border: [82, 82, 82], text: [23, 23, 23] },
  { fill: [243, 244, 246], border: [75, 85, 99], text: [17, 24, 39] },
  { fill: [239, 246, 255], border: [30, 64, 175], text: [30, 58, 138] },
  { fill: [240, 253, 244], border: [22, 101, 52], text: [20, 83, 45] },
  { fill: [255, 247, 237], border: [154, 52, 18], text: [124, 45, 18] },
];
const PDF_LEAVE_COLOR = { fill: [255, 241, 242], border: [244, 63, 94], text: [136, 19, 55] };

const toLocalDateKey = (value) => {
  if (!value) return '';
  const raw = String(value);
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw.slice(0, 10);
  return `${String(d.getFullYear()).padStart(4, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};


function getColor(employeeId, visibleEmployees, fallbackName = '', scheduleEmployee = null) {
  const employee = scheduleEmployee || visibleEmployees.find(e => String(e.id) === String(employeeId));
  const savedColor = employee?.scheduleColor;
  const selectedColor = EMPLOYEE_COLORS.find(color => color.key === savedColor);
  if (selectedColor) return selectedColor;

  const numericId = Number(employeeId);
  if (Number.isFinite(numericId) && numericId > 0) {
    return EMPLOYEE_COLORS[(numericId - 1) % EMPLOYEE_COLORS.length];
  }

  const index = visibleEmployees.findIndex(e => String(e.id) === String(employeeId));
  if (index !== -1) return EMPLOYEE_COLORS[index % EMPLOYEE_COLORS.length];

  const key = String(fallbackName || employeeId || '');
  if (!key) return DEFAULT_COLOR;
  const hash = [...key].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return EMPLOYEE_COLORS[hash % EMPLOYEE_COLORS.length];
}

function ShiftChip({ shift, compact = false, employees }) {
  const emp = employees.find(e => e.id === shift.employeeId);
  const name = emp ? `${emp.firstName} ${emp.lastName}` : (shift.employeeName || shift.title || 'Unknown');
  const isLeave = shift.status === 'On Leave';
  const c = isLeave ? LEAVE_COLOR : getColor(shift.employeeId, employees, name, shift.employee);
  return (
    <div className={`px-1.5 py-1 ${c.bg} border-l-2 ${c.border} rounded shadow-sm overflow-hidden ${isLeave ? 'ring-1 ring-rose-200' : ''}`}>
      <div className="flex items-start justify-between gap-1">
        <p className={`text-[10px] font-bold ${c.text} truncate`}>{name}</p>
        {isLeave && <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-red-500 flex-shrink-0 shadow-sm" />}
      </div>
      {!compact && (
        <p className={`text-[9px] font-medium opacity-70 ${c.text}`}>
          {shift.status === 'On Leave' ? `${(shift.leaveType || 'Leave').replace(/_/g, ' ')} Leave` : `${shift.startTime} - ${shift.endTime}`}
        </p>
      )}
    </div>
  );
}

const toMinutes = (time = '') => {
  const [hours = '0', minutes = '0'] = String(time).split(':');
  return (parseInt(hours, 10) || 0) * 60 + (parseInt(minutes, 10) || 0);
};

const isDoctorShift = (shift, employees = []) => {
  const employee = shift.employee || employees.find(e => String(e.id) === String(shift.employeeId));
  const fields = [
    employee?.jobTitle,
    employee?.specialization,
    employee?.user?.role,
    shift.employeeName,
  ].filter(Boolean).map(value => String(value).toLowerCase().trim());

  return fields.some(field =>
    field.includes('doctor') ||
    field.includes('dentist') ||
    field.includes('consultant') ||
    field.includes('specialist') ||
    field.startsWith('dr.')
  );
};

const sortScheduleEntries = (items = [], employees = []) => (
  [...items].sort((a, b) => {
    const leaveDiff = Number(a.status === 'On Leave') - Number(b.status === 'On Leave');
    if (leaveDiff !== 0) return leaveDiff;
    const timeDiff = toMinutes(a.startTime) - toMinutes(b.startTime);
    if (timeDiff !== 0) return timeDiff;
    const doctorDiff = Number(isDoctorShift(b, employees)) - Number(isDoctorShift(a, employees));
    if (doctorDiff !== 0) return doctorDiff;
    const aName = a.employeeName || employees.find(e => String(e.id) === String(a.employeeId))?.firstName || '';
    const bName = b.employeeName || employees.find(e => String(e.id) === String(b.employeeId))?.firstName || '';
    return aName.localeCompare(bName);
  })
);

export default function WorkSchedule() {
  const { user, checkPermission } = useAuth();
  const [view, setView] = useState('Month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('All Branches');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [employeeFilter, setEmployeeFilter] = useState('All Employees');
  const [employees, setEmployees] = useState([]);
  const [dbSchedules, setDbSchedules] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendScope, setSendScope] = useState('all');
  const [sendEmployeeId, setSendEmployeeId] = useState('');
  const [sendBranch, setSendBranch] = useState('All Branches');
  const [sendStartDate, setSendStartDate] = useState('');
  const [sendEndDate, setSendEndDate] = useState('');
  const [sendingSchedule, setSendingSchedule] = useState(false);

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
        const day = d.getDay(); // 0=Sun, 6=Sat
        const daysSinceSaturday = (day - 6 + 7) % 7;
        const sat = new Date(d);
        sat.setDate(d.getDate() - daysSinceSaturday);
        const fri = new Date(sat);
        fri.setDate(sat.getDate() + 6);
        start = formatDate(sat);
        end = formatDate(fri);
      } else {
        // Day view
        start = formatDate(currentDate);
        end = formatDate(currentDate);
      }

      try {
        const res = await API.get(`/schedules?start=${start}&end=${end}`);
        setDbSchedules(res.data || []);

        try {
          const leaveRes = await API.get('/leave-requests');
          setLeaveRequests(leaveRes.data || []);
        } catch (leaveErr) {
          console.warn('Could not fetch leave requests for schedule view:', leaveErr.message);
          setLeaveRequests([]);
        }
      } catch (err) {
        console.error('Error fetching schedule data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [view, currentDate, user]);

  const schedules = useMemo(() => {
    const toDateString = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };
    let rangeStart;
    let rangeEnd;
    if (view === 'Month') {
      rangeStart = toDateString(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
      rangeEnd = toDateString(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0));
    } else if (view === 'Week') {
      const d = new Date(currentDate);
      const day = d.getDay();
      const daysSinceSaturday = (day - 6 + 7) % 7;
      const sat = new Date(d);
      sat.setDate(d.getDate() - daysSinceSaturday);
      const fri = new Date(sat);
      fri.setDate(sat.getDate() + 6);
      rangeStart = toDateString(sat);
      rangeEnd = toDateString(fri);
    } else {
      rangeStart = rangeEnd = toDateString(currentDate);
    }

    const activeLeaves = leaveRequests.filter(l => {
      if (String(l.status || '').toUpperCase() !== 'APPROVED') return false;
      const start = toLocalDateKey(l.startDate);
      const end = toLocalDateKey(l.endDate);
      return start <= rangeEnd && end >= rangeStart;
    });
    const findLeave = (employeeId, dateStr) => activeLeaves.find(l => {
      const start = toLocalDateKey(l.startDate);
      const end = toLocalDateKey(l.endDate);
      return String(l.employeeId) === String(employeeId) && dateStr >= start && dateStr <= end;
    });

    const mappedSchedules = dbSchedules.map(s => {
      const leave = findLeave(s.employeeId, s.date);
      const onLeave = Boolean(leave);
      return {
        id: s.id,
        employeeId: s.employeeId,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        title: onLeave ? 'On Leave' : (s.title || 'Work Shift'),
        start: new Date(`${s.date}T${s.startTime || '00:00'}`),
        end: new Date(`${s.date}T${s.endTime || '00:00'}`),
        branch: s.branch || 'Tubli Branch',
        status: onLeave ? 'On Leave' : 'Active',
        leaveType: leave?.leaveType,
        employeeName: s.employeeName,
        employee: s.employee
      };
    });

    const scheduledKeys = new Set(mappedSchedules.map(s => `${s.employeeId}|${s.date}`));
    const leaveOnlyEntries = [];
    activeLeaves.forEach(l => {
      const start = toLocalDateKey(l.startDate);
      const end = toLocalDateKey(l.endDate);
      if (!start || !end) return;
      const current = new Date(start + 'T00:00:00');
      const last = new Date(end + 'T00:00:00');
      while (current <= last) {
        const dateStr = toDateString(current);
        const key = `${l.employeeId}|${dateStr}`;
        if (dateStr >= rangeStart && dateStr <= rangeEnd && !scheduledKeys.has(key)) {
          leaveOnlyEntries.push({
            id: `leave-${l.id}-${dateStr}`,
            employeeId: l.employeeId,
            date: dateStr,
            startTime: '',
            endTime: '',
            title: 'On Leave',
            start: new Date(dateStr + 'T00:00:00'),
            end: new Date(dateStr + 'T23:59:59'),
            branch: l.employee?.branch || 'All Branches',
            status: 'On Leave',
            leaveType: l.leaveType,
            employeeName: l.employee ? `${l.employee.firstName} ${l.employee.lastName}` : 'Employee on leave',
            employee: l.employee,
            isLeaveOnly: true
          });
        }
        current.setDate(current.getDate() + 1);
      }
    });

    return [...mappedSchedules, ...leaveOnlyEntries];
  }, [dbSchedules, leaveRequests, currentDate, view]);

  const visibleEmployees = useMemo(() => {
    const byId = new Map();
    employees.forEach(emp => byId.set(String(emp.id), emp));
    schedules.forEach(schedule => {
      if (!schedule.employeeId || byId.has(String(schedule.employeeId))) return;
      if (schedule.employee) {
        byId.set(String(schedule.employeeId), schedule.employee);
      } else if (schedule.employeeName) {
        const [firstName, ...rest] = schedule.employeeName.split(' ');
        byId.set(String(schedule.employeeId), {
          id: schedule.employeeId,
          firstName: firstName || schedule.employeeName,
          lastName: rest.join(' '),
          branch: schedule.branch,
        });
      }
    });
    return [...byId.values()].sort((a, b) =>
      `${a.firstName || ''} ${a.lastName || ''}`.localeCompare(`${b.firstName || ''} ${b.lastName || ''}`)
    );
  }, [employees, schedules]);

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
    return (day - 6 + 7) % 7;
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

  // Week days (Sat–Sun of currentDate's week)
  const weekDays = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay(); // 0=Sun, 6=Sat
    const daysSinceSaturday = (day - 6 + 7) % 7;
    const sat = new Date(d);
    sat.setDate(d.getDate() - daysSinceSaturday);
    return Array.from({ length: 7 }, (_, i) => {
      const dd = new Date(sat);
      dd.setDate(sat.getDate() + i);
      return dd;
    });
  }, [currentDate]);

  const filteredSchedules = useMemo(() => {
    const normalizeBranch = (branch) => String(branch || '')
      .toLowerCase()
      .replace(/\s+branch$/, '')
      .trim();

    return schedules.filter(s => {
      const emp = visibleEmployees.find(e => e.id === s.employeeId);
      const scheduleName = s.employeeName || (s.employee ? `${s.employee.firstName} ${s.employee.lastName}` : '');
      const name = emp ? `${emp.firstName} ${emp.lastName}` : scheduleName;
      const job = emp?.specialization || s.employee?.specialization || s.employee?.jobTitle || '';
      const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) || job.toLowerCase().includes(search.toLowerCase());
      const scheduleBranch = s.branch || s.employee?.branch || emp?.branch || '';
      const matchesBranch = branchFilter === 'All Branches' || normalizeBranch(scheduleBranch) === normalizeBranch(branchFilter);
      const matchesStatus = statusFilter === 'All Status' || s.status === statusFilter;
      const matchesEmployee = employeeFilter === 'All Employees' || s.employeeId === parseInt(employeeFilter);
      return matchesSearch && matchesBranch && matchesStatus && matchesEmployee;
    });
  }, [schedules, visibleEmployees, search, branchFilter, statusFilter, employeeFilter]);

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

  const getCurrentViewRange = () => {
    if (view === 'Month') {
      return {
        start: formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)),
        end: formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0))
      };
    }
    if (view === 'Week') {
      return { start: formatDate(weekDays[0]), end: formatDate(weekDays[6]) };
    }
    return { start: formatDate(currentDate), end: formatDate(currentDate) };
  };

  const canSendSchedule = checkPermission('schedule', 'export') || checkPermission('schedule', 'create') || checkPermission('schedule', 'update');

  const openSendDialog = () => {
    const range = getCurrentViewRange();
    setSendScope(employeeFilter === 'All Employees' ? 'all' : 'employee');
    setSendEmployeeId(employeeFilter === 'All Employees' ? '' : String(employeeFilter));
    setSendBranch(branchFilter);
    setSendStartDate(range.start);
    setSendEndDate(range.end);
    setSendDialogOpen(true);
  };

  const handleSendSchedule = async () => {
    if (!sendStartDate || !sendEndDate) {
      alert('Please select From and To dates.');
      return;
    }
    if (sendStartDate > sendEndDate) {
      alert('The From date must be before the To date.');
      return;
    }
    if (sendScope === 'employee' && !sendEmployeeId) {
      alert('Please select an employee.');
      return;
    }

    try {
      setSendingSchedule(true);
      const res = await API.post('/schedules/send-email', {
        mode: sendScope,
        employeeId: sendScope === 'employee' ? sendEmployeeId : null,
        branch: sendBranch,
        startDate: sendStartDate,
        endDate: sendEndDate
      });
      const data = res.data || {};
      const skipped = Array.isArray(data.skipped) ? data.skipped.length : 0;
      const failed = Array.isArray(data.failed) ? data.failed.length : 0;
      const details = [
        `Sent: ${data.sent || 0}`,
        skipped ? `Skipped: ${skipped}` : '',
        failed ? `Failed: ${failed}` : ''
      ].filter(Boolean).join('\n');
      alert(`Schedule email completed.\n${details}`);
      setSendDialogOpen(false);
    } catch (err) {
      console.error('Error sending work schedule:', err);
      alert(err.response?.data?.message || 'Could not send work schedule emails.');
    } finally {
      setSendingSchedule(false);
    }
  };

  const handleExport = () => {
    const header = 'Employee,Role,Branch,Date,Start Time,End Time,Status\n';
    const rows = filteredSchedules.map(s => {
      const emp = visibleEmployees.find(e => e.id === s.employeeId);
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

  const getPdfColor = (shift) => {
    if (shift.status === 'On Leave') return PDF_LEAVE_COLOR;
    const employee = shift.employee || visibleEmployees.find(e => String(e.id) === String(shift.employeeId));
    const savedIndex = EMPLOYEE_COLORS.findIndex(color => color.key === employee?.scheduleColor);
    if (savedIndex >= 0) return PDF_COLORS[savedIndex % PDF_COLORS.length];
    const numericId = Number(shift.employeeId);
    if (Number.isFinite(numericId) && numericId > 0) return PDF_COLORS[(numericId - 1) % PDF_COLORS.length];
    return PDF_COLORS[0];
  };

  const getShiftName = (shift) => {
    const emp = visibleEmployees.find(e => String(e.id) === String(shift.employeeId));
    return emp ? `${emp.firstName} ${emp.lastName}` : (shift.employeeName || 'Unknown');
  };

  const drawPdfHeader = (doc, title) => {
    doc.setFillColor(28, 55, 86);
    doc.rect(0, 0, 297, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(title, 10, 11.5);
    doc.setFontSize(7);
    doc.setFont(undefined, 'normal');
    doc.text(`View: ${view} | Branch: ${branchFilter} | Employee: ${employeeFilter === 'All Employees' ? 'All Employees' : (visibleEmployees.find(e => String(e.id) === String(employeeFilter))?.firstName || 'Selected')} | Status: ${statusFilter}`, 10, 16);
  };

  const drawShiftPill = (doc, shift, x, y, w, h) => {
    const c = getPdfColor(shift);
    const name = getShiftName(shift);
    const detail = shift.status === 'On Leave'
      ? `${(shift.leaveType || 'Leave').replace(/_/g, ' ')} Leave`
      : `${shift.startTime || ''} - ${shift.endTime || ''}`;
    doc.setFillColor(...c.fill);
    doc.setDrawColor(...c.border);
    doc.roundedRect(x, y, w, h, 1.5, 1.5, 'FD');
    doc.setFillColor(...c.border);
    doc.rect(x, y, 1.4, h, 'F');
    doc.setTextColor(...c.text);
    doc.setFontSize(6.2);
    doc.setFont(undefined, 'bold');
    doc.text(name.slice(0, 24), x + 2.8, y + 3.4, { maxWidth: w - 4 });
    doc.setFont(undefined, 'normal');
    doc.setFontSize(5.4);
    doc.text(detail.slice(0, 28), x + 2.8, y + 6.4, { maxWidth: w - 4 });
    if (shift.status === 'On Leave') {
      doc.setFillColor(249, 115, 22);
      doc.circle(x + w - 3, y + 3, 1.2, 'F');
    }
  };

  const drawMonthPdf = (doc) => {
    const margin = 8;
    const startY = 30;
    const cellW = (297 - margin * 2) / 7;
    const cellH = 27;
    DAYS.forEach((day, i) => {
      doc.setFillColor(238, 243, 251);
      doc.rect(margin + i * cellW, startY - 8, cellW, 8, 'F');
      doc.setTextColor(75, 85, 99);
      doc.setFontSize(7);
      doc.setFont(undefined, 'bold');
      doc.text(day, margin + i * cellW + cellW / 2, startY - 3, { align: 'center' });
    });

    calendarDays.forEach((dayObj, index) => {
      const col = index % 7;
      const row = Math.floor(index / 7);
      const x = margin + col * cellW;
      const y = startY + row * cellH;
      const dateStr = formatDate(dayObj.date);
      const dayShifts = sortScheduleEntries(filteredSchedules.filter(s => s.date === dateStr), visibleEmployees);
      doc.setFillColor(dayObj.currentMonth ? 255 : 248, dayObj.currentMonth ? 255 : 250, dayObj.currentMonth ? 255 : 252);
      doc.setDrawColor(229, 231, 235);
      doc.rect(x, y, cellW, cellH, 'FD');
      doc.setTextColor(dayObj.currentMonth ? 17 : 190, dayObj.currentMonth ? 24 : 190, dayObj.currentMonth ? 39 : 190);
      doc.setFontSize(7);
      doc.setFont(undefined, 'bold');
      doc.text(String(dayObj.day), x + 2, y + 5);
      dayShifts.slice(0, 3).forEach((shift, shiftIndex) => {
        drawShiftPill(doc, shift, x + 2, y + 7 + shiftIndex * 6.2, cellW - 4, 5.6);
      });
      if (dayShifts.length > 3) {
        doc.setTextColor(107, 114, 128);
        doc.setFontSize(5.5);
        doc.text(`+${dayShifts.length - 3} more`, x + 2, y + cellH - 2.5);
      }
    });
  };

  const drawWeekPdf = (doc) => {
    const margin = 8;
    const startY = 30;
    const colW = (297 - margin * 2) / 7;
    weekDays.forEach((date, i) => {
      const x = margin + i * colW;
      const dateStr = formatDate(date);
      const dayShifts = sortScheduleEntries(filteredSchedules.filter(s => s.date === dateStr), visibleEmployees);
      doc.setFillColor(238, 243, 251);
      doc.setDrawColor(229, 231, 235);
      doc.rect(x, startY - 8, colW, 8, 'FD');
      doc.setTextColor(31, 41, 55);
      doc.setFontSize(7);
      doc.setFont(undefined, 'bold');
      doc.text(`${DAYS[i]} ${date.getDate()}`, x + colW / 2, startY - 3, { align: 'center' });
      doc.setFillColor(255, 255, 255);
      doc.rect(x, startY, colW, 160, 'FD');
      dayShifts.slice(0, 18).forEach((shift, shiftIndex) => {
        drawShiftPill(doc, shift, x + 2, startY + 3 + shiftIndex * 8, colW - 4, 7);
      });
      if (dayShifts.length > 18) {
        doc.setTextColor(107, 114, 128);
        doc.setFontSize(6);
        doc.text(`+${dayShifts.length - 18} more`, x + 2, 188);
      }
    });
  };

  const drawDayPdf = (doc) => {
    const dateStr = formatDate(currentDate);
    const dayShifts = sortScheduleEntries(filteredSchedules.filter(s => s.date === dateStr), visibleEmployees);
    let y = 32;
    dayShifts.forEach((shift, index) => {
      if (y > 185) {
        doc.addPage();
        drawPdfHeader(doc, `${headerLabel} - Work Schedule`);
        y = 30;
      }
      drawShiftPill(doc, shift, 12, y, 130, 10);
      doc.setTextColor(75, 85, 99);
      doc.setFontSize(7);
      doc.text(shift.branch || '', 148, y + 6);
      y += 13;
    });
    if (!dayShifts.length) {
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(12);
      doc.text('No shifts scheduled for this day.', 12, y);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    drawPdfHeader(doc, `${headerLabel} - Work Schedule`);
    if (view === 'Month') drawMonthPdf(doc);
    else if (view === 'Week') drawWeekPdf(doc);
    else drawDayPdf(doc);
    doc.save(`work_schedule_${view.toLowerCase()}_${formatDate(currentDate)}.pdf`);
  };

  // Selected day shifts panel data
  const selectedDayShifts = selectedDay ? sortScheduleEntries(filteredSchedules.filter(s => s.date === selectedDay), visibleEmployees) : [];

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

        <div className="grid grid-cols-1 sm:flex sm:items-center gap-3 w-full md:w-auto">
          <div className="bg-gray-100/80 p-1 rounded-xl grid grid-cols-3 sm:flex items-center shadow-sm w-full sm:w-auto">
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

          <div className="flex items-center justify-between sm:justify-center bg-white border border-gray-100 rounded-xl p-1 shadow-sm w-full sm:w-auto">
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
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 xl:flex xl:flex-wrap xl:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-orange-50/50 rounded-xl border border-orange-100/50 sm:min-w-[180px]">
          <CalendarDays size={18} className="text-orange-500 shrink-0" />
          <span className="text-sm font-bold text-blue-900 truncate">{headerLabel}</span>
        </div>

        <div className="relative xl:flex-1 sm:min-w-[180px]">
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
            className="w-full appearance-none pl-3 pr-10 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option value="All Employees">All Employees</option>
            {visibleEmployees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
            ))}
          </select>
          <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="w-full appearance-none pl-3 pr-10 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
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
            className="w-full appearance-none pl-3 pr-10 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option>All Status</option>
            <option>Active</option>
            <option>On Leave</option>
          </select>
          <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" />
        </div>

        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-2 px-4 py-2 btn-export-excel rounded-xl text-sm font-bold transition-all shadow-sm"
        >
          <FileSpreadsheet size={16} />
          Export CSV
        </button>
        <button
          onClick={handleExportPDF}
          className="flex items-center justify-center gap-2 px-4 py-2 btn-export-pdf rounded-xl text-sm font-bold transition-all shadow-sm"
        >
          <FileText size={16} />
          Export PDF
        </button>
        {canSendSchedule && (
          <button
            onClick={openSendDialog}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-xl text-sm font-bold transition-all shadow-sm hover:bg-blue-800"
          >
            <Mail size={16} />
            Send Schedule
          </button>
        )}
      </div>

      {sendDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-xl overflow-hidden">
            <div className="bg-blue-900 px-6 py-5 flex items-start justify-between">
              <div>
                <p className="text-xs font-black tracking-widest uppercase text-blue-100">Email Work Schedule</p>
                <h2 className="text-xl font-black text-white mt-1">Send colored PDF schedules</h2>
              </div>
              <button onClick={() => setSendDialogOpen(false)} className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Send To</label>
                <select
                  value={sendScope}
                  onChange={(e) => setSendScope(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-900/20"
                >
                  <option value="all">All employees with schedules/leaves in range</option>
                  <option value="employee">One selected employee</option>
                </select>
              </div>

              {sendScope === 'employee' && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Employee</label>
                  <select
                    value={sendEmployeeId}
                    onChange={(e) => setSendEmployeeId(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-900/20"
                  >
                    <option value="">Select employee</option>
                    {visibleEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Branch</label>
                <select
                  value={sendBranch}
                  onChange={(e) => setSendBranch(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-900/20"
                >
                  <option>All Branches</option>
                  <option>Tubli Branch</option>
                  <option>Manama Branch</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">From</label>
                  <input
                    type="date"
                    value={sendStartDate}
                    onChange={(e) => setSendStartDate(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-900/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">To</label>
                  <input
                    type="date"
                    value={sendEndDate}
                    onChange={(e) => setSendEndDate(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-900/20"
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-orange-50 border border-orange-100 px-4 py-3">
                <p className="text-sm text-gray-700 leading-6">
                  Each employee receives only their own schedule as a colored PDF attachment. Leave days are marked separately and do not count as working hours.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => setSendDialogOpen(false)}
                className="px-5 py-3 rounded-2xl bg-white border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50"
                disabled={sendingSchedule}
              >
                Cancel
              </button>
              <button
                onClick={handleSendSchedule}
                className="px-5 py-3 rounded-2xl bg-blue-900 text-white font-bold text-sm hover:bg-blue-800 disabled:opacity-60 flex items-center justify-center gap-2"
                disabled={sendingSchedule}
              >
                <Mail size={16} />
                {sendingSchedule ? 'Sending...' : 'Send Emails'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Legend */}
      <div className="flex flex-wrap items-center gap-3">
        {visibleEmployees.slice(0, 12).map((emp) => {
          const c = getColor(emp.id, visibleEmployees);
          return (
          <div key={emp.id} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${c.badge}`} />
            <span className="text-xs font-medium text-gray-500">{emp.firstName} {emp.lastName}</span>
          </div>
          );
        })}
        {visibleEmployees.length > 12 && (
          <span className="text-xs font-semibold text-gray-400">+{visibleEmployees.length - 12} more</span>
        )}
      </div>

      {/* ===== MONTH VIEW ===== */}
      {view === 'Month' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          <div className="min-w-[720px] lg:min-w-0">
          <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
            {DAYS.map(day => (
              <div key={day} className="px-4 py-3 text-center text-sm font-bold text-gray-600">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 divide-x divide-y divide-gray-50">
            {calendarDays.map((d, idx) => {
              const dateStr = formatDate(d.date);
              const dayShifts = sortScheduleEntries(filteredSchedules.filter(s => s.date === dateStr), visibleEmployees);
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
                    {dayShifts.slice(0, 3).map(s => <ShiftChip key={s.id} shift={s} employees={visibleEmployees} />)}
                    {dayShifts.length > 3 && (
                      <p className="text-[9px] font-bold text-gray-400 pl-1">+{dayShifts.length - 3} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        </div>
      )}

      {/* ===== WEEK VIEW ===== */}
      {view === 'Week' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          <div className="min-w-[720px] lg:min-w-0">
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
              const dayShifts = sortScheduleEntries(filteredSchedules.filter(s => s.date === dateStr), visibleEmployees);
              const isToday = dateStr === todayStr;
              return (
                <div key={i} className={`p-3 space-y-1.5 ${isToday ? 'bg-primary/5' : 'hover:bg-gray-50/50'} transition-colors`}>
                  {dayShifts.length === 0 && (
                    <p className="text-[10px] text-gray-300 text-center mt-6 font-medium">No shifts</p>
                  )}
                  {dayShifts.map(s => {
                    const emp = visibleEmployees.find(e => e.id === s.employeeId);
                    const name = emp ? `${emp.firstName} ${emp.lastName}` : (s.employeeName || 'Unknown');
                    const isLeave = s.status === 'On Leave';
                    const c = isLeave ? LEAVE_COLOR : getColor(s.employeeId, visibleEmployees, name, s.employee || emp);
                    return (
                      <div key={s.id} className={`p-2 ${c.bg} border-l-2 ${c.border} rounded-lg shadow-sm ${isLeave ? 'ring-1 ring-rose-200' : ''}`}>
                        <div className="flex items-start justify-between gap-1">
                          <p className={`text-[10px] font-bold ${c.text} truncate`}>{name}</p>
                          {isLeave && <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-red-500 flex-shrink-0 shadow-sm" />}
                        </div>
                        <p className={`text-[9px] font-medium opacity-60 ${c.text}`}>
                          {s.status === 'On Leave' ? `${(s.leaveType || 'Leave').replace(/_/g, ' ')} Leave` : `${s.startTime} - ${s.endTime}`}
                        </p>
                        <p className={`text-[9px] font-medium opacity-50 ${c.text} truncate`}>{s.branch}</p>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
          </div>
        </div>
      )}

      {/* ===== DAY VIEW ===== */}
      {view === 'Day' && (() => {
        const dateStr = formatDate(currentDate);
        const dayShifts = sortScheduleEntries(filteredSchedules.filter(s => s.date === dateStr), visibleEmployees);
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
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{DAYS[(currentDate.getDay() - 6 + 7) % 7]}</p>
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
                const emp = visibleEmployees.find(e => e.id === s.employeeId);
                const name = emp ? `${emp.firstName} ${emp.lastName}` : (s.employeeName || 'Unknown');
                const isLeave = s.status === 'On Leave';
                const c = isLeave ? LEAVE_COLOR : getColor(s.employeeId, visibleEmployees, name, s.employee || emp);
                return (
                  <div key={s.id} className={`flex items-center gap-5 p-5 ${c.bg} border-l-4 ${c.border} rounded-2xl shadow-sm ${isLeave ? 'ring-1 ring-rose-200' : ''}`}>
                    <div className={`w-10 h-10 rounded-xl ${c.badge} flex items-center justify-center text-white font-black text-sm shrink-0`}>
                      {name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-black text-sm ${c.text}`}>{name}</p>
                        {isLeave && <span className="h-2.5 w-2.5 rounded-full bg-red-500 flex-shrink-0 shadow-sm" />}
                      </div>
                      <p className={`text-xs font-medium opacity-60 ${c.text} capitalize`}>
                        {emp?.user?.role || s.employee?.employmentType || 'Employee'} · {emp?.specialization || s.title}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className={`flex items-center gap-1.5 text-xs font-bold ${c.text}`}>
                        {s.status !== 'On Leave' && <Clock size={12} />}
                        {s.status === 'On Leave' ? `${(s.leaveType || 'Leave').replace(/_/g, ' ')} Leave` : `${s.startTime} - ${s.endTime}`}
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
              const emp = visibleEmployees.find(e => e.id === s.employeeId);
              const name = emp ? `${emp.firstName} ${emp.lastName}` : (s.employeeName || 'Unknown');
              const isLeave = s.status === 'On Leave';
              const c = isLeave ? LEAVE_COLOR : getColor(s.employeeId, visibleEmployees, name, s.employee || emp);
              return (
                <div key={s.id} className={`flex items-center gap-4 p-4 ${c.bg} border-l-4 ${c.border} rounded-xl shadow-sm ${isLeave ? 'ring-1 ring-rose-200' : ''}`}>
                  <div className={`w-9 h-9 rounded-xl ${c.badge} flex items-center justify-center text-white font-black text-sm shrink-0`}>
                    {name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`font-black text-sm ${c.text}`}>{name}</p>
                      {isLeave && <span className="h-2.5 w-2.5 rounded-full bg-red-500 flex-shrink-0 shadow-sm" />}
                    </div>
                    <p className={`text-xs opacity-60 font-medium ${c.text} capitalize`}>
                      {emp?.user?.role || s.employee?.employmentType || 'Employee'} · {s.branch}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs font-bold ${c.text}`}>
                    {s.status !== 'On Leave' && <Clock size={12} />}
                    {s.status === 'On Leave' ? `${(s.leaveType || 'Leave').replace(/_/g, ' ')} Leave` : `${s.startTime} - ${s.endTime}`}
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
