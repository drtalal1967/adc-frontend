import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LeaveProvider } from './context/LeaveContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';

// Page imports
import Dashboard from './pages/Dashboard';
import LabCases from './pages/LabCases';
import Expenses from './pages/Expenses';
import Laboratories from './pages/Laboratories';
import Vendors from './pages/Vendors';
import Financials from './pages/Financials';
import Employees from './pages/Employees';
import Schedule from './pages/Schedule';
import Leaves from './pages/Leaves';
import Reports from './pages/Reports';
import Reminders from './pages/Reminders';
import Settings from './pages/Settings';
import Salaries from './pages/Salaries';
import LabPayments from './pages/LabPayments';
import LeaveBalanceManagement from './pages/LeaveBalanceManagement';
import WorkSchedule from './pages/WorkSchedule';
import Documents from './pages/Documents';

const PAGE_MODULES = {
  '/dashboard': 'dashboard',
  '/lab-cases': 'lab_cases',
  '/expenses': 'expenses',
  '/laboratories': 'laboratories',
  '/vendors': 'vendors',
  '/financials': 'financials',
  '/employees': 'employees',
  '/schedule': 'schedule',
  '/leaves': 'leaves',
  '/leave-balance': 'leave_balance',
  '/reports': 'reports',
  '/reminders': 'reminders',
  '/settings': 'settings',
  '/salaries': 'salaries',
  '/lab-payments': 'payments',
  '/work-schedule': 'work_schedule',
  '/documents': 'documents',
};

function AccessDenied() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="max-w-md text-center bg-white border border-gray-100 rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900">Access denied</h1>
        <p className="text-sm text-gray-500 mt-2">Your role does not have permission to view this page.</p>
      </div>
    </div>
  );
}

function ProtectedPage({ module, children }) {
  const { checkPermission } = useAuth();
  return checkPermission(module, 'view') ? children : <AccessDenied />;
}

function ProtectedRoutes() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  const page = (path, element) => (
    <ProtectedPage module={PAGE_MODULES[path]}>
      {element}
    </ProtectedPage>
  );

  return (
    <Layout>
      <Routes>
        <Route path="/dashboard" element={page('/dashboard', <Dashboard />)} />
        <Route path="/lab-cases" element={page('/lab-cases', <LabCases />)} />
        <Route path="/expenses" element={page('/expenses', <Expenses />)} />
        <Route path="/laboratories" element={page('/laboratories', <Laboratories />)} />
        <Route path="/vendors" element={page('/vendors', <Vendors />)} />
        <Route path="/financials" element={page('/financials', <Financials />)} />
        <Route path="/analytics" element={<Navigate to="/financials" replace />} />
        <Route path="/employees" element={page('/employees', <Employees />)} />
        <Route path="/schedule" element={page('/schedule', <Schedule />)} />
        <Route path="/leaves" element={page('/leaves', <Leaves />)} />
        <Route path="/leave-balance" element={page('/leave-balance', <LeaveBalanceManagement />)} />
        <Route path="/reports" element={page('/reports', <Reports />)} />
        <Route path="/reminders" element={page('/reminders', <Reminders />)} />
        <Route path="/settings" element={page('/settings', <Settings />)} />
        <Route path="/salaries" element={page('/salaries', <Salaries />)} />
        <Route path="/lab-payments" element={page('/lab-payments', <LabPayments />)} />
        <Route path="/work-schedule" element={page('/work-schedule', <WorkSchedule />)} />
        <Route path="/documents" element={page('/documents', <Documents />)} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LeaveProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </BrowserRouter>
      </LeaveProvider>
    </AuthProvider>
  );
}
