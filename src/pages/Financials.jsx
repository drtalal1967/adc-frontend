import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import API from '../api';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  Wallet, 
  Activity, 
  Clock, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  ChevronDown,
  Download
} from 'lucide-react';

const KPICard = ({ title, value, subValue, trend, trendType, icon: Icon, color, borderSide }) => {
  const isPositive = trendType === 'up';
  const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;
  const trendColor = isPositive ? 'text-emerald-500' : 'text-rose-500';
  const borderColor = {
    blue: 'border-l-[6px] border-blue-800',
    orange: 'border-l-[6px] border-orange-500',
    black: 'border-l-[6px] border-gray-800',
    purple: 'border-l-[6px] border-indigo-700',
  }[borderSide] || 'border-l-[6px] border-gray-100';

  return (
    <div className={`bg-white p-5 rounded-2xl shadow-sm border border-gray-100 ${borderColor} relative group hover:shadow-md transition-all duration-300`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
          <p className="text-2xl font-black text-gray-900 mt-1 tracking-tight">
            {typeof value === 'number' && !title.includes('%') ? `BHD ${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : value}
          </p>
        </div>
        <div className={`w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-800 group-hover:scale-110 transition-transform`}>
          <Icon size={18} strokeWidth={2.5} />
        </div>
      </div>
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1">
          {trend && (
            <>
              <TrendIcon size={14} className={trendColor} strokeWidth={3} />
              <span className={`text-[11px] font-bold ${trendColor}`}>{trend}</span>
            </>
          )}
          {!trend && <span className="text-[11px] font-bold text-gray-400">— Stable</span>}
        </div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{subValue}</p>
      </div>
    </div>
  );
};

export default function Financials() {
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [analytics, setAnalytics] = useState({ trends: [], distributions: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const branchParam = selectedBranch === 'all' ? 'all' : selectedBranch;
        const res = await API.get(`/dashboard/analytics?branch=${branchParam}`);
        setAnalytics(res.data);
      } catch (err) {
        console.error('Error fetching financials:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [selectedBranch]);

  const filteredData = analytics.trends;
  const distributions = analytics.distributions || {};

  const totalRevenueYTD = filteredData.reduce((acc, r) => acc + r.revenue, 0);
  const totalExpensesYTD = filteredData.reduce((acc, r) => acc + r.expenses + r.salaries, 0);
  const netProfitYTD = totalRevenueYTD - totalExpensesYTD;

  const handleGenerateReport = () => {
    const doc = new jsPDF();
    const branchLabel = selectedBranch === 'all' ? 'All Branches' : selectedBranch;
    const date = new Date().toLocaleDateString();

    // Header
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Financial Report', 14, 18);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${date}`, 140, 18);

    // Summary section
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, 44);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Branch: ${branchLabel}`, 14, 54);
    doc.text(`Total Revenue (YTD): BHD ${totalRevenueYTD.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 14, 62);
    doc.text(`Total Expenses (YTD): BHD ${totalExpensesYTD.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 14, 70);
    doc.text(`Net Profit (YTD): BHD ${netProfitYTD.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 14, 78);

    // Monthly breakdown table
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Monthly Breakdown', 14, 95);

    const headers = ['Month', 'Revenue (BHD)', 'Expenses (BHD)', 'Profit (BHD)'];
    const colWidths = [30, 55, 55, 45];
    const startX = 14;
    let y = 105;

    // Table header
    doc.setFillColor(30, 58, 138);
    doc.rect(startX, y - 6, 185, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    let x = startX + 2;
    headers.forEach((h, i) => { doc.text(h, x, y); x += colWidths[i]; });
    y += 6;

    // Table rows
    doc.setFont('helvetica', 'normal');
    filteredData.forEach((row, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(241, 245, 249);
        doc.rect(startX, y - 5, 185, 7, 'F');
      }
      doc.setTextColor(30, 41, 59);
      x = startX + 2;
      const rowData = [
        row.month,
        row.revenue.toLocaleString(),
        (row.expenses + row.salaries).toLocaleString(),
        row.profit.toLocaleString()
      ];
      rowData.forEach((val, i) => { doc.text(String(val), x, y); x += colWidths[i]; });
      y += 7;
    });

    doc.save('financial-report.pdf');
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none">Financial Dashboard</h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">Welcome back, <span className="text-primary font-bold">Admin User</span></p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative min-w-[160px]">
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              className="appearance-none w-full bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer">
              <option value="all">All Branches</option>
              <option value="Manama Branch">Manama Branch</option>
              <option value="Tubli Branch">Tubli Branch</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <button onClick={handleGenerateReport} className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-orange-200 font-bold text-sm transition-all flex items-center gap-2 active:scale-95 leading-none">
            <Download size={18} /> Generate Report
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Total Revenue (YTD)" 
          value={totalRevenueYTD} 
          subValue="total received" 
          icon={DollarSign} 
          borderSide="blue"
        />
        <KPICard 
          title="Total Expenses (YTD)" 
          value={totalExpensesYTD} 
          subValue="total incurred" 
          icon={Wallet} 
          borderSide="orange"
        />
        <KPICard 
          title="Net Profit (YTD)" 
          value={netProfitYTD} 
          subValue="net earnings" 
          icon={Activity} 
          borderSide="black"
        />
        <KPICard 
          title="Expenses / Revenue" 
          value={totalRevenueYTD > 0 ? `${((totalExpensesYTD / totalRevenueYTD) * 100).toFixed(1)}%` : '0.0%'} 
          subValue="cost ratio" 
          icon={Wallet} 
          borderSide="light"
        />

        <KPICard 
          title="Avg Monthly Revenue" 
          value={totalRevenueYTD / (filteredData.length || 1)} 
          subValue="year to date" 
          icon={DollarSign} 
          borderSide="blue"
        />
        <KPICard 
          title="Pending Payments" 
          value={distributions.paymentStatus?.find(s => s.name === 'Pending')?.value || 0} 
          subValue="count" 
          icon={AlertCircle} 
          borderSide="black"
        />
        <KPICard 
          title="Avg Monthly Profit" 
          value={netProfitYTD / (filteredData.length || 1)} 
          subValue="year to date" 
          icon={Activity} 
          borderSide="black"
        />
        <KPICard 
          title="Cash Flow Status" 
          value={netProfitYTD >= 0 ? "Positive" : "Negative"} 
          subValue="YTD" 
          icon={Activity} 
          borderSide="blue"
        />
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Trend */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-50 shadow-sm relative overflow-hidden border-t-4 border-t-blue-800">
           <h3 className="text-lg font-black text-gray-800 tracking-tight mb-8">Revenue Trend (Last 12 Months)</h3>
           <div className="h-[250px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={filteredData} margin={{ left: -10 }}>
                    <CartesianGrid vertical={false} stroke="#F3F4F6" strokeDasharray="3 3" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#9CA3AF' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#9CA3AF' }} tickFormatter={(v) => `BHD ${v/1000}K`} />
                    <Tooltip cursor={{ stroke: '#1E3A8A', strokeWidth: 1 }} contentStyle={{ borderRadius: 16, border: 'none', shadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="revenue" stroke="#1E3A8A" strokeWidth={4} dot={{ r: 6, fill: '#1E3A8A', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                 </LineChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Expense Trend */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-50 shadow-sm relative overflow-hidden border-t-4 border-t-orange-500">
           <h3 className="text-lg font-black text-gray-800 tracking-tight mb-8">Expense Trend (Last 12 Months)</h3>
           <div className="h-[250px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={filteredData} margin={{ left: -10 }}>
                    <CartesianGrid vertical={false} stroke="#F3F4F6" strokeDasharray="3 3" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#9CA3AF' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#9CA3AF' }} tickFormatter={(v) => `BHD ${v/1000}K`} />
                    <Tooltip contentStyle={{ borderRadius: 16, border: 'none' }} />
                    <Line type="monotone" dataKey="expenses" stroke="#F97316" strokeWidth={4} dot={{ r: 6, fill: '#F97316', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                 </LineChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Net Profit Trend - Full Width */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-gray-50 shadow-sm border-t-4 border-t-emerald-500">
           <h3 className="text-lg font-black text-gray-800 tracking-tight mb-2">Net Profit Trend</h3>
           <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-8">Performance metrics over time</p>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={filteredData} margin={{ left: -10 }}>
                    <defs>
                       <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                       </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#F3F4F6" strokeDasharray="3 3" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#9CA3AF' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#9CA3AF' }} tickFormatter={(v) => `BHD ${v/1000}K`} />
                    <Tooltip contentStyle={{ borderRadius: 16, border: 'none' }} />
                    <Area type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={4} fill="url(#profitGrad)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Distributions */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-50 shadow-sm h-full">
           <h3 className="text-lg font-black text-gray-800 tracking-tight mb-8">Payment Methods</h3>
           <div className="h-[250px] w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie 
                      data={distributions.paymentMethods || []} 
                      cx="50%" cy="50%" 
                      innerRadius={60} outerRadius={100} 
                      paddingAngle={5} dataKey="value"
                    >
                       {(distributions.paymentMethods || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                       ))}
                    </Pie>
                    <Tooltip />
                 </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Count</p>
                 <p className="text-xl font-black text-gray-800 leading-none">
                   {(distributions.paymentMethods || []).reduce((a, b) => a + b.value, 0)}
                 </p>
              </div>
           </div>
           <div className="flex justify-center gap-6 mt-4 flex-wrap">
              {(distributions.paymentMethods || []).map(m => (
                 <div key={m.name} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} />
                    <span className="text-xs font-bold text-gray-600">{m.name}</span>
                 </div>
              ))}
           </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-gray-50 shadow-sm h-full">
           <h3 className="text-lg font-black text-gray-800 tracking-tight mb-8">Payment Status Distribution</h3>
           <div className="h-[250px] w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie 
                      data={distributions.paymentStatus || []} 
                      cx="50%" cy="50%" 
                      innerRadius={60} outerRadius={100} 
                      paddingAngle={5} dataKey="value"
                    >
                       {(distributions.paymentStatus || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                       ))}
                    </Pie>
                    <Tooltip />
                 </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                 <p className="text-xl font-black text-emerald-600 leading-none">
                   {Math.round(((distributions.paymentStatus?.find(s => s.name === 'Paid')?.value || 0) / 
                   ((distributions.paymentStatus?.reduce((a, b) => a + b.value, 0)) || 1)) * 100)}%
                 </p>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mt-1">Paid</p>
              </div>
           </div>
           <div className="flex justify-center gap-6 mt-4">
              {(distributions.paymentStatus || []).map(m => (
                 <div key={m.name} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} />
                    <span className="text-xs font-bold text-gray-600">{m.name}</span>
                 </div>
              ))}
           </div>
        </div>

        {/* Expenses by Category */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-gray-50 shadow-sm">
           <h3 className="text-lg font-black text-gray-800 tracking-tight mb-8">Expenses by Category</h3>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={distributions.expenseCategories || []} margin={{ left: -20 }}>
                    <CartesianGrid vertical={false} stroke="#f0f0f0" strokeDasharray="3 3" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#9CA3AF' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#9CA3AF' }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: 16, border: 'none' }} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                       {(distributions.expenseCategories || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#2F5D90', '#F58220', '#78A4CF', '#10B981', '#F59E0B'][index % 5]} />
                       ))}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
}
