import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import API from '../api';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  Activity, 
  ChevronDown,
  Download,
  FileText,
  X,
  Calendar,
  Trash2
} from 'lucide-react';

const KPICard = ({ title, value, icon: Icon, borderColor }) => (
  <div className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 ${borderColor} border-l-[6px] flex items-center gap-4`}>
    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-800">
      <Icon size={24} />
    </div>
    <div>
      <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
      <p className="text-2xl font-black text-gray-900 mt-1 tracking-tight">{value}</p>
    </div>
  </div>
);

export default function FinancialAnalytics() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [showCustomReport, setShowCustomReport] = useState(false);
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-03-31');
  const tabs = ['Overview', 'Revenue Tracking', 'Expense Analysis', 'Payments Tracking'];

  const [revForm, setRevForm] = useState({ month: 'Mar', year: '2026', amount: '', branch: 'Tubli Branch' });
  const [salForm, setSalForm] = useState({ month: 'Mar', year: '2026', amount: '', branch: 'Tubli Branch' });
  const [records, setRecords] = useState([]);

  const handleCustomReport = () => {
    setShowCustomReport(true);
  };

  const handleSaveRevenue = async () => {
    if (!revForm.amount) return alert('Please enter an amount');
    try {
      await API.post('/dashboard/financial-entry', {
        ...revForm,
        type: 'REVENUE'
      });
      alert('Revenue saved successfully!');
      setRevForm({ ...revForm, amount: '' });
      fetchAnalytics();
      fetchRecords();
    } catch (err) {
      console.error('Error saving revenue:', err);
      alert('Failed to save revenue');
    }
  };

  const handleSaveSalaries = async () => {
    if (!salForm.amount) return alert('Please enter an amount');
    try {
      await API.post('/dashboard/financial-entry', {
        ...salForm,
        type: 'SALARY'
      });
      alert('Salaries saved successfully!');
      setSalForm({ ...salForm, amount: '' });
      fetchAnalytics();
      fetchRecords();
    } catch (err) {
      console.error('Error saving salaries:', err);
      alert('Failed to save salaries');
    }
  };

  const generateCustomReport = () => {
    const doc = new jsPDF();
    const branchLabel = selectedBranch === 'all' ? 'All Branches' : selectedBranch;

    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(17);
    doc.setFont('helvetica', 'bold');
    doc.text('Custom Financial Report', 14, 17);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Branch: ${branchLabel}`, 14, 42);
    doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 50);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 58);

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Analytics Summary', 14, 74);

    const headers = ['Month', 'Revenue (BHD)', 'Costs (BHD)', 'Profit (BHD)', 'Margin'];
    const colWidths = [25, 45, 42, 42, 30];
    const startX = 14;
    let y = 84;

    doc.setFillColor(30, 58, 138);
    doc.rect(startX, y - 6, 185, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    let x = startX + 2;
    headers.forEach((h, i) => { doc.text(h, x, y); x += colWidths[i]; });
    y += 6;

    doc.setFont('helvetica', 'normal');
    analyticsData.forEach((row, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(241, 245, 249);
        doc.rect(startX, y - 5, 185, 7, 'F');
      }
      doc.setTextColor(30, 41, 59);
      x = startX + 2;
      [
        row.month,
        (row.revenue || 0).toLocaleString(),
        (row.costs || 0).toLocaleString(),
        (row.profit || 0).toLocaleString(),
        `${row.margin}%`
      ].forEach((val, i) => { doc.text(String(val), x, y); x += colWidths[i]; });
      y += 7;
    });

    doc.save('custom-report.pdf');
    setShowCustomReport(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const branchLabel = selectedBranch === 'all' ? 'All Branches' : selectedBranch;
    const date = new Date().toLocaleDateString();
    const totalRevenue = analyticsData.reduce((a, r) => a + (r.revenue || 0), 0);
    const totalCosts = analyticsData.reduce((a, r) => a + (r.costs || 0), 0);
    const totalProfit = analyticsData.reduce((a, r) => a + (r.profit || 0), 0);

    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(17);
    doc.setFont('helvetica', 'bold');
    doc.text('Financial Analytics Report', 14, 17);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Branch: ${branchLabel}`, 14, 42);
    doc.text(`Generated: ${date}`, 14, 50);

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Performance Summary', 14, 66);

    const summaryRows = [
      ['Total Revenue (YTD)', `BHD ${totalRevenue.toLocaleString()}`],
      ['Total Costs (YTD)', `BHD ${totalCosts.toLocaleString()}`],
      ['Net Profit (YTD)', `BHD ${totalProfit.toLocaleString()}`],
      ['Profit Margin', `${latest.margin}%`],
    ];

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let y = 78;
    summaryRows.forEach(([label, val]) => {
      doc.text(label, 14, y);
      doc.text(val, 120, y);
      y += 10;
    });

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Monthly Breakdown', 14, y + 10);
    y += 20;

    const headers = ['Month', 'Revenue (BHD)', 'Costs (BHD)', 'Profit (BHD)', 'Margin'];
    const colWidths = [25, 45, 42, 42, 30];
    const startX = 14;

    doc.setFillColor(16, 185, 129);
    doc.rect(startX, y - 6, 185, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    let x = startX + 2;
    headers.forEach((h, i) => { doc.text(h, x, y); x += colWidths[i]; });
    y += 6;

    doc.setFont('helvetica', 'normal');
    analyticsData.forEach((row, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(240, 253, 244);
        doc.rect(startX, y - 5, 185, 7, 'F');
      }
      doc.setTextColor(30, 41, 59);
      x = startX + 2;
      [
        row.month,
        (row.revenue || 0).toLocaleString(),
        (row.costs || 0).toLocaleString(),
        (row.profit || 0).toLocaleString(),
        `${row.margin}%`
      ].forEach((val, i) => { doc.text(String(val), x, y); x += colWidths[i]; });
      y += 7;
    });

    doc.save('analytics-report.pdf');
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const years = ['2024', '2025', '2026', '2027'];

  const [analyticsData, setAnalyticsData] = useState([]);
  const [distributions, setDistributions] = useState({
    paymentMethods: [],
    paymentStatus: [],
    expenseCategories: []
  });
  const [loading, setLoading] = useState(true);

  const COLORS = ['#1E3A8A', '#F97316', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  useEffect(() => {
    fetchAnalytics();
    fetchRecords();
  }, [selectedBranch]);

  const fetchRecords = async () => {
    try {
      const branchParam = selectedBranch === 'all' ? 'all' : selectedBranch;
      const res = await API.get(`/dashboard/financial-entries?branch=${branchParam}`);
      setRecords(res.data || []);
    } catch (err) {
      console.error('Error fetching financial records:', err);
    }
  };

  const handleDeleteRecord = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await API.delete(`/dashboard/financial-entry/${id}`);
      fetchRecords();
      fetchAnalytics();
    } catch (err) {
      console.error('Error deleting record:', err);
      alert('Failed to delete record');
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const branchParam = selectedBranch === 'all' ? 'all' : selectedBranch;
      const res = await API.get(`/dashboard/analytics?branch=${branchParam}`);
      setAnalyticsData(res.data.trends || []);
      setDistributions(res.data.distributions || {
        paymentMethods: [],
        paymentStatus: [],
        expenseCategories: []
      });
    } catch (err) {
      console.error('Error fetching financial analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const latest = analyticsData[analyticsData.length - 1] || { revenue: 0, costs: 0, profit: 0, margin: '0.0' };

  // YTD totals for KPI cards (sum across all months, not just latest)
  const ytdRevenue = analyticsData.reduce((a, r) => a + (r.revenue || 0), 0);
  const ytdCosts = analyticsData.reduce((a, r) => a + (r.costs || 0), 0);
  const ytdProfit = ytdRevenue - ytdCosts;
  const ytdMargin = ytdRevenue > 0 ? ((ytdProfit / ytdRevenue) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Custom Report Modal */}
      {showCustomReport && (
        <div className="modal-overlay z-[100]" onClick={() => setShowCustomReport(false)}>
          <div className="modal-content max-w-md bg-white rounded-[2rem] shadow-2xl animate-scale-in p-0 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-blue-900 px-8 py-6 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><FileText size={20} /></div>
                <div>
                  <h2 className="font-bold text-lg leading-none">Custom Report</h2>
                  <p className="text-[10px] text-white/70 uppercase tracking-widest mt-0.5">Configure & Download PDF</p>
                </div>
              </div>
              <button onClick={() => setShowCustomReport(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={20} /></button>
            </div>
            <div className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1"><Calendar size={11} /> Start Date</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-900/10 bg-gray-50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1"><Calendar size={11} /> End Date</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-900/10 bg-gray-50" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Branch</label>
                <div className="relative">
                  <select
                    value={selectedBranch}
                    onChange={e => setSelectedBranch(e.target.value)}
                    className="appearance-none w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-900/10 bg-gray-50 cursor-pointer"
                  >
                    <option value="all">All Branches</option>
                    <option value="manama">Manama Branch</option>
                    <option value="tubli">Tubli Branch</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <button
                onClick={generateCustomReport}
                className="w-full bg-blue-900 hover:bg-blue-950 text-white py-4 rounded-2xl font-black text-sm transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Download size={16} /> Generate & Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none flex items-center gap-3">
            Financial Analytics
            <span className="text-[10px] bg-blue-900 text-white px-3 py-1 rounded-full uppercase tracking-tighter font-black align-middle">
              {selectedBranch === 'all' ? 'All Branches' : `${selectedBranch} Branch`}
            </span>
          </h1>
          <p className="text-sm text-gray-500 mt-2 font-medium uppercase tracking-widest">Advanced revenue, expense, and payment tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative min-w-[160px]">
            <select 
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="appearance-none w-full bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
            >
              <option value="all">All Branches</option>
              <option value="manama">Manama Branch</option>
              <option value="tubli">Tubli Branch</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <button onClick={handleCustomReport} className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-orange-200 font-bold text-sm transition-all active:scale-95 leading-none">
            Custom Report
          </button>
        </div>
      </div>

      {/* Tabs & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2 p-1.5 bg-gray-100/50 rounded-2xl w-fit">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab 
                ? 'bg-blue-900 text-white shadow-lg' 
                : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all">
          <FileText size={16} /> Export PDF
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total Revenue (YTD)" value={`BHD ${ytdRevenue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`} icon={DollarSign} borderColor="border-blue-900" />
        <KPICard title="Total Costs (YTD)" value={`BHD ${ytdCosts.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`} icon={TrendingUp} borderColor="border-orange-500" />
        <KPICard title="Net Profit (YTD)" value={`BHD ${ytdProfit.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`} icon={TrendingUp} borderColor="border-emerald-500" />
        <KPICard title="Profit Margin (YTD)" value={`${ytdMargin}%`} icon={Activity} borderColor="border-amber-400" />
      </div>

      {/* Charts Grid - Dynamic Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm border-t-4 border-t-blue-900">
              <h3 className="text-lg font-black text-gray-800 mb-8">Revenue vs Expenses (2026)</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#9CA3AF' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#9CA3AF' }} tickFormatter={v => `BHD ${v/1000}K`} />
                    <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700, paddingTop: 20 }} />
                    <Bar dataKey="revenue" name="Revenue" fill="#1E3A8A" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="costs" name="Expenses" fill="#F97316" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm border-t-4 border-t-emerald-500">
              <h3 className="text-lg font-black text-gray-800 mb-8">Profit Trend (2026)</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#9CA3AF' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#9CA3AF' }} tickFormatter={v => `BHD ${v/1000}K`} />
                    <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="profit" name="Net Profit" stroke="#10B981" strokeWidth={4} dot={{ r: 6, fill: '#10B981', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Revenue Tracking' && (
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm border-t-4 border-t-blue-900">
              <h3 className="text-lg font-black text-gray-800 mb-8">Monthly Revenue Breakdown</h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1E3A8A" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#1E3A8A" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontWeight: 700 }} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={v => `BHD ${v}`} />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stroke="#1E3A8A" fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Expense Analysis' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm border-t-4 border-t-orange-500">
              <h3 className="text-lg font-black text-gray-800 mb-8">Expense Categories</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributions.expenseCategories.length > 0 ? distributions.expenseCategories : [{name: 'Loading...', value: 1}]}
                      innerRadius={80}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {distributions.expenseCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm border-t-4 border-t-orange-500">
              <h3 className="text-lg font-black text-gray-800 mb-8">Direct vs Fixed Costs</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="expenses" name="Operational (Bills/Labs)" stackId="a" fill="#F97316" />
                    <Bar dataKey="salaries" name="Salaries (Fixed)" stackId="a" fill="#FED7AA" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Payments Tracking' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm border-t-4 border-t-emerald-500">
              <h3 className="text-lg font-black text-gray-800 mb-8">Payment Methods</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributions.paymentMethods}
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {distributions.paymentMethods.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm border-t-4 border-t-emerald-500">
              <h3 className="text-lg font-black text-gray-800 mb-8">Payment Collection Status</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributions.paymentStatus}
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {distributions.paymentStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recording Forms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Record Monthly Revenue */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden border-t-4 border-t-blue-900">
          <div className="bg-gray-50/50 px-8 py-4 border-b border-gray-100">
            <h3 className="text-lg font-black text-blue-900 leading-none">Record Monthly Revenue</h3>
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Month</label>
                <div className="relative">
                  <select 
                    value={revForm.month}
                    onChange={e => setRevForm({...revForm, month: e.target.value})}
                    className="appearance-none w-full bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-900/10 cursor-pointer"
                  >
                    {months.map(m => <option key={m}>{m}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Year</label>
                <div className="relative">
                  <input 
                    type="text"
                    value={revForm.year}
                    onChange={e => setRevForm({...revForm, year: e.target.value})}
                    className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-900/10"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1 text-blue-900/50">Amount (BHD)</label>
                <input 
                  type="number"
                  placeholder="Enter amount"
                  value={revForm.amount}
                  onChange={e => setRevForm({...revForm, amount: e.target.value})}
                  className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-900/10 placeholder:text-gray-300"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Branch</label>
                <div className="relative">
                  <select 
                    value={revForm.branch}
                    onChange={e => setRevForm({...revForm, branch: e.target.value})}
                    className="appearance-none w-full bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-900/10 cursor-pointer text-gray-400"
                  >
                    <option>Tubli Branch</option>
                    <option>Manama Branch</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <button 
              onClick={handleSaveRevenue}
              className="w-full bg-blue-900 hover:bg-blue-950 text-white py-4 rounded-xl font-black text-sm transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98]"
            >
              Save Revenue
            </button>
          </div>
        </div>

        {/* Record Monthly Salaries */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden border-t-4 border-t-orange-500">
          <div className="bg-orange-50/30 px-8 py-4 border-b border-gray-100">
            <h3 className="text-lg font-black text-orange-600 leading-none">Record Monthly Salaries</h3>
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Month</label>
                <div className="relative">
                  <select 
                    value={salForm.month}
                    onChange={e => setSalForm({...salForm, month: e.target.value})}
                    className="appearance-none w-full bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-orange-500/10 cursor-pointer"
                  >
                    {months.map(m => <option key={m}>{m}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Year</label>
                <div className="relative">
                  <input 
                    type="text"
                    value={salForm.year}
                    onChange={e => setSalForm({...salForm, year: e.target.value})}
                    className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-orange-500/10"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1 text-orange-600/50">Total Amount (BHD)</label>
                <input 
                  type="number"
                  placeholder="Enter amount"
                  value={salForm.amount}
                  onChange={e => setSalForm({...salForm, amount: e.target.value})}
                  className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-orange-500/10 placeholder:text-gray-300"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Branch</label>
                <div className="relative">
                  <select 
                    value={salForm.branch}
                    onChange={e => setSalForm({...salForm, branch: e.target.value})}
                    className="appearance-none w-full bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-orange-500/10 cursor-pointer text-gray-400"
                  >
                    <option>Tubli Branch</option>
                    <option>Manama Branch</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <button 
              onClick={handleSaveSalaries}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-xl font-black text-sm transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98]"
            >
              Save Salaries
            </button>
          </div>
        </div>
      </div>

      {/* Manual Entries History */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden mb-8">
        <div className="bg-gray-50/50 px-8 py-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-gray-800 leading-none">Recent Manual Entries</h3>
            <p className="text-xs text-gray-400 mt-1.5 font-bold uppercase tracking-widest">History of recorded revenue and salaries</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-gray-100">Date</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-gray-100">Type</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-gray-100">Branch</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-gray-100 text-right">Amount</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-gray-100 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.length > 0 ? records.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${rec.type === 'REVENUE' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'} flex items-center justify-center`}>
                        <Calendar size={14} />
                      </div>
                      <span className="text-sm font-black text-slate-700">{rec.month} {rec.year}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-tighter ${
                      rec.type === 'REVENUE' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {rec.type}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{rec.branch}</span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <span className={`text-sm font-black ${rec.type === 'REVENUE' ? 'text-blue-900' : 'text-orange-600'}`}>
                      BHD {parseFloat(rec.amount).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-center">
                    <button 
                      onClick={() => handleDeleteRecord(rec.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                      title="Delete Entry"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-8 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                    No manual records found for this branch
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
