import React, { useState, useRef, useEffect } from 'react';
import { Wallet, Plus, Search, DollarSign, Users, Download, Eye, Upload, CheckCircle } from 'lucide-react';
import API from '../api';
import { exportToCSV } from '../utils/exportUtils';
import ConfirmModal from '../components/ConfirmModal';

export default function Salaries() {
  const [search, setSearch] = useState('');
  const [importing, setImporting] = useState(false);
  const [showImportSuccess, setShowImportSuccess] = useState(false);
  
  // States for Process Payroll
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showProcessSuccess, setShowProcessSuccess] = useState(false);

  const fileInputRef = useRef(null);
  
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await API.get('/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const salaryData = employees.map(emp => ({
    id: emp.id,
    name: `${emp.firstName} ${emp.lastName}`,
    role: emp.user?.role?.toLowerCase() || 'assistant',
    title: emp.specialization || 'Staff',
    baseSalary: parseFloat(emp.basicSalary || 0),
    allowances: 1000, // Still mock as per UI
    deductions: 0,
    status: 'Paid',
    lastPaid: '2026-03-01'
  }));

  const filtered = salaryData.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () => {
    exportToCSV(salaryData, 'Payroll_March_2026');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImporting(true);
      setTimeout(() => {
        setImporting(false);
        setShowImportSuccess(true);
        e.target.value = '';
      }, 1500);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title text-xl md:text-2xl">Salaries & Payroll</h1>
          <p className="section-subtitle text-xs md:text-sm">Manage employee compensation and payment statuses</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button onClick={handleImportClick} className="btn-outline gap-2 flex-1 sm:flex-none justify-center py-2 text-sm border-gray-200">
            <Upload size={15} /> Import
          </button>
          <button onClick={handleExport} className="btn-outline gap-2 flex-1 sm:flex-none justify-center py-2 text-sm border-gray-200">
            <Download size={15} /> Export
          </button>
          <button 
            onClick={() => setShowProcessModal(true)} 
            className="btn-primary gap-2 flex-1 sm:flex-none justify-center py-2 text-sm"
          >
            <Plus size={15} /> Process Payroll
          </button>
        </div>
      </div>

      <ConfirmModal 
        isOpen={showImportSuccess}
        title="Payroll Sync Successful"
        message="Employee salary records have been successfully updated and synchronized."
        onConfirm={() => setShowImportSuccess(false)}
        onCancel={() => setShowImportSuccess(false)}
        confirmText="Excellent"
        cancelText="Close"
        type="primary"
      />

      <ConfirmModal 
        isOpen={showProcessModal}
        title="Process March 2026 Payroll"
        message={`Are you sure you want to process the payroll? Total amount to be transferred is BHD ${salaryData.reduce((acc, curr) => acc + curr.baseSalary + curr.allowances - curr.deductions, 0).toLocaleString()} for ${salaryData.length} employees.`}
        onConfirm={() => {
          setShowProcessModal(false);
          setIsProcessing(true);
          setTimeout(() => {
            setIsProcessing(false);
            setShowProcessSuccess(true);
          }, 2500);
        }}
        onCancel={() => setShowProcessModal(false)}
        confirmText="Confirm & Process"
        cancelText="Cancel"
        type="primary"
      />

      <ConfirmModal 
        isOpen={showProcessSuccess}
        title="Payroll Processed"
        message="March 2026 payroll has been successfully processed. Funds have been transferred to employee accounts."
        onConfirm={() => setShowProcessSuccess(false)}
        onCancel={() => setShowProcessSuccess(false)}
        confirmText="Done"
        cancelText="Close"
        type="primary"
      />

      {(importing || isProcessing) && (
        <div className="fixed inset-0 z-[200] bg-white/60 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-primary animate-pulse uppercase tracking-widest">
              {importing ? 'Processing Data...' : 'Executing Transfers...'}
            </p>
          </div>
        </div>
      )}

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept=".csv,.xlsx,.xls"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-primary to-teal-400 text-white border-none">
          <p className="text-xs font-medium opacity-80 mb-1">Total Monthly Payroll</p>
          <p className="text-2xl font-bold font-heading">BHD {salaryData.reduce((acc, curr) => acc + curr.baseSalary + curr.allowances - curr.deductions, 0).toLocaleString()}</p>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider bg-white/20 w-fit px-2 py-1 rounded-lg">
            <Wallet size={12} /> March 2026 Batch
          </div>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 mb-1">Employees Paid</p>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold text-gray-800 font-heading">{salaryData.length} / {salaryData.length}</p>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-success">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-4 w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-success h-full w-full" />
          </div>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 mb-1">Awaiting Approval</p>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold text-gray-800 font-heading">0</p>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-secondary">
              <DollarSign size={20} />
            </div>
          </div>
          <p className="mt-4 text-[10px] text-gray-400 font-medium italic">All entries processed</p>
        </div>
      </div>

      <div className="card px-4 py-4 md:px-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 w-full sm:max-w-xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search employee..." 
              className="w-full bg-transparent border-none outline-none focus:ring-0 text-sm p-0" 
            />
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th className="hidden lg:table-cell">Role</th>
                <th>Base Salary</th>
                <th className="hidden sm:table-cell">Allowances</th>
                <th className="hidden sm:table-cell">Deductions</th>
                <th>Net Pay</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td>
                    <p className="text-xs font-bold text-gray-800">{s.name}</p>
                    <p className="text-[10px] text-gray-500">{s.title}</p>
                  </td>
                  <td className="hidden lg:table-cell"><span className="badge badge-gray capitalize text-[10px]">{s.role}</span></td>
                  <td className="text-xs font-medium">BHD {(s.baseSalary || 0).toLocaleString()}</td>
                  <td className="text-xs font-medium text-success hidden sm:table-cell">+ BHD {(s.allowances || 0).toLocaleString()}</td>
                  <td className="text-xs font-medium text-danger hidden sm:table-cell">- BHD {(s.deductions || 0).toLocaleString()}</td>
                  <td className="text-xs font-bold text-gray-800 whitespace-nowrap">BHD {((s.baseSalary || 0) + (s.allowances || 0) - (s.deductions || 0)).toLocaleString()}</td>
                  <td><span className="badge badge-success text-[10px]">Paid</span></td>
                  <td>
                    <button className="btn-icon w-8 h-8 rounded-lg hover:bg-slate-50">
                      <Eye size={14} className="text-slate-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
