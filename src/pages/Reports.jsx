import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { FileText, Download, Filter, BarChart3, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import API from '../api';
import jsPDF from 'jspdf';

// ─── PDF Helpers ──────────────────────────────────────────────────────────────

function drawHeader(doc, title, subtitle, color) {
  const [r, g, b] = color || [30, 58, 138];
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(17);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 17);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, 14, 24);
  doc.setTextColor(30, 41, 59);
}

function drawTable(doc, headers, rows, colWidths, startY, headerColor) {
  const [r, g, b] = headerColor || [30, 58, 138];
  const startX = 14;
  let y = startY;

  // Header row
  doc.setFillColor(r, g, b);
  doc.rect(startX, y - 6, 182, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  let x = startX + 2;
  headers.forEach((h, i) => { doc.text(h, x, y); x += colWidths[i]; });
  y += 6;

  // Data rows
  doc.setFont('helvetica', 'normal');
  rows.forEach((row, idx) => {
    if (y > 270) { doc.addPage(); y = 20; }
    if (idx % 2 === 0) {
      doc.setFillColor(241, 245, 249);
      doc.rect(startX, y - 5, 182, 7, 'F');
    }
    doc.setTextColor(30, 41, 59);
    x = startX + 2;
    row.forEach((val, i) => {
      doc.text(String(val ?? '—').slice(0, 30), x, y);
      x += colWidths[i];
    });
    y += 7;
  });
  return y;
}

// ─── 1. Monthly Revenue Report ────────────────────────────────────────────────
// ─── Component ─────────────────────────────────────────────────────────────────
export default function Reports() {
  const [data, setData] = useState({
    revenue: [],
    labCases: [],
    expenses: [],
    employees: [],
    prosthesis: []
  });
  const [loading, setLoading] = useState(true);

  // ─── PDF Generation Functions (Inside Component) ───────────────────────────

  const generateRevenueReport = () => {
    const doc = new jsPDF();
    drawHeader(doc, 'Monthly Revenue Report', 'Financial • March 2026  |  Generated: ' + new Date().toLocaleDateString(), [30, 58, 138]);

    const totalRev = data.revenue.reduce((a, r) => a + (r.revenue || 0), 0);
    const totalExp = data.revenue.reduce((a, r) => a + (r.expenses || 0) + (r.salaries || 0), 0);
    const netProfit = totalRev - totalExp;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Financial Summary', 14, 44);

    const summary = [
      ['Total Revenue (YTD)', `BHD ${totalRev.toLocaleString()}`],
      ['Total Expenses (YTD)', `BHD ${totalExp.toLocaleString()}`],
      ['Net Profit (YTD)', `BHD ${netProfit.toLocaleString()}`],
    ];
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let y = 54;
    summary.forEach(([label, val]) => {
      doc.text(label, 14, y);
      doc.text(val, 110, y);
      y += 9;
    });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Monthly Breakdown', 14, y + 8);

    const rows = data.revenue.map(r => {
      const total = (r.expenses || 0) + (r.salaries || 0);
      const profit = (r.revenue || 0) - total;
      return [r.month, (r.revenue || 0).toLocaleString(), total.toLocaleString(), profit.toLocaleString()];
    });

    drawTable(doc,
      ['Month', 'Revenue (BHD)', 'Expenses (BHD)', 'Profit (BHD)'],
      rows, [30, 52, 52, 48], y + 18, [30, 58, 138]
    );

    doc.save('monthly-revenue-report.pdf');
  };

  const generateLabReport = () => {
    const doc = new jsPDF();
    drawHeader(doc, 'Laboratory Case Analytics', 'Operational • Q1 2026  |  Generated: ' + new Date().toLocaleDateString(), [245, 130, 32]);

    const total = data.labCases.length;
    const delivered = data.labCases.filter(c => ['DELIVERED', 'COMPLETED'].includes(c.status)).length;
    const pending = data.labCases.filter(c => c.status === 'PENDING').length;
    const paid = data.labCases.filter(c => c.paymentStatus === 'PAID').length;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Case Summary', 14, 44);

    const summary = [
      ['Total Cases', String(total)],
      ['Delivered / Completed', String(delivered)],
      ['Pending', String(pending)],
      ['Paid Cases', String(paid)],
      ['Unpaid Cases', String(total - paid)],
    ];
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let y = 54;
    summary.forEach(([label, val]) => {
      doc.text(label, 14, y);
      doc.text(val, 110, y);
      y += 9;
    });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Case Details', 14, y + 8);

    const rows = data.labCases.map(c => [
      c.patientName, c.prosthesisType || 'Prosthesis', c.laboratory?.name || 'Lab',
      c.status, c.paymentStatus, c.branch || 'Main'
    ]);
    drawTable(doc,
      ['Patient', 'Type', 'Lab', 'Status', 'Payment', 'Branch'],
      rows, [40, 35, 35, 25, 25, 22], y + 18, [245, 130, 32]
    );

    doc.addPage();
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Prosthesis Volume Breakdown', 14, 20);
    const prosRows = data.prosthesis.map(p => [p.name, String(p.value), '—']);
    drawTable(doc, ['Type', 'Count', 'Share'], prosRows, [70, 50, 50], 30, [245, 130, 32]);

    doc.save('laboratory-case-analytics.pdf');
  };

  const generateEmployeeReport = () => {
    const doc = new jsPDF();
    drawHeader(doc, 'Employee Performance Report', 'HR • March 2026  |  Generated: ' + new Date().toLocaleDateString(), [16, 185, 129]);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Employee Overview', 14, 44);

    const summary = [
      ['Total Employees', String(data.employees.length)],
      ['Dentists', String(data.employees.filter(e => e.user?.role === 'DENTIST').length)],
      ['Assistants', String(data.employees.filter(e => e.user?.role === 'ASSISTANT').length)],
      ['Admin / Management', String(data.employees.filter(e => ['ADMIN','MANAGER','SECRETARY','ACCOUNTANT'].includes(e.user?.role)).length)],
    ];
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let y = 54;
    summary.forEach(([label, val]) => {
      doc.text(label, 14, y);
      doc.text(val, 110, y);
      y += 9;
    });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Employee Directory', 14, y + 8);

    const rows = data.employees.map(e => [
      `${e.firstName} ${e.lastName}`, e.jobTitle || 'Staff', e.user?.role || '',
      e.phone || '', e.joiningDate?.split('T')[0] || ''
    ]);
    drawTable(doc,
      ['Name', 'Job Title', 'Role', 'Phone', 'Start Date'],
      rows, [50, 38, 26, 36, 30], y + 18, [16, 185, 129]
    );

    doc.save('employee-performance-report.pdf');
  };

  const generateExpenseReport = () => {
    const doc = new jsPDF();
    drawHeader(doc, 'Expense Breakdown Report', 'Financial • March 2026  |  Generated: ' + new Date().toLocaleDateString(), [249, 115, 22]);

    const totalAmount = data.expenses.reduce((a, e) => a + parseFloat(e.amount || 0), 0);
    const paid = data.expenses.filter(e => e.paymentStatus === 'PAID').reduce((a, e) => a + parseFloat(e.amount || 0), 0);
    const unpaid = totalAmount - paid;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Expense Summary', 14, 44);

    const summary = [
      ['Total Expenses', `BHD ${totalAmount.toLocaleString()}`],
      ['Paid', `BHD ${paid.toLocaleString()}`],
      ['Outstanding / Unpaid', `BHD ${unpaid.toLocaleString()}`],
      ['Total Records', String(data.expenses.length)],
    ];
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let y = 54;
    summary.forEach(([label, val]) => {
      doc.text(label, 14, y);
      doc.text(val, 110, y);
      y += 9;
    });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Expense Records', 14, y + 8);

    const rows = data.expenses.map(e => [
      e.expenseDate?.split('T')[0], e.vendor?.name || 'Vendor', e.category || 'General',
      `#${e.invoiceNumber || 'N/A'}`, `BHD ${parseFloat(e.amount || 0).toLocaleString()}`, e.paymentStatus
    ]);
    drawTable(doc,
      ['Date', 'Vendor', 'Category', 'Invoice', 'Amount', 'Status'],
      rows, [22, 36, 30, 28, 28, 18], y + 18, [249, 115, 22]
    );

    doc.save('expense-breakdown-report.pdf');
  };

  const exportAllData = () => {
    const doc = new jsPDF();

    // Page 1 — Revenue
    drawHeader(doc, 'Complete Clinic Data Export', 'All Modules • ' + new Date().toLocaleDateString(), [30, 58, 138]);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('1. Financial Revenue Summary', 14, 42);

    const totalRev = data.revenue.reduce((a, r) => a + (r.revenue || 0), 0);
    const totalExp = data.revenue.reduce((a, r) => a + (r.expenses || 0) + (r.salaries || 0), 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Revenue (YTD): BHD ${totalRev.toLocaleString()}`, 14, 52);
    doc.text(`Total Expenses (YTD): BHD ${totalExp.toLocaleString()}`, 14, 60);
    doc.text(`Net Profit (YTD): BHD ${(totalRev - totalExp).toLocaleString()}`, 14, 68);

    // Page 2 — Employees
    doc.addPage();
    drawHeader(doc, 'Employee Directory', 'HR Data', [16, 185, 129]);
    doc.setTextColor(30, 41, 59);
    const empRows = data.employees.map(e => [`${e.firstName} ${e.lastName}`, e.jobTitle || '.', e.user?.role || '.', e.phone || '.']);
    drawTable(doc, ['Name', 'Job Title', 'Role', 'Phone'], empRows, [55, 42, 28, 45], 40, [16, 185, 129]);

    // Page 3 — Lab Cases
    doc.addPage();
    drawHeader(doc, 'Laboratory Cases', 'Operational Data', [245, 130, 32]);
    doc.setTextColor(30, 41, 59);
    const labRows = data.labCases.map(c => [c.patientName, c.prosthesisType || '.', c.status, c.paymentStatus, (c.branch || 'Main').replace(' Branch','')]);
    drawTable(doc, ['Patient', 'Type', 'Status', 'Payment', 'Branch'], labRows, [42, 28, 26, 24, 26], 40, [245, 130, 32]);

    // Page 4 — Expenses
    doc.addPage();
    drawHeader(doc, 'Expense Records', 'Financial Data', [249, 115, 22]);
    doc.setTextColor(30, 41, 59);
    const expRows = data.expenses.map(e => [e.expenseDate?.split('T')[0], e.vendor?.name || '.', e.category || '.', `BHD ${parseFloat(e.amount || 0).toLocaleString()}`, e.paymentStatus]);
    drawTable(doc, ['Date', 'Vendor', 'Category', 'Amount', 'Status'], expRows, [28, 40, 34, 34, 24], 40, [249, 115, 22]);

    doc.save('clinic-complete-data-export.pdf');
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [revRes, labRes, expRes, empRes, statsRes] = await Promise.all([
        API.get('/dashboard/analytics').catch(e => ({ data: { trends: [] } })),
        API.get('/lab-cases').catch(e => ({ data: [] })),
        API.get('/expenses').catch(e => ({ data: [] })),
        API.get('/employees').catch(e => ({ data: [] })),
        API.get('/dashboard/stats').catch(e => ({ data: { prosthesisDistribution: [] } }))
      ]);
      setData({
        revenue: revRes.data.trends || [],
        labCases: labRes.data,
        expenses: expRes.data,
        employees: empRes.data,
        prosthesis: statsRes.data.prosthesisDistribution.map(p => ({
          name: p.prosthesisType || 'Unknown',
          value: p._count.id
        }))
      });
    } catch (err) {
      console.error('Error fetching report data:', err);
    } finally {
      setLoading(false);
    }
  };

  const reports = [
    {
      title: 'Monthly Revenue Report',
      date: 'March 2026',
      type: 'Financial',
      icon: TrendingUp,
      color: 'text-primary',
      bg: 'bg-primary-50',
      onDownload: generateRevenueReport,
    },
    {
      title: 'Laboratory Case Analytics',
      date: 'Q1 2026',
      type: 'Operational',
      icon: BarChart3,
      color: 'text-secondary',
      bg: 'bg-orange-50',
      onDownload: generateLabReport,
    },
    {
      title: 'Employee Performance',
      date: 'March 2026',
      type: 'HR',
      icon: FileText,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
      onDownload: generateEmployeeReport,
    },
    {
      title: 'Expense Breakdown',
      date: 'March 2026',
      type: 'Financial',
      icon: PieChartIcon,
      color: 'text-secondary',
      bg: 'bg-orange-50',
      onDownload: generateExpenseReport,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title text-xl md:text-2xl">Reports &amp; Analytics</h1>
          <p className="section-subtitle text-xs md:text-sm">Generate and download clinic performance reports</p>
        </div>
        <button onClick={exportAllData} className="btn-primary w-full sm:w-auto justify-center py-2 text-sm">
          <Download size={15} /> Export All Data
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reports.map((report, i) => (
          <div key={i} className="card card-hover cursor-pointer group">
            <div className={`w-12 h-12 rounded-xl ${report.bg} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
              <report.icon size={24} className={report.color} />
            </div>
            <h3 className="font-semibold text-gray-800 text-sm mb-1">{report.title}</h3>
            <p className="text-xs text-gray-500 mb-4">{report.type} • {report.date}</p>
            <button
              onClick={report.onDownload}
              className="text-primary text-xs font-semibold flex items-center gap-1 hover:underline"
            >
              <Download size={12} /> Download PDF
            </button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-800">Operational Growth</h3>
            <button className="btn-ghost btn-sm text-xs"><Filter size={12} /> Filter</button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.revenue}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend verticalAlign="top" align="right" iconType="circle" />
              <Line type="monotone" dataKey="revenue" stroke="#2F5D90" strokeWidth={3} dot={{ r: 4, fill: '#2F5D90' }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="expenses" stroke="#F58220" strokeWidth={3} dot={{ r: 4, fill: '#F58220' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-800">Prosthesis Volume</h3>
            <button className="btn-ghost btn-sm text-xs"><Filter size={12} /> Filter</button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.prosthesis}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="value" fill="#2F5D90" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
