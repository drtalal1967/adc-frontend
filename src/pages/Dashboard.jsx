import React from 'react';
import API from '../api';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  FlaskConical, Receipt, TrendingUp, DollarSign, AlertCircle,
  CheckCircle2, Clock, ArrowUpRight, Plus, Users, Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#2F5D90', '#F58220', '#A5C3DF', '#10B981', '#F59E0B', '#EF4444'];

function StatCard({ icon: Icon, label, value, change, color, gradient }) {
  return (
    <div className={`card card-hover relative overflow-hidden`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-800 font-heading">{value}</p>
          {change && (
            <p className="text-xs text-emerald-600 flex items-center gap-0.5 mt-1 font-medium">
              <ArrowUpRight size={12} /> {change}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${gradient}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${gradient} opacity-30 rounded-b-2xl`} />
    </div>
  );
}

function AdminDashboard({ stats }) {
  const navigate = useNavigate();
  const pendingCases = stats.pendingCases || 0;
  const unpaidCases = stats.unpaidCases || 0;
  const totalUnpaidExpenses = stats.unpaidExpenses || 0;
  const recentCases = stats.recentCases || [];
  const pendingLeaves = stats.pendingLeaves || [];
  
  // Direct trend from API
  const REVENUE_DATA = stats.revenueTrend || [];
  const latestMonth = REVENUE_DATA[REVENUE_DATA.length - 1] || {};

  const monthlyIncome = parseFloat(latestMonth.revenue || 0);
  const monthlyExpenses = parseFloat(latestMonth.expenses || 0) + parseFloat(latestMonth.salaries || 0);
  const profit = monthlyIncome - monthlyExpenses;

  const totalExpenseSum = stats.expenseDistribution?.reduce((acc, d) => acc + (parseFloat(d._sum?.amount) || 0), 0) || 1;
  const EXPENSE_CATEGORIES = stats.expenseDistribution?.map((d, i) => ({
    name: d.category || 'Other',
    value: Math.round(((parseFloat(d._sum?.amount) || 0) / totalExpenseSum) * 100) || 0,
    color: COLORS[i % COLORS.length]
  })).filter(c => c.value > 0) || [];

  // Calculate prosthesis percentage distribution
  const totalProsthesisCases = stats.prosthesisDistribution?.reduce((acc, d) => acc + (d._count?.id || 0), 0) || 1;
  const PROSTHESIS_STATS = stats.prosthesisDistribution?.map((d, i) => ({
    name: d.prosthesisType || 'Other',
    value: Math.round(((d._count?.id || 0) / totalProsthesisCases) * 100) || 0,
    color: COLORS[i % COLORS.length]
  })).filter(c => c.value > 0) || [];

  const profitData = REVENUE_DATA.map(r => ({ 
    ...r, 
    profit: (Number(r.revenue) || 0) - (Number(r.expenses) || 0) - (Number(r.salaries) || 0) 
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title text-xl md:text-2xl">Admin Dashboard</h1>
          <p className="section-subtitle text-xs md:text-sm">Overview of clinic operations • March 2026</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button onClick={() => navigate('/lab-cases?action=add')} className="btn-primary flex-1 sm:flex-none justify-center py-2 text-xs md:text-sm">
            <Plus size={15} /> Add Case
          </button>
          <button onClick={() => navigate('/expenses')} className="btn-outline flex-1 sm:flex-none justify-center py-2 text-xs md:text-sm">
            <Plus size={15} /> Add Expense
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
        <StatCard icon={Clock} label="Pending Lab Cases" value={pendingCases} change="+2 this week" gradient="bg-gradient-teal" />
        <StatCard icon={AlertCircle} label="Unpaid Lab Cases" value={unpaidCases} gradient="bg-gradient-to-br from-amber-400 to-orange-500" />
        <StatCard icon={Receipt} label="Unpaid Expenses" value={`BHD ${Number(totalUnpaidExpenses).toFixed(0)}`} gradient="bg-gradient-to-br from-red-400 to-red-600" />
        <StatCard icon={TrendingUp} label="Monthly Income" value={`BHD ${monthlyIncome.toFixed(0)}`} gradient="bg-gradient-to-br from-emerald-400 to-emerald-600" />
        <StatCard icon={DollarSign} label="Monthly Expenses" value={`BHD ${monthlyExpenses.toFixed(0)}`} gradient="bg-gradient-to-br from-blue-400 to-blue-600" />
        <StatCard icon={Activity} label="Net Profit" value={`BHD ${profit.toFixed(0)}`} gradient="bg-gradient-to-br from-purple-400 to-purple-600" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Revenue vs Expenses */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-800 text-sm">Revenue vs Expenses</h3>
              <p className="text-xs text-gray-500">Last 6 months trend</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={REVENUE_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2F5D90" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2F5D90" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}K`} />
              <Tooltip formatter={v => [`BHD ${(v || 0).toLocaleString()}`, '']} contentStyle={{ borderRadius: 12, border: '1px solid #f0f0f0', fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke="#2F5D90" strokeWidth={2} fill="url(#rev)" name="Revenue" />
              <Area type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} fill="url(#exp)" name="Expenses" />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Profit Graph */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-800 text-sm">Monthly Profit</h3>
              <p className="text-xs text-gray-500">After expenses & salaries</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={profitData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2F5D90" />
                  <stop offset="100%" stopColor="#F58220" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}K`} />
              <Tooltip formatter={v => [`BHD ${(v || 0).toLocaleString()}`, 'Profit']} contentStyle={{ borderRadius: 12, border: '1px solid #f0f0f0', fontSize: 12 }} />
              <Bar dataKey="profit" fill="url(#profitGrad)" radius={[6, 6, 0, 0]} name="Profit" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Expense Categories */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 text-sm mb-1">Expense Categories</h3>
          <p className="text-xs text-gray-500 mb-4">Distribution by type</p>
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-4">
            <div className="w-full sm:w-1/2 flex justify-center">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={EXPENSE_CATEGORIES} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {EXPENSE_CATEGORIES.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={v => [`${v}%`, '']} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full sm:flex-1 space-y-2">
              {EXPENSE_CATEGORIES.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
                    <span className="text-gray-600">{c.name}</span>
                  </div>
                  <span className="font-semibold text-gray-800">{c.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Prosthesis Types */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 text-sm mb-1">Prosthesis Types</h3>
          <p className="text-xs text-gray-500 mb-4">Case distribution this month</p>
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-4">
            <div className="w-full sm:w-1/2 flex justify-center">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={PROSTHESIS_STATS} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {PROSTHESIS_STATS.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={v => [`${v}%`, '']} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full sm:flex-1 space-y-2">
              {PROSTHESIS_STATS.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
                    <span className="text-gray-600">{c.name}</span>
                  </div>
                  <span className="font-semibold text-gray-800">{c.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Cases & Pending Leaves */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Lab Cases */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 text-sm">Recent Lab Cases</h3>
            <button onClick={() => navigate('/lab-cases')} className="text-xs text-primary font-medium hover:underline">View all</button>
          </div>
          <div className="space-y-2">
            {recentCases.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <FlaskConical size={14} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{c.patientName}</p>
                  <p className="text-xs text-gray-500">{c.prosthesisType || 'Case'} • {c.laboratory?.name || 'Local'}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={c.status} />
                  <PayBadge status={c.paymentStatus} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Leave Requests */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 text-sm">Pending Leave Requests</h3>
            <button onClick={() => navigate('/leaves')} className="text-xs text-primary font-medium hover:underline">Manage</button>
          </div>
          <div className="space-y-2">
            {pendingLeaves.map(l => (
              <div key={l.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Users size={14} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{l.employee ? `${l.employee.firstName} ${l.employee.lastName}` : 'Employee'}</p>
                  <p className="text-xs text-gray-500">
                    {l.leaveType} • {String(l.startDate || '').split('T')[0]} to {String(l.endDate || '').split('T')[0]}
                  </p>
                </div>
                <span className="badge badge-warning">{l.totalDays}d</span>
              </div>
            ))}
            {pendingLeaves.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No pending requests</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    'Pending': 'badge-warning',
    'In Progress': 'badge-info',
    'Sent to Lab': 'badge-primary',
    'Delivered': 'badge-success',
    'Completed': 'badge-success',
  };
  return <span className={`badge ${map[status] || 'badge-gray'} text-xs py-0.5 px-2`}>{status}</span>;
}

function PayBadge({ status }) {
  return <span className={`badge ${status === 'Paid' ? 'badge-success' : 'badge-danger'} text-xs py-0.5 px-2`}>{status}</span>;
}

// Manager Dashboard
function ManagerDashboard({ stats }) {
  const navigate = useNavigate();
  const pending = stats.pendingCases;
  const unpaid = stats.unpaidCases;
  const expenses = stats.unpaidExpenses;
  const REVENUE_DATA = stats.revenueTrend || [];
  const latestMonth = REVENUE_DATA[REVENUE_DATA.length - 1] || {};
  const monthlyIncome = parseFloat(latestMonth.revenue || 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title">Manager Dashboard</h1>
        <p className="section-subtitle">Monitor clinic operations</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Clock} label="Pending Cases" value={pending} gradient="bg-gradient-teal" />
        <StatCard icon={AlertCircle} label="Unpaid Lab Cases" value={unpaid} gradient="bg-gradient-to-br from-amber-400 to-orange-500" />
        <StatCard icon={Receipt} label="Monthly Expenses" value={`BHD ${Number(expenses || 0).toFixed(0)}`} gradient="bg-gradient-to-br from-red-400 to-red-600" />
        <StatCard icon={TrendingUp} label="Monthly Income" value={`BHD ${monthlyIncome.toFixed(0)}`} gradient="bg-gradient-to-br from-emerald-400 to-emerald-600" />
      </div>
      <div className="card">
        <h3 className="font-semibold text-gray-800 text-sm mb-4">Revenue vs Expenses</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={REVENUE_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="rev2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2F5D90" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#2F5D90" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}K`} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #f0f0f0', fontSize: 12 }} />
            <Area type="monotone" dataKey="revenue" stroke="#2F5D90" strokeWidth={2} fill="url(#rev2)" name="Revenue" />
            <Area type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} fill="none" name="Expenses" />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Secretary Dashboard
function SecretaryDashboard({ stats }) {
  const navigate = useNavigate();
  const today = stats.pendingCases;
  const recentCases = stats.recentCases || [];
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Secretary Dashboard</h1>
          <p className="section-subtitle">Daily clinic operations • March 2026</p>
        </div>
        <button onClick={() => navigate('/lab-cases?action=add')} className="btn-primary">
          <Plus size={15} /> New Lab Case
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={FlaskConical} label="Active Cases" value={today} gradient="bg-gradient-teal" />
        <StatCard icon={AlertCircle} label="Pending Cases" value={today} gradient="bg-gradient-to-br from-amber-400 to-orange-500" />
        <StatCard icon={CheckCircle2} label="Completed This Month" value={stats.completedThisMonth || 0} gradient="bg-gradient-to-br from-emerald-400 to-emerald-600" />
      </div>
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 text-sm">Today's Cases</h3>
          <button onClick={() => navigate('/lab-cases')} className="text-xs text-primary font-medium hover:underline">View all</button>
        </div>
        <div className="space-y-2">
          {recentCases.slice(0, 5).map(c => (
            <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center">
                <FlaskConical size={14} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{c.patientName}</p>
                <p className="text-xs text-gray-500">{c.patientNumber} • {c.prosthesisType || 'Case'}</p>
              </div>
              <StatusBadge status={c.status} />
            </div>
          ))}
          {recentCases.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No recent cases</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Dentist / Assistant Dashboard
function ClinicalDashboard({ role, stats }) {
  const recentCases = stats.recentCases || [];
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title">{role === 'dentist' ? 'Dentist' : 'Dental Assistant'} Dashboard</h1>
        <p className="section-subtitle">My cases and schedule • March 2026</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={FlaskConical} label="My Active Cases" value={stats.pendingCases} gradient="bg-gradient-teal" />
        <StatCard icon={Clock} label="Pending Review" value={0} gradient="bg-gradient-to-br from-amber-400 to-orange-500" />
        <StatCard icon={CheckCircle2} label="Completed This Month" value={stats.completedThisMonth || 0} gradient="bg-gradient-to-br from-emerald-400 to-emerald-600" />
      </div>
      <div className="card">
        <h3 className="font-semibold text-gray-800 text-sm mb-4">My Cases</h3>
        <div className="space-y-2">
          {recentCases.slice(0, 4).map(c => (
            <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center">
                <FlaskConical size={14} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{c.patientName}</p>
                <p className="text-xs text-gray-500">{c.prosthesisType} • {c.toothNumbers}</p>
              </div>
              <StatusBadge status={c.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Accountant Dashboard
function AccountantDashboard({ stats }) {
  const REVENUE_DATA = stats.revenueTrend || [];
  const latestMonth = REVENUE_DATA[REVENUE_DATA.length - 1] || {};
  const monthlyIncome = parseFloat(latestMonth.revenue || 0);
  const monthlyCosts = parseFloat(latestMonth.expenses || 0) + parseFloat(latestMonth.salaries || 0);
  const profit = monthlyIncome - monthlyCosts;

  const profitData = REVENUE_DATA.map(r => ({ 
    ...r, 
    profit: (Number(r.revenue) || 0) - (Number(r.expenses) || 0) - (Number(r.salaries) || 0) 
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title">Accountant Dashboard</h1>
        <p className="section-subtitle">Financial overview</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={TrendingUp} label="Monthly Revenue" value={`BHD ${monthlyIncome.toFixed(0)}`} gradient="bg-gradient-to-br from-emerald-400 to-emerald-600" />
        <StatCard icon={Receipt} label="Monthly Expenses" value={`BHD ${Number(stats.unpaidExpenses || 0).toFixed(0)}`} gradient="bg-gradient-to-br from-red-400 to-red-600" />
        <StatCard icon={DollarSign} label="Net Profit" value={`BHD ${profit.toFixed(0)}`} gradient="bg-gradient-teal" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <h3 className="font-semibold text-gray-800 text-sm mb-4">Revenue vs Expenses</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={REVENUE_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="rev3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0EA5A4" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0EA5A4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}K`} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke="#0EA5A4" strokeWidth={2} fill="url(#rev3)" name="Revenue" />
              <Area type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} fill="none" name="Expenses" />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-800 text-sm mb-4">Monthly Profit</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={profitData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="profitGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2F5D90" />
                  <stop offset="100%" stopColor="#4B86BF" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}K`} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="profit" fill="url(#profitGrad2)" radius={[6, 6, 0, 0]} name="Profit" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get('/dashboard/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm font-bold text-primary animate-pulse uppercase tracking-widest text-center">
        Gathering Clinical Data...
      </p>
    </div>
  );

  if (!stats) return <div className="p-4 text-gray-500">Failed to load dashboard data.</div>;
  if (!user?.role) return <div className="p-4 text-amber-600">User role not found.</div>;

  try {
    const role = user.role.toUpperCase();

    if (role === 'ADMIN') return <AdminDashboard stats={stats} />;
    if (role === 'MANAGER') return <ManagerDashboard stats={stats} />;
    if (role === 'SECRETARY') return <SecretaryDashboard stats={stats} />;
    if (role === 'DENTIST' || role === 'ASSISTANT') {
      return <ClinicalDashboard role={user.role.toLowerCase()} stats={stats} />;
    }
    if (role === 'ACCOUNTANT') return <AccountantDashboard stats={stats} />;
    return <div className="p-4">Access Denied (Role: {role})</div>;
  } catch (err) {
    console.error('Dashboard Render Error:', err);
    return (
      <div className="m-6 p-6 bg-red-50 border border-red-200 rounded-2xl text-red-800">
        <h2 className="text-xl font-bold mb-2">Dashboard Error</h2>
        <p className="text-sm font-mono bg-white/50 p-3 rounded-lg mb-4">{err.message}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
        >
          Reload Page
        </button>
      </div>
    );
  }
}
