// Shared mock data for the entire app
export const BRANCHES = ['Tubli Branch', 'Manama Branch'];

export const PROSTHESIS_TYPES = ['Crown', 'Bridge', 'Removable', 'Veneer', 'Night Guard', 'Inlay/Onlay'];

export const LABS = [
  { id: 1, name: 'Precision Dental Lab', phone: '+966-11-2345678', email: 'info@precisionlab.com' },
  { id: 2, name: 'SmileCraft Laboratory', phone: '+966-11-3456789', email: 'contact@smilecraft.com' },
  { id: 3, name: 'Al-Noor Dental Lab', phone: '+966-11-4567890', email: 'alnoor@lab.com' },
];

export const VENDORS = [
  { id: 1, name: 'MedSupply Co.', phone: '+966-11-1112233', email: 'orders@medsupply.com', category: 'Medical Supplies' },
  { id: 2, name: 'DentEquip Arabia', phone: '+966-11-2223344', email: 'sales@dentequip.com', category: 'Equipment' },
  { id: 3, name: 'CleanPro Services', phone: '+966-11-3334455', email: 'hello@cleanpro.com', category: 'Cleaning' },
  { id: 4, name: 'Gulf Medical', phone: '+966-11-4445566', email: 'supply@gulfmedical.com', category: 'Medical Supplies' },
];

export const EMPLOYEES = [
  { id: 1, name: 'Dr. Ahmed Al-Rashid', idNumber: 'SA-10012345', jobTitle: 'Chief Dentist', licenseExpiry: '2026-08-15', visaExpiry: 'N/A', workPermitExpiry: '2026-12-01', startDate: '2020-01-05', role: 'admin', phone: '+973-33445566', email: 'ahmed.rashid@dental.com' },
  { id: 2, name: 'Sarah Johnson', idNumber: 'SA-10023456', jobTitle: 'Clinic Manager', licenseExpiry: 'N/A', visaExpiry: '2025-12-01', workPermitExpiry: '2026-06-15', startDate: '2021-03-10', role: 'manager', phone: '+973-33556677', email: 'sarah.j@dental.com' },
  { id: 3, name: 'Fatima Hassan', idNumber: 'SA-10034567', jobTitle: 'Secretary', licenseExpiry: 'N/A', visaExpiry: '2026-05-15', workPermitExpiry: '2026-11-20', startDate: '2022-06-01', role: 'secretary', phone: '+973-33667788', email: 'fatima.h@dental.com' },
  { id: 4, name: 'Dr. Khalid Amir', idNumber: 'SA-10045678', jobTitle: 'Dentist', licenseExpiry: '2025-11-30', visaExpiry: '2026-01-20', workPermitExpiry: '2026-10-10', startDate: '2021-09-15', role: 'dentist', phone: '+973-33778899', email: 'khalid.a@dental.com' },
  { id: 5, name: 'Nora Al-Sayed', idNumber: 'SA-10056789', jobTitle: 'Dental Assistant', licenseExpiry: '2026-03-22', visaExpiry: 'N/A', workPermitExpiry: '2026-09-05', startDate: '2023-02-01', role: 'assistant', phone: '+973-33889900', email: 'nora.s@dental.com' },
  { id: 6, name: 'Omar Khalil', idNumber: 'SA-10067890', jobTitle: 'Accountant', licenseExpiry: 'N/A', visaExpiry: '2025-09-10', workPermitExpiry: '2026-08-20', startDate: '2022-11-01', role: 'accountant', phone: '+973-33990011', email: 'omar.k@dental.com' },
  { id: 7, name: 'Dr. Talal Al-Alawi', idNumber: 'SA-10078901', jobTitle: 'Dentist', licenseExpiry: '2026-12-15', visaExpiry: 'N/A', workPermitExpiry: '2027-01-15', startDate: '2020-05-10', role: 'dentist', phone: '+973-33001122', email: 'talal.al@dental.com' },
  { id: 8, name: 'Ma Cristina Azada', idNumber: 'SA-10089012', jobTitle: 'Dental Assistant', licenseExpiry: '2025-06-20', visaExpiry: '2025-10-15', workPermitExpiry: '2026-07-30', startDate: '2021-02-01', role: 'assistant', phone: '+973-33112233', email: 'mac.az@dental.com' },
];

export const LEAVE_BALANCES = [
  {
    employeeId: 7,
    employeeName: 'Dr. Talal Al-Alawi',
    annual: { total: 30, used: 0, remaining: 30 },
    sick: { total: 0, used: 0, remaining: 0 },
    relativesDeath: { total: 0, used: 0, remaining: 0 },
    hajj: { total: 0, used: 0, remaining: 0 },
    marriage: { total: 0, used: 0, remaining: 0 },
    others: { total: 0, used: 0, remaining: 0 },
  },
  {
    employeeId: 8,
    employeeName: 'Ma Cristina Azada',
    annual: { total: 30, used: 0, remaining: 30 },
    sick: { total: 15, used: 0, remaining: 15 },
    relativesDeath: { total: 0, used: 0, remaining: 0 },
    hajj: { total: 0, used: 0, remaining: 0 },
    marriage: { total: 0, used: 0, remaining: 0 },
    others: { total: 0, used: 0, remaining: 0 },
  },
  {
    employeeId: 1,
    employeeName: 'Dr. Ahmed Al-Rashid',
    annual: { total: 30, used: 5, remaining: 25 },
    sick: { total: 15, used: 2, remaining: 13 },
    relativesDeath: { total: 3, used: 0, remaining: 3 },
    hajj: { total: 30, used: 0, remaining: 30 },
    marriage: { total: 15, used: 0, remaining: 15 },
    others: { total: 5, used: 1, remaining: 4 },
  },
];

export const LAB_CASES = [
  { id: 1, patientNumber: 'PT-001', patientName: 'Mohammed Al-Zaidi', teethNumber: '21, 22', prosthesis: 'Crown', lab: 'Precision Dental Lab', status: 'In Lab', paymentStatus: 'Unpaid', branch: 'Tubli Branch', createdAt: '2026-03-01', pickupDate: '2026-03-03', deliveryDate: null, notes: 'Patient allergic to nickel. Use zirconia.', timeline: [{ status: 'Pending', date: '2026-03-01' }, { status: 'Picked Up', date: '2026-03-02' }, { status: 'In Lab', date: '2026-03-03' }] },
  { id: 2, patientNumber: 'PT-002', patientName: 'Lina Rahimi', teethNumber: '14', prosthesis: 'Bridge', lab: 'SmileCraft Laboratory', status: 'Picked Up', paymentStatus: 'Unpaid', branch: 'Tubli Branch', createdAt: '2026-03-02', pickupDate: '2026-03-04', deliveryDate: null, notes: '3-unit bridge.', timeline: [{ status: 'Pending', date: '2026-03-02' }, { status: 'Picked Up', date: '2026-03-04' }] },
  { id: 3, patientNumber: 'PT-003', patientName: 'Hassan Al-Faruq', teethNumber: '11, 12, 13', prosthesis: 'Veneer', lab: 'Al-Noor Dental Lab', status: 'Delivered', paymentStatus: 'Paid', branch: 'Manama Branch', createdAt: '2026-02-20', pickupDate: '2026-02-22', deliveryDate: '2026-03-01', notes: '', timeline: [{ status: 'Pending', date: '2026-02-20' }, { status: 'Picked Up', date: '2026-02-22' }, { status: 'In Lab', date: '2026-02-26' }, { status: 'Delivered', date: '2026-03-01' }] },
  { id: 4, patientNumber: 'PT-004', patientName: 'Sara Mansoor', teethNumber: '36', prosthesis: 'Inlay/Onlay', lab: 'Precision Dental Lab', status: 'Completed', paymentStatus: 'Paid', branch: 'Tubli Branch', createdAt: '2026-02-15', pickupDate: '2026-02-17', deliveryDate: '2026-02-25', notes: 'Inlay composite.', timeline: [{ status: 'Pending', date: '2026-02-15' }, { status: 'Picked Up', date: '2026-02-17' }, { status: 'In Lab', date: '2026-02-20' }, { status: 'Delivered', date: '2026-02-25' }, { status: 'Completed', date: '2026-02-28' }] },
  { id: 5, patientNumber: 'PT-005', patientName: 'Faisal Bin Sultan', teethNumber: 'Full upper', prosthesis: 'Removable', lab: 'SmileCraft Laboratory', status: 'Pending', paymentStatus: 'Unpaid', branch: 'Manama Branch', createdAt: '2026-03-05', pickupDate: null, deliveryDate: null, notes: 'Full denture upper arch.', timeline: [{ status: 'Pending', date: '2026-03-05' }] },
  { id: 6, patientNumber: 'PT-006', patientName: 'Noura Al-Tamimi', teethNumber: '46, 47', prosthesis: 'Crown', lab: 'Al-Noor Dental Lab', status: 'In Lab', paymentStatus: 'Unpaid', branch: 'Manama Branch', createdAt: '2026-03-07', pickupDate: '2026-03-09', deliveryDate: null, notes: '', timeline: [{ status: 'Pending', date: '2026-03-07' }, { status: 'Picked Up', date: '2026-03-09' }, { status: 'In Lab', date: '2026-03-11' }] },
  { id: 7, patientNumber: 'PT-007', patientName: 'Ali Kareem', teethNumber: '16', prosthesis: 'Night Guard', lab: 'Precision Dental Lab', status: 'Delivered', paymentStatus: 'Unpaid', branch: 'Tubli Branch', createdAt: '2026-03-08', pickupDate: '2026-03-10', deliveryDate: '2026-03-12', notes: 'Hard acrylic night guard.', timeline: [{ status: 'Pending', date: '2026-03-08' }, { status: 'Picked Up', date: '2026-03-10' }, { status: 'In Lab', date: '2026-03-11' }, { status: 'Delivered', date: '2026-03-12' }] },
];

export const EXPENSES = [
  { id: 1, date: '2026-03-01', vendorCategory: 'Medical Supplies', vendor: 'MedSupply Co.', invoiceNumber: 'INV-2026-001', amount: 4500, paymentStatus: 'Paid' },
  { id: 2, date: '2026-03-03', vendorCategory: 'Equipment', vendor: 'DentEquip Arabia', invoiceNumber: 'INV-2026-002', amount: 12000, paymentStatus: 'Unpaid' },
  { id: 3, date: '2026-03-05', vendorCategory: 'Cleaning', vendor: 'CleanPro Services', invoiceNumber: 'INV-2026-003', amount: 1800, paymentStatus: 'Paid' },
  { id: 4, date: '2026-03-08', vendorCategory: 'Medical Supplies', vendor: 'Gulf Medical', invoiceNumber: 'INV-2026-004', amount: 7200, paymentStatus: 'Unpaid' },
  { id: 5, date: '2026-03-10', vendorCategory: 'Equipment', vendor: 'DentEquip Arabia', invoiceNumber: 'INV-2026-005', amount: 3300, paymentStatus: 'Paid' },
];

export const LAB_PAYMENTS = [
  { 
    id: 1, 
    type: 'lab', 
    branch: 'tubli',
    reference: 'Precision Dental Lab', 
    labId: 1, 
    labName: 'Precision Dental Lab', 
    invoiceNumber: 'INV-224', 
    paymentDate: '2026-03-10', 
    totalAmount: 1500, 
    caseCount: 3, 
    attachment: null, 
    cases: [1, 4], 
    method: 'Cash', 
    status: 'Paid' 
  },
  { 
    id: 2, 
    type: 'lab', 
    branch: 'manama',
    reference: 'SmileCraft Laboratory', 
    labId: 2, 
    labName: 'SmileCraft Laboratory', 
    invoiceNumber: 'INV-885', 
    paymentDate: '2026-03-12', 
    totalAmount: 2800, 
    caseCount: 1, 
    attachment: null, 
    cases: [3], 
    method: 'Bank Transfer', 
    status: 'Paid' 
  },
  { 
    id: 3, 
    type: 'vendor', 
    branch: 'tubli',
    reference: 'MedSupply Co.', 
    vendorId: 1, 
    vendorName: 'MedSupply Co.', 
    invoiceNumber: 'INV-V-101', 
    paymentDate: '2026-03-15', 
    totalAmount: 450, 
    attachment: null, 
    method: 'Card', 
    status: 'Paid' 
  },
  { 
    id: 4, 
    type: 'vendor', 
    branch: 'manama',
    reference: 'DentEquip Arabia', 
    vendorId: 2, 
    vendorName: 'DentEquip Arabia', 
    invoiceNumber: 'INV-V-102', 
    paymentDate: '2026-03-18', 
    totalAmount: 1200, 
    attachment: null, 
    method: 'Cheque', 
    status: 'Pending' 
  },
];

export const LEAVE_REQUESTS = [
  { id: 1, employeeId: 3, employeeName: 'Fatima Hassan', role: 'Secretary', type: 'Annual', from: '2026-03-20', to: '2026-03-25', days: 6, reason: 'Family vacation', status: 'Pending' },
  { id: 2, employeeId: 4, employeeName: 'Dr. Khalid Amir', role: 'Dentist', type: 'Sick', from: '2026-03-15', to: '2026-03-16', days: 2, reason: 'Medical appointment', status: 'Approved' },
  { id: 3, employeeId: 5, employeeName: 'Nora Al-Sayed', role: 'Dental Assistant', type: 'Emergency', from: '2026-03-12', to: '2026-03-12', days: 1, reason: 'Family emergency', status: 'Approved' },
  { id: 4, employeeId: 2, employeeName: 'Sarah Johnson', role: 'Manager', type: 'Annual', from: '2026-04-01', to: '2026-04-07', days: 7, reason: 'Annual leave', status: 'Pending' },
];

export const SCHEDULES = [
  { id: 1, employeeId: 4, employeeName: 'Dr. Khalid Amir', date: '2026-03-14', startTime: '08:00', endTime: '16:00', branch: 'Manama Branch', status: 'Active' },
  { id: 2, employeeId: 5, employeeName: 'Nora Al-Sayed', date: '2026-03-14', startTime: '08:00', endTime: '16:00', branch: 'Tubli Branch', status: 'Active' },
  { id: 3, employeeId: 3, employeeName: 'Fatima Hassan', date: '2026-03-14', startTime: '09:00', endTime: '17:00', branch: 'Tubli Branch', status: 'On Leave' },
  { id: 4, employeeId: 4, employeeName: 'Dr. Khalid Amir', date: '2026-03-15', startTime: '08:00', endTime: '16:00', branch: 'Manama Branch', status: 'Active' },
  { id: 5, employeeId: 5, employeeName: 'Nora Al-Sayed', date: '2026-03-15', startTime: '10:00', endTime: '18:00', branch: 'Tubli Branch', status: 'Active' },
];

export const REVENUE_DATA = [
  { month: 'Apr', revenue: 28000, expenses: 17000, salaries: 8500, branch: 'Tubli Branch' },
  { month: 'Apr', revenue: 34000, expenses: 21000, salaries: 9500, branch: 'Manama Branch' },
  { month: 'May', revenue: 30000, expenses: 18500, salaries: 8500, branch: 'Tubli Branch' },
  { month: 'May', revenue: 35000, expenses: 21500, salaries: 9500, branch: 'Manama Branch' },
  { month: 'Jun', revenue: 32000, expenses: 19000, salaries: 8500, branch: 'Tubli Branch' },
  { month: 'Jun', revenue: 36000, expenses: 23000, salaries: 9500, branch: 'Manama Branch' },
  { month: 'Jul', revenue: 35000, expenses: 18000, salaries: 8500, branch: 'Tubli Branch' },
  { month: 'Jul', revenue: 40000, expenses: 21000, salaries: 9500, branch: 'Manama Branch' },
  { month: 'Aug', revenue: 38000, expenses: 24000, salaries: 8500, branch: 'Tubli Branch' },
  { month: 'Aug', revenue: 44000, expenses: 27000, salaries: 9500, branch: 'Manama Branch' },
  { month: 'Sep', revenue: 33000, expenses: 20000, salaries: 8750, branch: 'Tubli Branch' },
  { month: 'Sep', revenue: 38000, expenses: 24000, salaries: 9750, branch: 'Manama Branch' },
  { month: 'Oct', revenue: 42000, expenses: 22000, salaries: 8750, branch: 'Tubli Branch' },
  { month: 'Oct', revenue: 47000, expenses: 25000, salaries: 9750, branch: 'Manama Branch' },
  { month: 'Nov', revenue: 45000, expenses: 25000, salaries: 9000, branch: 'Tubli Branch' },
  { month: 'Nov', revenue: 49000, expenses: 27000, salaries: 10000, branch: 'Manama Branch' },
  { month: 'Dec', revenue: 46000, expenses: 22000, salaries: 9500, branch: 'Tubli Branch' },
  { month: 'Dec', revenue: 52000, expenses: 26000, salaries: 10500, branch: 'Manama Branch' },
  { month: 'Jan', revenue: 50000, expenses: 26000, salaries: 10000, branch: 'Tubli Branch' },
  { month: 'Jan', revenue: 55000, expenses: 29000, salaries: 11000, branch: 'Manama Branch' },
  { month: 'Feb', revenue: 54000, expenses: 27000, salaries: 10000, branch: 'Tubli Branch' },
  { month: 'Feb', revenue: 58000, expenses: 31000, salaries: 11000, branch: 'Manama Branch' },
  { month: 'Mar', revenue: 56000, expenses: 29000, salaries: 10500, branch: 'Tubli Branch' },
  { month: 'Mar', revenue: 62000, expenses: 33000, salaries: 11500, branch: 'Manama Branch' },
];

export const PAYMENT_METHODS = [
  { name: 'Cash', value: 65, color: '#1E3A8A' },
  { name: 'Bank Transfer', value: 35, color: '#F97316' },
];

export const PAYMENT_STATUS_DIST = [
  { name: 'Paid', value: 95, color: '#10B981' },
];

export const EXPENSE_CATEGORIES = [
  { name: 'Medical Supplies', value: 45, color: '#2F5D90' },
  { name: 'Equipment', value: 25, color: '#F58220' },
  { name: 'Cleaning', value: 10, color: '#78A4CF' },
  { name: 'Utilities', value: 12, color: '#10B981' },
  { name: 'Others', value: 8, color: '#F59E0B' },
];

export const PROSTHESIS_STATS = [
  { name: 'Crown', value: 38, color: '#2F5D90' },
  { name: 'Bridge', value: 22, color: '#F58220' },
  { name: 'Removable', value: 15, color: '#A5C3DF' },
  { name: 'Veneer', value: 14, color: '#10B981' },
  { name: 'Night Guard', value: 7, color: '#F59E0B' },
  { name: 'Inlay/Onlay', value: 4, color: '#EF4444' },
];

export const VENDOR_STATS = [
  { name: 'Medical Supplies', value: 45, color: '#2F5D90' },
  { name: 'Equipment', value: 30, color: '#F58220' },
  { name: 'Cleaning', value: 15, color: '#A5C3DF' },
  { name: 'Others', value: 10, color: '#10B981' },
];

// Role-based nav config (Main source for sidebar generation)
export const MASTER_NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', module: 'dashboard' },
  { label: 'Lab Cases', path: '/lab-cases', icon: 'FlaskConical', module: 'lab_cases' },
  { label: 'Expenses', path: '/expenses', icon: 'Receipt', module: 'expenses' },
  { label: 'Laboratories', path: '/laboratories', icon: 'Building2', module: 'laboratories' },
  { label: 'Vendors', path: '/vendors', icon: 'Store', module: 'vendors' },
  { label: 'Financials', path: '/financials', icon: 'Landmark', module: 'financials' },
  { label: 'Financial Analytics', path: '/analytics', icon: 'BarChart3', module: 'financials' },
  { label: 'All Payments', path: '/lab-payments', icon: 'CreditCard', module: 'payments' },
  { label: 'Employees', path: '/employees', icon: 'Users', module: 'employees' },
  { label: 'Schedule', path: '/schedule', icon: 'CalendarDays', module: 'schedule' },
  { label: 'Leave Requests', path: '/leaves', icon: 'ClipboardList', module: 'leaves' },
  { label: 'Leave Balance', path: '/leave-balance', icon: 'ShieldCheck', module: 'leave_balance' },
  { label: 'Reports', path: '/reports', icon: 'BarChart3', module: 'reports' },
  { label: 'Reminders', path: '/reminders', icon: 'Bell', module: 'reminders' },
  { label: 'Documents', path: '/documents', icon: 'FileText', module: 'documents' },
  { label: 'Work Schedule', path: '/work-schedule', icon: 'CalendarDays', module: 'work_schedule' },
];

export const ROLE_NAV = {
  admin: MASTER_NAV_ITEMS,
  manager: [
    { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', module: 'dashboard' },
    { label: 'Lab Cases', path: '/lab-cases', icon: 'FlaskConical', module: 'lab_cases' },
    { label: 'Expenses', path: '/expenses', icon: 'Receipt', module: 'expenses' },
    { label: 'Schedule', path: '/schedule', icon: 'CalendarDays', module: 'schedule' },
    { label: 'Leave Approvals', path: '/leaves', icon: 'ClipboardList', module: 'leaves' },
    { label: 'Leave Balance', path: '/leave-balance', icon: 'ShieldCheck', module: 'leave_balance' },
    { label: 'Reports', path: '/reports', icon: 'BarChart3', module: 'reports' },
    { label: 'All Payments', path: '/lab-payments', icon: 'CreditCard', module: 'payments' },
    { label: 'Work Schedule', path: '/work-schedule', icon: 'CalendarDays', module: 'work_schedule' },
    { label: 'Reminders', path: '/reminders', icon: 'Bell', module: 'reminders' },
    { label: 'Documents', path: '/documents', icon: 'FileText', module: 'documents' },
  ],
  secretary: [
    { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', module: 'dashboard' },
    { label: 'Lab Cases', path: '/lab-cases', icon: 'FlaskConical', module: 'lab_cases' },
    { label: 'Employees', path: '/employees', icon: 'Users', module: 'employees' },
    { label: 'Schedule', path: '/schedule', icon: 'CalendarDays', module: 'schedule' },
    { label: 'Leave Request', path: '/leaves', icon: 'ClipboardList', module: 'leaves' },
    { label: 'Work Schedule', path: '/work-schedule', icon: 'CalendarDays', module: 'schedule' },
    { label: 'Reminders', path: '/reminders', icon: 'Bell', module: 'reminders' },
    { label: 'Documents', path: '/documents', icon: 'FileText', module: 'documents' },
  ],
  dentist: [
    { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', module: 'dashboard' },
    { label: 'Lab Cases', path: '/lab-cases', icon: 'FlaskConical', module: 'lab_cases' },
    { label: 'Schedule', path: '/schedule', icon: 'CalendarDays', module: 'schedule' },
    { label: 'Leave Request', path: '/leaves', icon: 'ClipboardList', module: 'leaves' },
    { label: 'Work Schedule', path: '/work-schedule', icon: 'CalendarDays', module: 'schedule' },
    { label: 'Reminders', path: '/reminders', icon: 'Bell', module: 'reminders' },
  ],
  assistant: [
    { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', module: 'dashboard' },
    { label: 'Lab Cases', path: '/lab-cases', icon: 'FlaskConical', module: 'lab_cases' },
    { label: 'Schedule', path: '/schedule', icon: 'CalendarDays', module: 'schedule' },
    { label: 'Leave Request', path: '/leaves', icon: 'ClipboardList', module: 'leaves' },
    { label: 'Work Schedule', path: '/work-schedule', icon: 'CalendarDays', module: 'schedule' },
    { label: 'Reminders', path: '/reminders', icon: 'Bell', module: 'reminders' },
    { label: 'Documents', path: '/documents', icon: 'FileText', module: 'documents' },
  ],
  accountant: [
    { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', module: 'dashboard' },
    { label: 'Expenses', path: '/expenses', icon: 'Receipt', module: 'expenses' },
    { label: 'Financial Analytics', path: '/analytics', icon: 'BarChart3', module: 'financials' },
    { label: 'Reports', path: '/reports', icon: 'FileText', module: 'reports' },
    { label: 'All Payments', path: '/lab-payments', icon: 'CreditCard', module: 'payments' },
    { label: 'Work Schedule', path: '/work-schedule', icon: 'CalendarDays', module: 'schedule' },
    { label: 'Reminders', path: '/reminders', icon: 'Bell', module: 'reminders' },
  ],
};

// Role-Based Access Control (RBAC) Permissions Matrix
export const ROLE_PERMISSIONS = {
  admin: {
    dashboard: ['view', 'create', 'edit', 'delete', 'export'],
    labCases: ['view', 'create', 'edit', 'delete', 'export'],
    expenses: ['view', 'create', 'edit', 'delete', 'export'],
    laboratories: ['view', 'create', 'edit', 'delete', 'export'],
    vendors: ['view', 'create', 'edit', 'delete', 'export'],
    financials: ['view', 'create', 'edit', 'delete', 'export'],
    employees: ['view', 'create', 'edit', 'delete', 'export'],
    schedule: ['view', 'create', 'edit', 'delete', 'export'],
    leaves: ['view', 'create', 'edit', 'delete', 'export'],
    reports: ['view', 'create', 'edit', 'delete', 'export'],
    labPayments: ['view', 'create', 'edit', 'delete', 'export'],
    analytics: ['view', 'export'],
    reminders: ['view', 'create', 'edit', 'delete', 'export'],
    settings: ['view', 'create', 'edit', 'delete', 'export'],
  },
  manager: {
    dashboard: ['view', 'export'],
    labCases: ['view', 'create', 'edit', 'export'],
    expenses: ['view', 'create', 'edit', 'export'],
    laboratories: ['view'],
    vendors: ['view'],
    financials: ['view'],
    employees: ['view', 'edit'],
    schedule: ['view', 'create', 'edit'],
    leaves: ['view', 'create', 'edit'],
    reports: ['view', 'export'],
    labPayments: ['view'],
    reminders: ['view'],
    settings: ['view'],
  },
  secretary: {
    dashboard: ['view'],
    labCases: ['view'],
    employees: ['view'],
    schedule: ['view', 'create', 'edit'],
    leaves: ['view', 'create'],
    reminders: ['view'],
    settings: ['view'],
  },
  dentist: {
    dashboard: ['view'],
    labCases: ['view', 'edit'],
    schedule: ['view'],
    leaves: ['view', 'create'],
    reminders: ['view'],
    settings: ['view'],
  },
  assistant: {
    dashboard: ['view'],
    labCases: ['view'],
    schedule: ['view'],
    leaves: ['view', 'create'],
    reminders: ['view'],
    settings: ['view'],
  },
  accountant: {
    dashboard: ['view'],
    expenses: ['view', 'create', 'edit', 'export'],
    financials: ['view', 'export'],
    reports: ['view', 'export'],
    labPayments: ['view', 'create', 'edit', 'export'],
    analytics: ['view', 'export'],
    reminders: ['view'],
    settings: ['view'],
  },
};

// Centralized System Configuration
export const SYSTEM_CONFIG = {
  prosthesisTypes: ['Crown', 'Bridge', 'Removable', 'Veneer', 'Night Guard', 'Inlay/Onlay', 'Implant Crown'],
  vendorCategories: ['Materials', 'Service or Repair', 'Equipment', 'Groceries', 'Rent', 'Cleaning', 'Others'],
  expenseCategories: ['Medical Supplies', 'Equipment', 'Cleaning', 'Utilities', 'Salaries', 'Rent', 'Marketing', 'Others'],
};

// Reminder Configuration
export const REMINDER_SETTINGS = {
  licenseExpiry: { daysBefore: 30, notifyType: 'Email + In-App', active: true },
  visaExpiry: { daysBefore: 60, notifyType: 'Email + In-App', active: true },
  inventoryStock: { threshold: 10, notifyType: 'In-App', active: false },
};

// Subscription Info
export const SUBSCRIPTION_INFO = {
  plan: 'Enterprise Pro',
  expiryDate: '2027-03-31',
  monthlyRate: 249,
  history: [
    { id: 'INV-001', date: '2026-03-01', amount: 249, status: 'Paid' },
    { id: 'INV-002', date: '2026-02-01', amount: 249, status: 'Paid' },
    { id: 'INV-003', date: '2026-01-01', amount: 249, status: 'Paid' },
  ]
};
