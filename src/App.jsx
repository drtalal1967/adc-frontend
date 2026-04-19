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
import FinancialAnalytics from './pages/FinancialAnalytics';
import WorkSchedule from './pages/WorkSchedule';
import Documents from './pages/Documents';

function ProtectedRoutes() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  return (
    <Layout>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/lab-cases" element={<LabCases />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/laboratories" element={<Laboratories />} />
        <Route path="/vendors" element={<Vendors />} />
        <Route path="/financials" element={<Financials />} />
        <Route path="/analytics" element={<FinancialAnalytics />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/leaves" element={<Leaves />} />
        <Route path="/leave-balance" element={<LeaveBalanceManagement />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/salaries" element={<Salaries />} />
        <Route path="/lab-payments" element={<LabPayments />} />
        <Route path="/work-schedule" element={<WorkSchedule />} />
        <Route path="/documents" element={<Documents />} />
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
