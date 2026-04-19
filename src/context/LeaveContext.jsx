import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import API from '../api';

const LeaveContext = createContext(null);

export function LeaveProvider({ children }) {
  const [balances, setBalances] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const fetchLeavesAndBalances = useCallback(async () => {
    try {
      const [balRes, leavesRes] = await Promise.all([
        API.get('/leave-balance'),
        API.get('/leave-requests')
      ]);
      setBalances(balRes.data);
      setLeaves(leavesRes.data);
    } catch (err) {
      console.error('Error fetching leave context data:', err);
    }
  }, []);

  // Notifications
  const addNotification = useCallback((message, icon = 'Bell', color = 'text-primary') => {
    const newNotif = {
      id: Date.now(),
      text: message,
      time: 'Just now',
      icon,
      color
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const clearNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Balances
  const updateBalances = useCallback(async (employeeId, newBalanceData) => {
    try {
      await API.put(`/leave-balance/${employeeId}`, newBalanceData);
      await fetchLeavesAndBalances();
    } catch (err) {
      console.error('Failed to update balances:', err);
      throw err;
    }
  }, [fetchLeavesAndBalances]);

  const runMonthlyUpdate = useCallback(async () => {
    try {
      await API.post('/leave-balance/monthly-update');
      await fetchLeavesAndBalances();
      addNotification('Monthly leave balances updated successfully.', 'Calendar', 'text-emerald-500');
    } catch (err) {
      console.error('Failed to run monthly update:', err);
      throw err;
    }
  }, [addNotification, fetchLeavesAndBalances]);

  // Leaves
  const submitLeaveRequest = useCallback(async (request) => {
    try {
      await API.post('/leave-requests', request);
      await fetchLeavesAndBalances();
      addNotification('New leave request submitted successfully', 'ClipboardList', 'text-amber-500');
    } catch (err) {
      console.error('Failed to submit leave request:', err);
      throw err;
    }
  }, [addNotification, fetchLeavesAndBalances]);

  const approveLeaveRequest = useCallback(async (id, comment) => {
    try {
      await API.put(`/leave-requests/${id}/status`, { status: 'APPROVED', reviewNotes: comment });
      await fetchLeavesAndBalances();
      addNotification('Leave request approved', 'CheckCircle2', 'text-emerald-500');
      return { success: true };
    } catch (err) {
      console.error('Failed to approve leave request:', err);
      return { success: false, message: err.response?.data?.message || 'Failed to approve' };
    }
  }, [addNotification, fetchLeavesAndBalances]);

  const rejectLeaveRequest = useCallback(async (id, comment) => {
    try {
      await API.put(`/leave-requests/${id}/status`, { status: 'REJECTED', reviewNotes: comment });
      await fetchLeavesAndBalances();
      addNotification('Leave request rejected', 'XCircle', 'text-red-500');
      return { success: true };
    } catch (err) {
      console.error('Failed to reject leave request:', err);
      return { success: false, message: err.response?.data?.message || 'Failed to reject' };
    }
  }, [addNotification, fetchLeavesAndBalances]);

  const deleteLeaveRequest = useCallback(async (id) => {
    try {
      await API.delete(`/leave-requests/${id}`);
      await fetchLeavesAndBalances();
    } catch (err) {
      console.error('Failed to delete leave request:', err);
      throw err;
    }
  }, [fetchLeavesAndBalances]);

  const value = useMemo(() => ({
    balances,
    leaves,
    notifications,
    updateBalances,
    runMonthlyUpdate,
    submitLeaveRequest,
    approveLeaveRequest,
    rejectLeaveRequest,
    deleteLeaveRequest,
    clearNotification,
    setNotifications
  }), [balances, leaves, notifications, updateBalances, runMonthlyUpdate, submitLeaveRequest, approveLeaveRequest, rejectLeaveRequest, deleteLeaveRequest, clearNotification]);

  return (
    <LeaveContext.Provider value={value}>
      {children}
    </LeaveContext.Provider>
  );
}

export function useLeaveContext() {
  const context = useContext(LeaveContext);
  if (!context) {
    throw new Error('useLeaveContext must be used within a LeaveProvider');
  }
  return context;
}
