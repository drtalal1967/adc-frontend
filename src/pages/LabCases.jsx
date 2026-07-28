import React, { useState, useRef, useEffect, useMemo } from 'react';
import { LAB_CASES, LABS } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { Search, Filter, Download, Eye, Edit2, Trash2, CheckCircle, FlaskConical, Plus, Calendar, MapPin, Hash, User, Activity, CreditCard, ChevronRight, Clock, Camera, Upload, X as CloseIcon, CheckCircle2, ArrowUpRight, ArrowDownLeft, Layers, FileText, FileSpreadsheet } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import ConfirmModal from '../components/ConfirmModal';
import FilePreviewModal from '../components/FilePreviewModal';
import { exportToCSV } from '../utils/exportUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import FileUpload from '../components/FileUpload';
import CategoryManagerModal from '../components/CategoryManagerModal';
import API, { BACKEND_URL } from '../api';
import PaginationControls from '../components/PaginationControls';

const formatBHD = (value) => Number(value || 0).toLocaleString(undefined, {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const getCaseDueAmount = (caseItem) => Math.max(
  0,
  parseFloat(caseItem?.totalCost || 0) - parseFloat(caseItem?.amountPaid || 0)
);

const normalizeFileUrl = (url = '') => (
  url && url.startsWith('http') ? url : (url ? `${BACKEND_URL}${url}` : '')
);

const normalizeAttachmentItem = (item) => {
  if (!item) return null;
  if (typeof item === 'string') {
    const fileUrl = normalizeFileUrl(item);
    return fileUrl ? { fileUrl, fileName: fileUrl.split('/').pop()?.split('?')[0] || 'Attachment' } : null;
  }

  const rawUrl = item.fileUrl || item.url || item.href || item.path || item.src || '';
  const fileUrl = normalizeFileUrl(rawUrl);
  if (!fileUrl) return null;

  return {
    ...item,
    fileUrl,
    fileName: item.fileName || item.name || item.title || fileUrl.split('/').pop()?.split('?')[0] || 'Attachment',
    fileType: item.fileType || item.type || ''
  };
};

const getAttachmentObjects = (...sources) => {
  const flattened = sources.flatMap(source => {
    if (!source) return [];
    return Array.isArray(source) ? source : [source];
  });

  const seen = new Set();
  return flattened
    .map(normalizeAttachmentItem)
    .filter(Boolean)
    .filter(item => {
      if (seen.has(item.fileUrl)) return false;
      seen.add(item.fileUrl);
      return true;
    });
};

const getCaseAttachmentObjects = (caseItem = {}) => getAttachmentObjects(
  caseItem.documents,
  caseItem.attachments,
  caseItem.images,
  caseItem.files,
  caseItem.documentUrls,
  caseItem.attachmentUrls,
  caseItem.fileUrl,
  caseItem.attachment
);

const getAttachmentLinks = (attachments = []) => (
  getAttachmentObjects(attachments).map(item => item.fileUrl)
);

const getAttachmentLabel = (index) => `Link ${index + 1}`;

const escapeExcelText = (value = '') => String(value).replace(/"/g, '""');

const setExcelLinkCell = (worksheet, cellRef, label, url) => {
  worksheet[cellRef] = {
    t: 's',
    v: label,
    f: `HYPERLINK("${escapeExcelText(url)}","${escapeExcelText(label)}")`,
    l: { Target: url, Tooltip: url },
    s: { font: { color: { rgb: '0563C1' }, underline: true } }
  };
};

const styleExcelHeader = (worksheet, headers = []) => {
  headers.forEach((_, columnIndex) => {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: columnIndex });
    if (worksheet[cellRef]) {
      worksheet[cellRef].s = {
        ...(worksheet[cellRef].s || {}),
        font: { ...(worksheet[cellRef].s?.font || {}), bold: true }
      };
    }
  });
};

const getPaymentAttachmentLinks = (payments = []) => (
  (Array.isArray(payments) ? payments : [])
    .flatMap(payment => [
      ...getAttachmentLinks(payment?.documents || []),
      ...getAttachmentLinks(payment?.originalData?.documents || []),
      ...getAttachmentLinks(payment?.attachment ? [payment.attachment] : [])
    ])
);

const uniqueLinks = (links = []) => Array.from(new Set(links.filter(Boolean)));

const getLabCasePaymentLinks = (record = {}, paymentRows = []) => {
  const recordId = Number(record.id);
  const linkedPayments = (Array.isArray(paymentRows) ? paymentRows : []).filter(payment => {
    const paymentLabCaseId = Number(
      payment?.labCaseId ||
      payment?.originalData?.labCaseId ||
      payment?.originalData?.labCase?.id ||
      payment?.labCase?.id
    );
    return recordId && paymentLabCaseId === recordId;
  });

  return uniqueLinks([
    ...getPaymentAttachmentLinks(record.payments),
    ...getPaymentAttachmentLinks(linkedPayments)
  ]);
};

const getCombinedAttachmentLinks = (record = {}, paymentRows = []) => ([
  ...getAttachmentLinks(record.images),
  ...getLabCasePaymentLinks(record, paymentRows)
]);

const getAttachmentText = (attachments = []) => {
  const links = getAttachmentLinks(attachments);
  return links.length ? links.map((_, index) => getAttachmentLabel(index)).join('\n') : '-';
};

const getCombinedAttachmentText = (record = {}, paymentRows = []) => {
  const fileLinks = getAttachmentLinks(record.images);
  const paymentLinks = getLabCasePaymentLinks(record, paymentRows);
  const labels = [
    ...fileLinks.map((_, index) => `File ${index + 1}`),
    ...paymentLinks.map((_, index) => `Pay ${index + 1}`)
  ];
  return labels.length ? labels.join('\n') : '-';
};

const A4_SIZE = [595.28, 841.89];

const fetchAttachmentBlob = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to fetch attachment: ${response.status}`);
  const blob = await response.blob();
  return {
    bytes: await blob.arrayBuffer(),
    type: blob.type || response.headers.get('content-type') || ''
  };
};

const drawFallbackAttachmentPage = async (pdfDoc, attachment, message = 'This attachment type cannot be embedded automatically.') => {
  const page = pdfDoc.addPage(A4_SIZE);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  page.drawText(attachment.title || 'Attachment', { x: 42, y: 790, size: 15, font: boldFont, color: rgb(0.08, 0.12, 0.2) });
  page.drawText(attachment.subtitle || '', { x: 42, y: 768, size: 9, font, color: rgb(0.42, 0.45, 0.5) });
  page.drawText(`${attachment.label}:`, { x: 42, y: 720, size: 12, font: boldFont, color: rgb(0.08, 0.12, 0.2) });
  page.drawText(message, { x: 42, y: 700, size: 10, font, color: rgb(0.42, 0.45, 0.5) });
  page.drawText(attachment.url, { x: 42, y: 678, size: 8, font, color: rgb(0.02, 0.24, 0.58), maxWidth: 510 });
};

const addAttachmentPage = async (pdfDoc, attachment) => {
  try {
    const { bytes, type } = await fetchAttachmentBlob(attachment.url);
    const isPdf = type.includes('pdf') || /\.pdf(\?|#|$)/i.test(attachment.url);
    const isPng = type.includes('png') || /\.png(\?|#|$)/i.test(attachment.url);
    const isJpg = type.includes('jpeg') || type.includes('jpg') || /\.jpe?g(\?|#|$)/i.test(attachment.url);

    if (isPdf) {
      const sourcePdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pages = await pdfDoc.copyPages(sourcePdf, sourcePdf.getPageIndices());
      pages.forEach(page => pdfDoc.addPage(page));
      return;
    }

    if (isPng || isJpg) {
      const image = isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
      const page = pdfDoc.addPage(A4_SIZE);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      page.drawText(attachment.title || 'Attachment', { x: 42, y: 790, size: 13, font: boldFont, color: rgb(0.08, 0.12, 0.2) });
      page.drawText(attachment.subtitle || '', { x: 42, y: 770, size: 9, font, color: rgb(0.42, 0.45, 0.5) });
      const maxWidth = A4_SIZE[0] - 84;
      const maxHeight = A4_SIZE[1] - 120;
      const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      page.drawImage(image, { x: (A4_SIZE[0] - width) / 2, y: 42, width, height });
      return;
    }

    await drawFallbackAttachmentPage(pdfDoc, attachment);
  } catch (error) {
    console.warn('Could not embed attachment, adding link instead:', error);
    await drawFallbackAttachmentPage(pdfDoc, attachment, 'This attachment could not be downloaded for embedding.');
  }
};

const savePdfDocument = async (pdfDoc, fileName) => {
  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

const LabLogo = ({ logoUrl, name }) => (
  <div className="w-11 h-11 rounded-xl bg-white border border-blue-100 flex items-center justify-center overflow-hidden text-blue-900 shadow-sm shrink-0">
    {logoUrl ? (
      <img src={logoUrl} alt={`${name || 'Laboratory'} logo`} className="w-full h-full object-contain p-1.5" />
    ) : (
      <FlaskConical size={18} />
    )}
  </div>
);

const normalizeWorkflowStatus = (status) => {
  const value = String(status || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  return value === 'COMPLETED' ? 'Completed' : 'Pending';
};

const getLatestLabMovement = (logs = []) => {
  const latest = (Array.isArray(logs) ? logs : [])
    .filter(log => ['PICKUP', 'DELIVERY'].includes(String(log?.type || log?.label || '').trim().toUpperCase()))
    .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0))[0];

  if (!latest) return null;

  const type = String(latest.type || latest.label || '').trim().toUpperCase() === 'PICKUP' ? 'Pickup' : 'Delivery';
  const createdAt = latest.createdAt || latest.date ? new Date(latest.createdAt || latest.date) : null;
  return {
    type,
    label: type,
    status: type === 'Pickup' ? 'Sent to Lab' : 'Received from Lab',
    date: createdAt && !Number.isNaN(createdAt.getTime())
      ? createdAt.toLocaleString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : '-'
  };
};

const localInputToIso = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};


function StatusBadge({ status }) {
  const map = {
    'Pending': 'bg-amber-50 text-amber-600 border-amber-100',
    'Completed': 'bg-teal-50 text-teal-600 border-teal-100',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] md:text-xs font-normal border ${map[status] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>
      {status}
    </span>
  );
}

function PayBadge({ status }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] md:text-xs font-normal border ${status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
      {status}
    </span>
  );
}

function LabCaseModal({
  caseItem,
  onClose,
  onSave,
  setPreviewFile,
  labs,
  dentists,
  customCategories,
  onManageCategories
}) {

  console.log("MODAL RECEIVED caseItem:", caseItem);
  const isEdit = !!caseItem;
  const [form, setForm] = useState({
  patientName: '',
  patientNumber: '',
  teethNumber: '',
  prosthesis: '',
  labId: labs[0]?.id || '',
  dentistId: dentists[0]?.id || '',
  status: 'Pending',
  paymentStatus: 'Unpaid',
  branch: 'Tubli Branch',
  createdAt: '',
  expectedDate: '',
  totalCost: 0,
  amountPaid: 0,
  images: [],
});

const toInputDate = (date) => {
  if (!date) return '';

  if (String(date).includes('T')) {
    return String(date).slice(0, 10);
  }

  if (String(date).includes('/')) {
    const [day, month, year] = String(date).split('/');
    return `${year}-${month}-${day}`;
  }

  return String(date).slice(0, 10);
};


useEffect(() => {
  if (!caseItem) return;

  setForm({
    patientName: caseItem.patientName ?? '',
    patientNumber: caseItem.patientNumber ?? '',
    teethNumber: caseItem.teethNumber ?? '',
    prosthesis: caseItem.prosthesis ?? '',
    labId: caseItem.labId ?? caseItem.laboratoryId ?? caseItem.laboratory?.id ?? '',
    dentistId: caseItem.dentistId ?? caseItem.dentist?.id ?? '',

    status: caseItem.status ?? 'Pending',
    paymentStatus: caseItem.paymentStatus ?? 'Unpaid',
    branch: caseItem.branch || 'Tubli Branch',

    createdAt: caseItem.createdAt
  ? toInputDate(caseItem.createdAt)
  : '',

    expectedDate: caseItem.expectedDate
  ? new Date(caseItem.expectedDate).toISOString().slice(0,16)
  : '',

    totalCost: Number(caseItem.totalCost) || 0,
    amountPaid: Number(caseItem.amountPaid) || 0,

    images: getCaseAttachmentObjects(caseItem).map(doc => doc.fileUrl),
  });

  const caseAttachments = getCaseAttachmentObjects(caseItem);
  setAttachmentDocs(caseAttachments);
  setImages(caseAttachments.map(doc => doc.fileUrl));

}, [caseItem]);


  // ✅ NEW FIELD
 
  const [images, setImages] = useState(form.images || []);
  const [attachmentDocs, setAttachmentDocs] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [logs, setLogs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loadingModalData, setLoadingModalData] = useState(false);

  useEffect(() => {
    if (caseItem?.id) {
      fetchModalData();
    }
  }, [caseItem?.id]);

  const fetchModalData = async () => {
    setLoadingModalData(true);
    try {
      const [logsRes, paymentsRes] = await Promise.all([
        API.get(`/lab-cases/${caseItem.id}/logs`),
        API.get(`/lab-cases/${caseItem.id}/payments`)
      ]);
      
      setLogs((logsRes.data || []).map(l => ({
        id: l.id,
        type: l.type,
        status: l.type === 'Pickup' ? 'SENT TO LAB' : l.type === 'Delivery' ? 'RECEIVED FROM LAB' : 'UPDATE',
        date: format(new Date(l.createdAt), 'MMM d, yyyy, h:mm a'),
        notes: l.note
      })));

      setPayments((paymentsRes.data || []).map(p => ({
        id: p.id,
        date: format(new Date(p.paymentDate), 'dd/MM/yyyy'),
        amount: parseFloat(p.amount) || 0,
        method: p.paymentMethod,
        status: 'Paid', // Assuming any record here is a payment made
        recordedBy: 'System'
      })));
    } catch (err) {
      console.error('Error fetching modal data:', err);
    } finally {
      setLoadingModalData(false);
    }
  };
  const [newLog, setNewLog] = useState({
    type: 'Pickup',
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    notes: ''
  });

  const handleAddLog = async () => {
    if (!newLog.date || !caseItem?.id) return;
    try {
      await API.post(`/lab-cases/${caseItem.id}/logs`, {
        type: newLog.type,
        note: newLog.notes,
        createdAt: localInputToIso(newLog.date)
      });
      
      // Refetch both modal data and parent list to show updated status
      await fetchModalData();
      if (onSave) {
        // This triggers a refetch in the parent component
        onSave({ ...form, id: caseItem.id, refreshOnly: true }); 
      }

      setNewLog({
        type: 'Pickup',
        date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        notes: ''
      });
    } catch (err) {
      console.error('Error adding log:', err);
      alert('Failed to add log entry');
    }
  };

  const handleDeleteLog = async (logId) => {
    if (!caseItem?.id || !logId) return;
    try {
      await API.delete(`/lab-cases/${caseItem.id}/logs/${logId}`);
      await fetchModalData();
      if (onSave) {
        onSave({ ...form, id: caseItem.id, refreshOnly: true });
      }
    } catch (err) {
      console.error('Error deleting log:', err);
      alert('Failed to delete log entry');
    }
  };

  const handleDeleteAttachment = async (attachment) => {
    if (!attachment) return;

    if (attachment.pending) {
      setAttachmentDocs(prev => prev.filter(item => item.tempId !== attachment.tempId));
      setImages(prev => prev.filter(url => url !== attachment.fileUrl));
      setPendingFiles(prev => prev.filter(file => file !== attachment.file));
      return;
    }

    if (!attachment.id || !caseItem?.id) {
      setAttachmentDocs(prev => prev.filter(item => item.fileUrl !== attachment.fileUrl));
      setImages(prev => prev.filter(url => url !== attachment.fileUrl));
      return;
    }

    if (!window.confirm('Delete this attachment from the lab case?')) return;

    try {
      await API.delete(`/lab-cases/${caseItem.id}/documents/${attachment.id}`);
      setAttachmentDocs(prev => prev.filter(item => item.id !== attachment.id));
      setImages(prev => prev.filter(url => url !== attachment.fileUrl));
      if (onSave) onSave({ ...form, id: caseItem.id, refreshOnly: true });
    } catch (err) {
      console.error('Error deleting lab case attachment:', err);
      alert(err?.response?.data?.message || 'Failed to delete attachment');
    }
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, images, logs, payments, pendingFiles });
  };

  const PROSTHESIS_TYPES = ["Crown", "Bridge", "Denture", "Implant", "Veneer", "Inlay/Onlay", "Night Guard", "Whitening Trays", "Other"];
  const ALL_TYPES = Array.from(new Set([...PROSTHESIS_TYPES, ...customCategories]));

  return (
    <div className="modal-overlay z-[100]" onClick={onClose}>
      <div className="modal-content max-w-2xl bg-white flex flex-col max-h-[95vh] overflow-hidden rounded-[2rem] shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between font-sans shrink-0">
          <h2 className="font-bold text-gray-900 text-2xl">{isEdit ? 'Edit Lab Case' : 'Create New Lab Case'}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl transition-all hover:bg-gray-50"><CloseIcon size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 font-sans scrollbar-hide space-y-10">
          {/* Main Form Section */}
          <div className="space-y-8 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block pl-1">Patient Number *</label>
                <input
                  required
                  value={form.patientNumber}
                  onChange={e => setForm({ ...form, patientNumber: e.target.value })}
                  placeholder="e.g. PT-001"
                  className="input w-full h-12 rounded-2xl border-gray-200 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block pl-1">Patient Name *</label>
                <input
                  required
                  value={form.patientName}
                  onChange={e => setForm({ ...form, patientName: e.target.value })}
                  placeholder="Enter name"
                  className="input w-full h-12 rounded-2xl border-gray-200 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-medium"
                />
              </div>


              <div className="space-y-2">
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

  {/* Creation Date */}
  <div className="space-y-2">
    <label className="text-xs font-bold text-gray-700 block pl-1">
      Creation Date *
    </label>

    <input
      type="date"
      value={form.createdAt || ''}
      onChange={e =>
        setForm({ ...form, createdAt: e.target.value })
      }
      className="input w-full h-12 rounded-2xl border-gray-200 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-medium"
    />
  </div>

  {/* Due Date */}
  <div className="space-y-2">
    <label className="text-xs font-bold text-gray-700 block pl-1">
      Due Date
    </label>

    <input
      type="datetime-local"
      value={form.expectedDate || ''}
      onChange={e =>
        setForm({ ...form, expectedDate: e.target.value })
      }
      className="input w-full h-12 rounded-2xl border-gray-200 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-medium"
    />
  </div>

</div>                
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block pl-1">Teeth Number</label>
                <input
                  value={form.teethNumber}
                  onChange={e => setForm({ ...form, teethNumber: e.target.value })}
                  placeholder="e.g. 11, 21"
                  className="input w-full h-12 rounded-2xl border-gray-200 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block pl-1">Branch *</label>
                <div className="relative">
                  <select 
                    value={form.branch} 
                    onChange={e => setForm({ ...form, branch: e.target.value })}
                    className="h-12 w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-3 pr-10 text-sm font-medium focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
                  >
                    <option value="Tubli Branch">Tubli Branch</option>
                    <option value="Manama Branch">Manama Branch</option>
                  </select>
                  <ChevronRight className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" size={18} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block pl-1">Dental Lab *</label>
                <div className="relative">
                  <select 
                    required
                    value={form.labId} 
                    onChange={e => setForm({ ...form, labId: e.target.value })}
                    className="h-12 w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-3 pr-10 text-sm font-medium focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
                  >
                    <option value="">Select Lab</option>
                    {labs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                  <ChevronRight className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" size={18} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block pl-1">Dentist *</label>
                <div className="relative">
                  <select 
                    required
                    value={form.dentistId} 
                    onChange={e => setForm({ ...form, dentistId: e.target.value })}
                    className="h-12 w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-3 pr-10 text-sm font-medium focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
                  >
                    <option value="">Select Dentist</option>
                    {dentists.map(d => <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>)}
                  </select>
                  <ChevronRight className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" size={18} />
                </div>
              </div>
              <div className="space-y-2">
  <div className="pl-1">
    <label className="text-xs font-bold text-gray-700 block">
      Prosthesis Type *
    </label>
  </div>

  <div className="relative">
  <select 
    value={form.prosthesis} 
    onChange={e => setForm({ ...form, prosthesis: e.target.value })}
    className="h-12 w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-3 pr-10 text-sm font-medium focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
  >
    <option value="">Select type</option>

    {ALL_TYPES.map(t => (
      <option key={t} value={t}>
        {t}
      </option>
    ))}
  </select>

  <ChevronRight
    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-90"
    size={18}
  />
</div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block pl-1">Case Status *</label>
                <div className="relative">
                  <select 
                    value={form.status} 
                    onChange={e => setForm({ ...form, status: e.target.value })}
                    className="h-12 w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-3 pr-10 text-sm font-medium focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
                  >
                    {['Pending', 'Completed'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronRight className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" size={18} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block pl-1">Total Cost (BHD)</label>
                <input
                  type="number"
                  step="0.001"
                  value={form.totalCost}
                  onChange={e => setForm({ ...form, totalCost: e.target.value })}
                  placeholder="0.000"
                  className="input w-full h-12 rounded-2xl border-gray-200 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-medium"
                />
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 block pl-1">Notes (Optional)</label>
              <textarea
                value={form.notes || ''}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Add any extra details or instructions..."
                rows="3"
                className="input w-full rounded-2xl border-gray-200 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-medium resize-none py-3"
              />
            </div>

            {/* Upload Section */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-gray-700 flex items-center gap-2 pl-1">
                <span className="text-orange-500">📎</span> Case Documents & Images
              </label>
              <div className="border-2 border-dashed border-gray-200 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center space-y-4 relative bg-gray-50/40 hover:bg-gray-50/60 transition-colors group">
                <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                  <Upload size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800 tracking-tight">Click to upload or drag and drop</p>
                  <p className="text-[11px] text-gray-400 mt-1 font-medium italic">image/*, application/pdf, .doc, .docx (Max 10MB per file)</p>
                  <p className="text-[11px] text-blue-600 font-bold mt-2 uppercase tracking-widest">{attachmentDocs.length} / 10 files uploaded</p>
                </div>
                <input 
                  type="file" 
                  multiple 
                  className="hidden" 
                  id="modal-file-upload" 
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    const newAttachments = files.map(file => ({
                      tempId: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
                      file,
                      fileUrl: URL.createObjectURL(file),
                      fileName: file.name,
                      fileType: file.type,
                      pending: true
                    }));
                    setPendingFiles(prev => [...prev, ...files]);
                    setAttachmentDocs(prev => [...prev, ...newAttachments]);
                    setImages(prev => [...prev, ...newAttachments.map(item => item.fileUrl)]);
                    e.target.value = ''; // Reset to allow re-uploading same file
                  }}
                />
                <label htmlFor="modal-file-upload" className="absolute inset-0 cursor-pointer" />
              </div>
              
              {/* Thumbnails display */}
              {attachmentDocs.length > 0 && (
                <div className="flex flex-wrap gap-3 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                  {attachmentDocs.map((attachment, i) => {
                    const img = attachment.fileUrl;
                    const ext = String(img).split('?')[0].split('.').pop()?.toLowerCase() || '';
                    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext) || String(img).startsWith('blob:');
                    return (
                      <div key={i} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-gray-200 shadow-sm animate-fade-in cursor-pointer" onClick={() => setPreviewFile(img)}>
                        {isImage ? (
                          <img src={img} alt="" className="w-full h-full object-cover hover:scale-110 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 gap-1 px-1 text-center">
                            <FileText size={24} className="text-primary" />
                            <span className="text-[9px] font-black text-gray-500 uppercase truncate max-w-full">{ext || 'file'}</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAttachment(attachment);
                          }}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                          <CloseIcon size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button type="submit" className="px-10 py-4 rounded-2xl font-bold bg-orange-500 hover:bg-orange-600 text-white transition-all shadow-xl shadow-orange-200 hover:shadow-orange-300 active:scale-95 flex items-center gap-2">
                Save Case
              </button>
            </div>
          </div>

          {isEdit && (
            <div className="space-y-10 border-t border-gray-100 pt-10 mt-6 text-left">
              {/* Case Logs & History */}
              <div className="space-y-8">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                     <Clock size={20} />
                   </div>
                   <h3 className="font-bold text-gray-900 text-xl tracking-tight">Case Logs & History</h3>
                 </div>

                 <div className="bg-gray-50/80 p-5 rounded-3xl border border-gray-100/50">
                   <p className="text-xs font-medium text-gray-500">Case created on <span className="text-gray-900 font-bold">
{caseItem.createdAt
  ? (() => {
      const parts = caseItem.createdAt.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        const d = new Date(`${year}-${month}-${day}`);
        return isNaN(d) ? 'N/A' : format(d, 'dd/MM/yyyy');
      }
      return 'N/A';
    })()
  : 'N/A'}
</span> for Dentist: <span className="text-orange-500 font-bold hover:underline cursor-pointer">{caseItem.dentistName || 'User'}</span></p>
                 </div>

                 <div className="space-y-4">
                    {logs.map(log => (
                      <div key={log.id} className="flex items-center justify-between p-5 rounded-[2rem] border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-center gap-5">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${log.type === 'Pickup' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                             {log.type === 'Pickup' ? <ArrowUpRight size={22} /> : <ArrowDownLeft size={22} />}
                           </div>
                           <div className="space-y-1">
                              <div className="flex items-center gap-3">
                                <p className="font-bold text-gray-900 text-base">{log.type}</p>
                                <span className="bg-gray-100 px-3 py-1 rounded-xl text-[10px] font-bold text-gray-500 uppercase tracking-wider border border-gray-200/50">{log.status}</span>
                              </div>
                              <p className="text-xs text-gray-400 font-medium">{log.date}</p>
                               {log.notes && (
                                 <p className="text-xs font-semibold text-gray-600 mt-2 bg-gray-50/50 p-2 rounded-lg border border-gray-100/50 italic">
                                   "{log.notes}"
                                 </p>
                               )}
                           </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => handleDeleteLog(log.id)}
                          className="p-2.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100 shadow-sm border border-transparent hover:border-rose-100"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                 </div>

                 {/* Add Log Form */}
                 <div className="bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="space-y-2">
                          <label className="text-[11px] font-black text-gray-600 uppercase tracking-widest pl-1">Type</label>
                          <div className="relative">
                            <select 
                              value={newLog.type}
                              onChange={e => setNewLog({ ...newLog, type: e.target.value })}
                              className="input h-12 py-0 text-sm w-full rounded-2xl appearance-none pr-10"
                            >
                              <option value="Pickup">Pickup</option>
                              <option value="Delivery">Delivery</option>
                            </select>
                            <ChevronRight className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" size={16} />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[11px] font-black text-gray-600 uppercase tracking-widest pl-1">Date & Time</label>
                          <input 
                            type="datetime-local" 
                            className="input h-12 py-0 text-sm w-full rounded-2xl" 
                            value={newLog.date}
                            onChange={e => setNewLog({ ...newLog, date: e.target.value })}
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[11px] font-black text-gray-600 uppercase tracking-widest pl-1">Notes</label>
                          <input 
                            placeholder="Optional notes..." 
                            className="input h-12 text-sm w-full rounded-2xl" 
                            value={newLog.notes}
                            onChange={e => setNewLog({ ...newLog, notes: e.target.value })}
                          />
                       </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={handleAddLog}
                      className="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-xl shadow-orange-200 transition-all active:scale-[0.98]"
                    >
                      Add Log Entry
                    </button>
                  </div>
              </div>

              {/* Payment History Section */}
              <div className="space-y-8">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                       <CreditCard size={20} />
                     </div>
                     <h3 className="font-bold text-gray-900 text-xl tracking-tight">Payment History</h3>
                   </div>
                 </div>

                 <div className="overflow-hidden border border-gray-100 rounded-[2rem] bg-white shadow-lg shadow-gray-50 overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="bg-gray-50/60">
                             {['Date', 'Amount', 'Method', 'Status', 'Recorded By'/*, 'Actions'*/].map(h => <th key={h} className="px-6 py-5 text-[11px] font-black text-gray-600 uppercase tracking-widest">{h}</th>)}
                          </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                      {(payments || []).map((p, i) => (
                         <tr key={i} className="hover:bg-gray-50/40 transition-colors group">
                           <td className="px-6 py-6 text-xs font-semibold text-gray-600 flex items-center gap-2">
                             <Calendar size={14} className="text-gray-300" />
                             {p.date}
                           </td>
                           <td className="px-6 py-6">
                             <div className="space-y-1">
                               <p className="font-bold text-gray-900 tracking-tight">BHD {formatBHD(p.amount)}</p>
                               <p className="text-[10px] text-gray-400 font-medium">Recorded on: {p.date}</p>
                             </div>
                           </td>
                           <td className="px-6 py-6">
                             <span className="px-3 py-1.5 rounded-xl bg-gray-50 text-[10px] font-bold text-gray-600 border border-gray-100">
                               {p.method}
                             </span>
                           </td>
                           <td className="px-6 py-6">
                             <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-wider ${p.status === 'Paid' ? 'bg-[#1C3756] text-white' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                               {p.status}
                             </span>
                           </td>
                           <td className="px-6 py-6">
                             <div className="flex items-center gap-2">
                               <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 border border-white shadow-sm">
                                 {p.recordedBy.charAt(0)}
                               </div>
                               <div>
                                 <p className="text-[11px] font-bold text-gray-700">{p.recordedBy}</p>
                                 <p className="text-[10px] text-gray-400 mt-0.5 italic">Batch payment.</p>
                               </div>
                             </div>
                           </td>
                           {/* <td className="px-6 py-6">
                             <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button type="button" title="Edit Payment" className="p-2 text-indigo-500 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100"><Edit2 size={14} /></button>
                               <button type="button" title="Delete Payment" className="p-2 text-rose-500 bg-rose-50/50 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"><Trash2 size={14} /></button>
                             </div>
                           </td> */}
                         </tr>
                       ))}
                     </tbody>
                    </table>
                 </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

function ViewModal({ caseItem, onClose, userRole, onUpdateStatus, setPreviewFile }) {
  if (!caseItem) return null;
  const currentWorkflowStatus = normalizeWorkflowStatus(caseItem.status);
  return (
    <div className="modal-overlay z-[100]" onClick={onClose}>
      <div className="modal-content max-w-lg bg-white overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-primary px-6 py-5 flex items-center justify-between text-white font-sans">
          <div className="flex items-center gap-3">
            <Eye size={20} />
            <h2 className="font-bold text-lg">Case Overview</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg">✕</button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto scrollbar-hide p-6 space-y-4 font-sans text-left">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
              {(caseItem.patientName || 'P').charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-gray-800">{caseItem.patientName}</h3>
              <p className="text-xs font-mono text-primary uppercase">{caseItem.patientNumber}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: 'Teeth No.', value: caseItem.teethNumber, icon: Activity },
              { label: 'Dentist', value: caseItem.dentistName, icon: User },
              { label: 'Total Cost', value: caseItem.totalCost ? `BHD ${formatBHD(caseItem.totalCost)}` : '�', icon: CreditCard },
              { label: 'Laboratory', value: caseItem.labName, logoUrl: caseItem.labLogoUrl, icon: FlaskConical },
              { label: 'Prosthesis', value: caseItem.prosthesis, icon: FlaskConical },
              { label: 'Created', value: caseItem.createdAt, icon: Calendar },
              { label: 'Sent', value: caseItem.sentDate || '—' },
{ label: 'Received', value: caseItem.receivedDate || '—' },

              ].map(item => (
              <div key={item.label} className="space-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{item.label}</span>
                <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                   {item.label === 'Laboratory' && <LabLogo logoUrl={item.logoUrl} name={item.value} />}
                   <span>{item.value}</span>
                </p>
              </div>
            ))}
          </div>

          <div className="pt-2 text-left">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Payment Status</span>
            <PayBadge status={caseItem.paymentStatus} />
          </div>

          <div className="space-y-3 pt-4 border-t border-gray-50 text-left">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Workflow Status</span>
            <div className="flex flex-wrap gap-2">
              {['Pending', 'Completed'].map(s => {
                const isAllowed = ['admin', 'manager'].includes(userRole) || 
                                 (userRole === 'secretary' && s === 'Pending') ||
                                 (userRole === 'assistant' && s === 'Pending') ||
                                 (userRole === 'dentist');
                const isCurrent = currentWorkflowStatus === s;
                return (
                  <button
                    key={s}
                    disabled={!isAllowed || isCurrent}
                    onClick={() => onUpdateStatus(caseItem.id, s)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${isCurrent ? 'bg-primary border-primary text-white shadow-md' : isAllowed ? 'bg-white border-gray-200 text-gray-600 hover:border-primary hover:text-primary cursor-pointer' : 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed opacity-50'}`}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
          </div>

          {caseItem.notes && (
            <div className="space-y-2 pt-4 border-t border-gray-50 text-left">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Notes</span>
              <p className="text-sm font-medium text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-xl border border-gray-100">{caseItem.notes}</p>
            </div>
          )}

          {caseItem.timeline && caseItem.timeline.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-gray-50 mt-4 text-left">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Case Timeline</span>
              <div className="space-y-3 pl-2">
                {caseItem.timeline.map((event, i) => (
                  <div key={i} className="relative pl-4 border-l-2 border-gray-100">
                    <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-primary ring-4 ring-white" />
                    <p className="text-sm font-bold text-gray-700 leading-tight">{event.status}</p>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">{event.date}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {caseItem.payments && caseItem.payments.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-gray-50 text-left">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Payment History ({caseItem.payments.length})</span>
              <div className="space-y-3">
                {caseItem.payments.map(payment => (
                  <div key={payment.id} className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Payment #{payment.id}</p>
                        <p className="text-lg font-black text-gray-900">BHD {formatBHD(payment.amount)}</p>
                      </div>
                      <span className="px-3 py-1 rounded-xl bg-white text-emerald-700 border border-emerald-100 text-[10px] font-black uppercase tracking-widest">
                        {payment.status || 'PAID'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-[9px] text-emerald-600 font-bold uppercase">Payment Date</p>
                        <p className="font-bold text-gray-700">{payment.paymentDate || '�'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-emerald-600 font-bold uppercase">Method</p>
                        <p className="font-bold text-gray-700 capitalize">{payment.paymentMethod || 'Cash'}</p>
                      </div>
                      {payment.referenceNumber && (
                        <div>
                          <p className="text-[9px] text-emerald-600 font-bold uppercase">Reference</p>
                          <p className="font-bold text-gray-700">{payment.referenceNumber}</p>
                        </div>
                      )}
                    </div>
                    {payment.notes && (
                      <div className="rounded-xl bg-white/70 border border-emerald-100 p-3">
                        <p className="text-[9px] text-emerald-600 font-bold uppercase mb-1">Notes</p>
                        <p className="text-xs font-medium text-gray-600 italic">{payment.notes}</p>
                      </div>
                    )}
                    {payment.documents && payment.documents.length > 0 && (
                      <div className="pt-2 border-t border-emerald-100/70">
                        <p className="text-[9px] text-emerald-600 font-bold uppercase mb-2">Payment Attachments ({payment.documents.length})</p>
                        <div className="flex flex-wrap gap-2">
                          {payment.documents.map((doc, i) => (
                            <button
                              key={doc.id || i}
                              type="button"
                              onClick={() => setPreviewFile(doc.fileUrl)}
                              className="px-3 py-2 rounded-xl bg-white border border-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center gap-2"
                            >
                              <FileText size={13} /> {doc.fileName || doc.title || `File ${i + 1}`}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {caseItem.images && caseItem.images.length > 0 && (
            <div className="space-y-2 pt-2 text-left">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Attachments ({caseItem.images.length})</span>
              <div className="flex gap-3 flex-wrap">
                {caseItem.images.map((url, i) => {
                  const ext = url.split('?')[0].split('.').pop().toLowerCase();
                  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
                  return (
                    <div
                      key={i}
                      className="relative group w-20 h-20 rounded-xl overflow-hidden border border-gray-100 shadow-sm transition-all hover:border-primary hover:shadow-md cursor-pointer"
                      onClick={() => setPreviewFile(url)}
                    >
                      {isImage ? (
                        <img src={url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 gap-1">
                          <FileText size={24} className="text-primary" />
                          <span className="text-[9px] font-bold text-gray-500 uppercase">{ext}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <Eye size={16} className="text-white" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end font-sans">
          <button onClick={onClose} className="btn-primary px-8 py-2 text-sm rounded-xl">Got it</button>
        </div>
      </div>
    </div>
  );
}

function BatchPaymentModal({ selectedCases, onClose, onSave }) {
  const totalPaid = selectedCases.reduce(
  (acc, item) => acc + parseFloat(item.amountPaid || 0),
  0
);

const totalCost = selectedCases.reduce(
  (acc, item) => acc + parseFloat(item.totalCost || 0),
  0
);
  const totalDue = totalCost - totalPaid;

  const [form, setForm] = useState({
    amount: totalDue.toFixed(3),
    method: 'Cash',
    notes: '',
    files: []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="modal-overlay z-[100]" onClick={onClose}>
      <div className="modal-content max-w-xl bg-white overflow-hidden rounded-[2rem] shadow-2xl flex flex-col max-h-[95vh]" onClick={e => e.stopPropagation()}>
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shadow-sm">
                <Layers size={24} />
             </div>
             <div>
                <h2 className="font-bold text-gray-900 text-2xl tracking-tight">Batch Payment</h2>
                <p className="text-xs text-gray-400 font-medium mt-0.5 tracking-wide uppercase">Processing payment for {selectedCases.length} selected items</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-50 transition-all"><CloseIcon size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 font-sans scrollbar-hide space-y-8 text-left">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100/50">
              <div className="space-y-1">
                 <p className="text-[11px] font-black text-gray-600 uppercase tracking-widest pl-1">Total Previously Paid</p>
                 <p className="text-2xl font-bold text-emerald-500 tracking-tight">BHD {formatBHD(totalPaid)}</p>
              </div>
              <div className="space-y-1 md:border-l border-gray-100 md:pl-6">
                 <p className="text-[11px] font-black text-gray-600 uppercase tracking-widest pl-1">Total Due for Selected</p>
                 <p className="text-2xl font-bold text-rose-500 tracking-tight">BHD {formatBHD(totalDue)}</p>
              </div>
           </div>

           <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-xs font-bold text-gray-800 block pl-1">Total Payment Amount (BHD) *</label>
                 <div className="relative">
                    <input 
                      required
                      type="number"
                      step="0.001"
                      value={form.amount}
                      onChange={e => setForm({ ...form, amount: e.target.value })}
                      className="input h-14 w-full rounded-2xl border-gray-200 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-gray-700"
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-bold text-gray-800 block pl-1">Payment Method *</label>
                 <div className="relative">
                    <select 
                      value={form.method}
                      onChange={e => setForm({ ...form, method: e.target.value })}
                      className="input h-14 w-full appearance-none rounded-2xl border-gray-200 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-gray-700 pr-10"
                    >
                       <option value="Cash">Cash</option>
                       <option value="Card">Card</option>
                       <option value="Bank Transfer">Bank Transfer</option>
                       <option value="Cheque">Cheque</option>
                    </select>
                    <ChevronRight className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" size={18} />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-bold text-gray-800 block pl-1">Notes (Optional)</label>
                 <textarea 
                   rows="3"
                   placeholder="Add any reference numbers or details..."
                   className="input py-4 w-full rounded-2xl border-gray-200 focus:ring-orange-500/20 focus:border-orange-500 text-sm"
                   value={form.notes}
                   onChange={e => setForm({ ...form, notes: e.target.value })}
                 />
              </div>

              <div className="space-y-4">
                 <label className="text-xs font-bold text-gray-800 block pl-1 flex items-center gap-2">
                    <span className="text-orange-500">📄</span> Batch Payment Documents & Receipts
                 </label>
                 <FileUpload
                   label="Upload Attachment"
                   value={form.files}
                   multiple={true}
                   onChange={(files) => setForm(prev => ({ ...prev, files: Array.isArray(files) ? files : [files] }))}
                   accept="image/*,application/pdf"
                 />
                 <p className="text-[10px] text-gray-400 italic text-center">These files will be attached to all payment records created in this batch.</p>
              </div>
           </div>

           <div className="flex justify-end pt-4">
              <button type="submit" className="w-full py-5 rounded-[2rem] bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-xl shadow-orange-200 transition-all active:scale-95 flex items-center justify-center gap-2 text-lg">
                 Process Batch Payment
              </button>
           </div>
        </form>
      </div>
    </div>
  );
}


export default function LabCases() {
  const { user, checkPermission } = useAuth();
  const navigate = useNavigate();
  const [viewItem, setViewItem] = useState(null);
  const [modal, setModal] = useState(null); // 'add' or 'edit'
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedIDs, setSelectedIDs] = useState([]);
  const [editItem, setEditItem] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [cases, setCases] = useState([]);
  const [labs, setLabs] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [paymentRows, setPaymentRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [payFilter, setPayFilter] = useState('All');
  const [branchFilter, setBranchFilter] = useState('All');
  const [dentistFilter, setDentistFilter] = useState('All');
  const [labFilter, setLabFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('createdDesc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [quickLogBusy, setQuickLogBusy] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // id of case to delete
  const [importing, setImporting] = useState(false);
  const [showImportSuccess, setShowImportSuccess] = useState(false);
  const [showCatManager, setShowCatManager] = useState(false);
  const [customProsthesisCategories, setCustomProsthesisCategories] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchData();
    fetchCustomCategories();
  }, []);

  const fetchCustomCategories = React.useCallback(async () => {
    try {
      const res = await API.get('/categories?module=LAB_CASES');
      setCustomProsthesisCategories(res.data.map(c => c.name));
    } catch (err) {
      console.error('Error fetching prosthesis categories:', err);
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Use individual try-catch for each API to ensure one failure doesn't block others
      let casesRes = { data: [] };
      let labsRes = { data: [] };
      let dentistsRes = { data: [] };
      let paymentsRes = { data: [] };

      try {
        casesRes = await API.get('/lab-cases');
      } catch (err) {
        console.error('Fetch LabCases Error:', err.response?.data || err.message);
      }

      try {
        labsRes = await API.get('/labs');
      } catch (err) {
        console.warn('Fetch Labs Error (ignoring):', err.message);
      }

      try {
        dentistsRes = await API.get('/employees/dentists');
      } catch (err) {
        console.warn('Fetch Dentists Error (ignoring):', err.message);
      }

      try {
        paymentsRes = await API.get('/payments/all');
      } catch (err) {
        console.warn('Fetch Payments Error (ignoring):', err.message);
      }

      const formattedCases = (casesRes.data || []).map(c => ({
  ...c,
  id: c.id,
  patientName: c.patientName,
  patientNumber: c.patientNumber,
  teethNumber: c.toothNumbers || '',
  prosthesis: c.prosthesisType,
  labId: c.labId || c.laboratoryId,
  labName: c.laboratory?.name || 'Unknown Lab',
  labLogoUrl: c.laboratory?.logoUrl || '',
  dentistId: c.dentistId,
  dentistName: c.dentist
    ? `${c.dentist.firstName} ${c.dentist.lastName}`
    : 'Unknown Dentist',

  // ✅ KEEP formatted version ONLY
  status: formatStatus(c.status),
  paymentStatus: formatPaymentStatus(c.paymentStatus),

  totalCost: c.cost,

  // ✅ FIXED (only once)
  createdAt: c.createdAt
    ? new Date(c.createdAt).toLocaleDateString('en-GB')
    : '',

  sentDate: c.sentDate
    ? new Date(c.sentDate).toLocaleDateString('en-GB')
    : '',

  receivedDate: c.receivedDate
    ? new Date(c.receivedDate).toLocaleDateString('en-GB')
    : '',

  // ✅ NEW FIELD (correct)
  expectedDate: c.expectedDate
  ? new Date(c.expectedDate).toISOString().slice(0,16)
  : '',

  branch: c.branch || 'Tubli Branch',

  images: getCaseAttachmentObjects(c).map(doc => doc.fileUrl),
  attachmentDocuments: getCaseAttachmentObjects(c),
  lastLabMovement: getLatestLabMovement([
    ...(c.lastLabMovement ? [c.lastLabMovement] : []),
    ...(c.logs || []),
    ...(c.caseLogs || [])
  ]),
  timeline: (c.logs || []).map(log => ({
    date: log.createdAt ? new Date(log.createdAt).toLocaleString('en-GB') : '',
    status: log.type === 'Pickup' ? 'Sent to Lab' : log.type === 'Delivery' ? 'Received from Lab' : log.type,
    note: log.note || ''
  }))
}));
      
      setCases(formattedCases);
      setLabs(labsRes.data);
      setDentists(dentistsRes.data);
      setPaymentRows(paymentsRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatStatus = (status) => {
    const map = {
      'PENDING': 'Pending',
      'PICKED_UP': 'Picked Up',
      'IN_LAB': 'In Lab',
      'DELIVERED': 'Delivered',
      'COMPLETED': 'Completed'
    };
    return map[status] || 'Pending';
  };

  const formatPaymentStatus = (status) => {
    const map = {
      'PAID': 'Paid',
      'PARTIAL': 'Partial',
      'PENDING': 'Unpaid'
    };
    return map[status] || 'Unpaid';
  };

  const apiStatusMap = {
    'Pending': 'PENDING',
    'Picked Up': 'PICKED_UP',
    'In Lab': 'IN_LAB',
    'Delivered': 'DELIVERED',
    'Completed': 'COMPLETED'
  };
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'add') {
      setModal('add');
      navigate('/lab-cases', { replace: true });
    }
  }, [location, navigate]);

  const statuses = ['All', 'Pending', 'Completed'];
  const payStatuses = ['All', 'Paid', 'Unpaid'];

  const filtered = cases.filter(c => {
  const matchSearch = !search || (c.patientName || '').toLowerCase().includes(search.toLowerCase()) || (c.patientNumber || '').toLowerCase().includes(search.toLowerCase());
  const matchStatus = statusFilter === 'All' || c.status === statusFilter;
  const matchPay = payFilter === 'All' || c.paymentStatus === payFilter;
  const matchBranch = branchFilter === 'All' || c.branch === branchFilter;

  // ✅ NEW
  const matchDentist = dentistFilter === 'All' || c.dentistName === dentistFilter;
  const matchLab = labFilter === 'All' || c.labName === labFilter;

  // ✅ Convert everything to real Date objects
// ✅ SAFE date parsing for DD/MM/YYYY
// ✅ KEEP THIS ONLY
const parseDate = (dateStr) => {
  if (!dateStr) return null;
  if (dateStr.includes('-')) return new Date(dateStr);
  const [day, month, year] = dateStr.split('/');
  return new Date(`${year}-${month}-${day}`);
};

const caseDate = parseDate(c.createdAt);

const from = dateFrom ? new Date(dateFrom) : null;
const to = dateTo
  ? new Date(new Date(dateTo).setHours(23, 59, 59, 999))
  : null;

// ✅ Apply filters
const matchDateFrom = !from || (caseDate && caseDate >= from);
const matchDateTo = !to || (caseDate && caseDate <= to);

  return matchSearch && matchStatus && matchPay && matchBranch && matchDentist && matchLab && matchDateFrom && matchDateTo;
}).sort((a, b) => {
  const parseSortDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    const str = String(value);
    if (str.includes('/')) {
      const [day, month, year] = str.split('/');
      return new Date(`${year}-${month}-${day}`);
    }
    const parsed = new Date(str);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const field = sortBy.startsWith('due') ? 'expectedDate' : 'createdAt';
  const direction = sortBy.endsWith('Asc') ? 1 : -1;
  const aDate = parseSortDate(a[field]);
  const bDate = parseSortDate(b[field]);
  const aTime = aDate?.getTime();
  const bTime = bDate?.getTime();
  const aMissing = !Number.isFinite(aTime);
  const bMissing = !Number.isFinite(bTime);

  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;
  if (bMissing) return -1;
  return direction * (aTime - bTime);
});

const selectedTotal = cases
  .filter(c => selectedIDs.includes(c.id))
  .reduce((sum, c) => sum + getCaseDueAmount(c), 0);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, payFilter, branchFilter, dentistFilter, labFilter, dateFrom, dateTo, sortBy]);

const paginated = useMemo(() => {
  const start = (page - 1) * pageSize;
  return filtered.slice(start, start + pageSize);
}, [filtered, page, pageSize]);

  const canEdit = ['admin', 'manager', 'secretary'].includes(user?.role);
  const canMarkPaid = ['admin', 'manager', 'accountant'].includes(user?.role);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await API.put(`/lab-cases/${id}`, { status: apiStatusMap[newStatus] });
      fetchData();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleQuickLog = async (caseItem, type) => {
    if (!caseItem?.id || quickLogBusy) return;
    const key = `${caseItem.id}-${type}`;
    setQuickLogBusy(key);
    try {
      await API.post(`/lab-cases/${caseItem.id}/logs`, {
        type,
        note: `${type} recorded from Lab Cases list`,
        createdAt: new Date().toISOString()
      });
      await fetchData();
    } catch (err) {
      console.error(`Error adding ${type} log:`, err);
      alert(`Failed to save ${type} log`);
    } finally {
      setQuickLogBusy(null);
    }
  };

  const handleSave = async (form) => {
  if (form.refreshOnly) {
    await fetchData();
    return;
  }

console.log("FORM DATA:", form);
  console.log("DUE DATE VALUE:", form.expectedDate);

  
  try {

  const payload = {
  patientName: form.patientName,
  patientNumber: form.patientNumber,
  toothNumbers: String(form.teethNumber),
  prosthesisType: form.prosthesis,
  labId: form.labId ? parseInt(form.labId) : undefined,
  dentistId: form.dentistId ? parseInt(form.dentistId) : undefined,
  status: apiStatusMap[form.status] || String(form.status || 'Pending').toUpperCase().replace(/\s+/g, '_'),
  cost: parseFloat(form.totalCost) || 0,
  expectedDate: form.expectedDate || null,
  branch: form.branch || 'Tubli Branch',
};

// ✅ RIGHT PLACE (outside the object)
console.log("SENDING PAYLOAD:", payload);

let savedId = editItem?.id;
if (editItem) {
  await API.put(`/lab-cases/${editItem.id}`, payload);
} else {
  const res = await API.post('/lab-cases', payload);
  savedId = res.data?.id;
}

if (form.pendingFiles && form.pendingFiles.length > 0 && savedId) {
  for (const file of form.pendingFiles) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', file.name || 'Lab Case Attachment');
    fd.append('category', 'Lab Case');
    fd.append('labCaseId', savedId);
    await API.post(`/lab-cases/${savedId}/documents`, fd);
  }
}

    // ✅ CLOSE MODAL AFTER SAVE
    setModal(null);
    setEditItem(null);
    fetchData();

  } catch (err) {
    console.error("SAVE ERROR:", err);
    alert(err?.response?.data?.message || err.message);
  }
};

  const markPaid = (id) => {
    setCases(prev => prev.map(c => c.id === id ? { ...c, paymentStatus: 'Paid' } : c));
  };

  const deleteCase = async () => {
    if (confirmDelete) {
      try {
        await API.delete(`/lab-cases/${confirmDelete}`);
        fetchData();
        setConfirmDelete(null);
        setSelectedIDs(prev => prev.filter(id => id !== confirmDelete));
      } catch (err) {
        console.error('Error deleting lab case:', err);
      }
    }
  };

  const toggleSelect = (id) => {
    setSelectedIDs(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    const allFilteredIDs = filtered.map(c => c.id);
    if (selectedIDs.length === allFilteredIDs.length) {
      setSelectedIDs([]);
    } else {
      setSelectedIDs(allFilteredIDs);
    }
  };

  const handleBatchSave = async (paymentData) => {
    try {
      const res = await API.post('/payments/batch', {
        caseIds: selectedIDs,
        amount: parseFloat(paymentData.amount),
        method: paymentData.method,
        notes: paymentData.notes
      });

      // Upload documents and link to each created payment
      const createdPayments = Array.isArray(res.data) ? res.data : [];
      if (paymentData.files && paymentData.files.length > 0 && createdPayments.length > 0) {
        for (const payment of createdPayments) {
          for (const fileObj of paymentData.files) {
            const file = fileObj.file;
            if (!file) continue;
            const fd = new FormData();
            fd.append('file', file);
            fd.append('title', fileObj.name || file.name);
            fd.append('category', 'Payment');
            fd.append('paymentId', payment.id.toString());
            await API.post('/documents/upload', fd);
          }
        }
      }

      fetchData();
      setShowBatchModal(false);
      setSelectedIDs([]);
    } catch (err) {
      console.error('Error processing batch payment:', err);
      alert('Failed to process batch payment');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImporting(true);
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          
          if (data && data.length > 0) {
            const formatted = data
              .filter(row => row.patientName || row.PatientName || row.name || row.Name)
              .map((item, index) => ({
                id: Date.now() + index,
                patientNumber: item.patientNumber || item.PatientNumber || `PT-${Date.now()}`,
                patientName: item.patientName || item.PatientName || item.name || item.Name || 'Unknown Patient',
                teethNumber: item.teethNumber || item.Teeth || '',
                prosthesis: item.prosthesis || item.Prosthesis || 'Crown',
                lab: item.lab || item.Lab || LABS[0]?.name || '',
                labId: item.labId || LABS[0]?.id || '',
                status: item.status || item.Status || 'Pending',
                paymentStatus: item.paymentStatus || item.Payment || 'Unpaid',
                branch: item.branch || item.Branch || 'Tubli Branch',
                totalCost: item.totalCost || item.Cost || '',
                createdAt: item.createdAt || item.Date || format(new Date(), 'dd-mm-yyyy'),
                images: []
              }));
            setCases(prev => [...formatted, ...prev]);
          }
        } catch(err) {
          console.error('Error importing Excel file:', err);
        } finally {
          setImporting(false);
          setShowImportSuccess(true);
          e.target.value = '';
        }
      };
      reader.onerror = () => {
        setImporting(false);
        e.target.value = '';
      };
      reader.readAsBinaryString(file);
    }
  };

  const handleExportExcel = () => {
    const maxAttachments = Math.max(0, ...filtered.map(c => getAttachmentLinks(c.images).length));
    const maxPaymentAttachments = Math.max(0, ...filtered.map(c => getLabCasePaymentLinks(c, paymentRows).length));
    const attachmentHeaders = Array.from({ length: maxAttachments }, (_, index) => `File ${index + 1}`);
    const paymentAttachmentHeaders = Array.from({ length: maxPaymentAttachments }, (_, index) => `Pay ${index + 1}`);
    const headers = [
      'Case Number',
      'Patient Name',
      'Teeth Number',
      'Prosthesis Type',
      'Dental Lab',
      'Branch',
      'Dentist',
      'Status',
      'Payment Status',
      'Total Cost (BHD)',
      'Amount Paid (BHD)',
      'Due Amount (BHD)',
      'Created Date',
      'Expected Date',
      ...attachmentHeaders,
      ...paymentAttachmentHeaders,
    ];
    const rows = filtered.map(c => {
      const links = getAttachmentLinks(c.images);
      const paymentLinks = getLabCasePaymentLinks(c, paymentRows);
      return [
        c.patientNumber,
        c.patientName,
        c.teethNumber,
        c.prosthesis,
        c.laboratory?.name || c.labName || c.lab || 'Unknown Lab',
        c.branch,
        c.dentist?.name || c.dentistName || c.dentist || 'Unknown',
        c.status,
        c.paymentStatus,
        formatBHD(c.totalCost),
        formatBHD(c.amountPaid),
        formatBHD(getCaseDueAmount(c)),
        c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-GB') : '',
        c.expectedDate ? new Date(c.expectedDate).toLocaleDateString('en-GB') : '',
        ...attachmentHeaders.map((_, index) => links[index] ? `File ${index + 1}` : ''),
        ...paymentAttachmentHeaders.map((_, index) => paymentLinks[index] ? `Pay ${index + 1}` : ''),
      ];
    });
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    filtered.forEach((c, rowIndex) => {
      const links = getAttachmentLinks(c.images);
      links.forEach((url, linkIndex) => {
        const cellRef = XLSX.utils.encode_cell({ r: rowIndex + 1, c: 14 + linkIndex });
        setExcelLinkCell(worksheet, cellRef, `File ${linkIndex + 1}`, url);
      });
      const paymentLinks = getLabCasePaymentLinks(c, paymentRows);
      paymentLinks.forEach((url, linkIndex) => {
        const cellRef = XLSX.utils.encode_cell({ r: rowIndex + 1, c: 14 + attachmentHeaders.length + linkIndex });
        setExcelLinkCell(worksheet, cellRef, `Pay ${linkIndex + 1}`, url);
      });
    });
    styleExcelHeader(worksheet, headers);
    worksheet['!cols'] = headers.map(header => ({ wch: header.startsWith('File') || header.startsWith('Pay') ? 12 : 18 }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Lab Cases');
    XLSX.writeFile(workbook, `Lab_Cases_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

const handleExportPDF = () => {

  const doc = new jsPDF('landscape');   // ✅ FIRST LINE

  // Title
  doc.setFontSize(18);
  doc.text('Lab Cases Report', 14, 22);

  // Filters
  const dentistText = dentistFilter !== 'All' ? dentistFilter : 'All Dentists';
  const fromText = dateFrom || 'Any';
  const toText = dateTo || 'Any';

  doc.setFontSize(11);
  doc.text(`Dentist: ${dentistText}`, 14, 32);
  doc.text(`Date Range: ${fromText} → ${toText}`, 14, 38);

  // Table
const totalAmount = filtered.reduce((sum, c) => {
  const amount = getCaseDueAmount(c);
  return sum + amount;
}, 0);
  autoTable(doc, {
  startY: 50,

  head: [[
    'Patient No',
    'Patient Name',
    'Lab',
    'Prosthesis',
    'Status',
    'Due Date',
    'Amount',
    'Payment',
    'Attachments'
  ]],

  body: filtered.map(c => [
    c.patientNumber || '-',       
    c.patientName || '-',         
    c.labName || '-',       
    c.prosthesis || '-',
    c.status || '-',
    c.expectedDate || '-',
    formatBHD(getCaseDueAmount(c)),
    c.paymentStatus || '-',
    getCombinedAttachmentText(c, paymentRows)
  ]),

  // ✅ ADD THIS FOOTER
  foot: [[
    '',
    '',
    '',
    '',
    '',
    'TOTAL',
    formatBHD(totalAmount),
    '',
    ''
  ]],
  margin: { left: 8, right: 8 },
  tableWidth: 'auto',
  styles: { fontSize: 7, cellPadding: 1.4, overflow: 'linebreak', valign: 'top' },
  headStyles: { fontSize: 7, fillColor: [28, 55, 86], textColor: 255 },
  columnStyles: {
    0: { cellWidth: 20 },
    1: { cellWidth: 34 },
    2: { cellWidth: 30 },
    3: { cellWidth: 25 },
    4: { cellWidth: 22 },
    5: { cellWidth: 25 },
    6: { cellWidth: 20, halign: 'right' },
    7: { cellWidth: 20 },
    8: { cellWidth: 85, textColor: [255, 255, 255] },
  },
  didParseCell: (data) => {
    if (data.section !== 'body' || data.column.index !== 8) return;
    const labCase = filtered[data.row.index];
    const linkCount = getCombinedAttachmentLinks(labCase, paymentRows).length;
    data.cell.text = [];
    data.cell.styles.minCellHeight = Math.max(data.cell.styles.minCellHeight || 0, linkCount ? 4 + (linkCount * 4) : 7);
  },
  didDrawCell: (data) => {
    if (data.section !== 'body' || data.column.index !== 8) return;
    const labCase = filtered[data.row.index];
    const links = getCombinedAttachmentLinks(labCase, paymentRows);
    if (!links.length) {
      doc.setTextColor(80, 80, 80);
      doc.text('-', data.cell.x + 1.4, data.cell.y + 4);
      return;
    }
    doc.setFontSize(7);
    const fileCount = getAttachmentLinks(labCase?.images).length;
    links.forEach((url, index) => {
      const y = data.cell.y + 3.8 + (index * 3.6);
      if (y < data.cell.y + data.cell.height - 1) {
        doc.setTextColor(5, 99, 193);
        const label = index < fileCount ? `File ${index + 1}` : `Pay ${index - fileCount + 1}`;
        doc.textWithLink(label, data.cell.x + 1.4, y, { url });
      }
    });
  }
});

  doc.save('lab-cases.pdf');
};

const handleExportAttachmentsPDF = async () => {
  const records = selectedIDs.length
    ? filtered.filter(item => selectedIDs.includes(item.id))
    : filtered;

  const attachments = records.flatMap(record => {
    const fileLinks = getAttachmentLinks(record.images).map((url, index) => ({
      url,
      label: `File ${index + 1}`,
      title: record.patientName || 'Lab Case',
      subtitle: `${record.patientNumber || 'No patient number'} - ${record.labName || 'Unknown Lab'}`
    }));
    const paymentLinks = getLabCasePaymentLinks(record, paymentRows).map((url, index) => ({
      url,
      label: `Pay ${index + 1}`,
      title: record.patientName || 'Lab Case',
      subtitle: `Payment attachment - ${record.patientNumber || 'No patient number'}`
    }));
    return [...fileLinks, ...paymentLinks];
  });

  if (!attachments.length) {
    alert('No attachments found for the selected/filtered lab cases.');
    return;
  }

  const pdfDoc = await PDFDocument.create();
  for (const attachment of attachments) {
    await addAttachmentPage(pdfDoc, attachment);
  }
  await savePdfDocument(pdfDoc, `lab_case_attachments_${new Date().toISOString().split('T')[0]}.pdf`);
};

  return (
    <div className="space-y-6 animate-fade-in text-left font-sans">
      {viewItem && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 overflow-y-auto max-h-[90vh]">

      <ViewModal
        caseItem={viewItem}
        onClose={() => setViewItem(null)}
        userRole={user?.role}
        onUpdateStatus={handleUpdateStatus}
        setPreviewFile={setPreviewFile}
      />

    </div>
  </div>
)}
   {modal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4">
      <LabCaseModal
        caseItem={editItem}
        onClose={() => {
          setModal(null);
          setEditItem(null);
        }}
        onSave={handleSave}
        labs={labs}
        dentists={dentists}
        customCategories={customProsthesisCategories}
        onManageCategories={() => setShowCatManager(true)}
      />
    </div>
  </div>
)}
      {showBatchModal && (
  <BatchPaymentModal
    selectedCases={cases.filter(c => selectedIDs.includes(c.id))}
    onClose={() => setShowBatchModal(false)}
    onSave={handleBatchSave}
  />
)}
      {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
      
      {loading && (
        <div className="fixed inset-0 z-[200] bg-white/60 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-primary animate-pulse uppercase tracking-widest">Loading Lab Cases...</p>
          </div>
        </div>
      )}
      
      <ConfirmModal 
        isOpen={!!confirmDelete}
        title="Delete Lab Case?"
        message="Are you sure you want to remove this medical case? This action cannot be undone."
        onConfirm={deleteCase}
        onCancel={() => setConfirmDelete(null)}
        confirmText="Yes, Delete"
      />

      <ConfirmModal 
        isOpen={showImportSuccess}
        title="Import Successful"
        message="Laboratory cases have been successfully imported and registered in the clinical workflow."
        onConfirm={() => setShowImportSuccess(false)}
        confirmText="Perfect"
        showCancel={false}
      />

      {importing && (
        <div className="fixed inset-0 z-[200] bg-white/60 backdrop-blur-sm flex items-center justify-center text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-primary animate-pulse uppercase tracking-widest">Importing Medical Cases...</p>
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

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h1 className="section-title text-xl md:text-2xl font-bold text-gray-900 font-heading">Lab Cases</h1>
          <p className="text-gray-500 text-xs md:text-sm mt-0.5">Track dental prosthesis cases and deliveries</p>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
           <select 
             value={branchFilter}
             onChange={e => setBranchFilter(e.target.value)}
             className="w-full sm:w-auto flex-1 md:flex-none btn-ghost border border-gray-200 text-xs font-semibold py-2 px-3 sm:px-4 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1em_1em] bg-[right_0.5rem_center] md:bg-[right_0.75rem_center] bg-no-repeat pr-8 sm:pr-10 min-w-0"
           >
              <option value="All">All Branches</option>
              <option value="Tubli Branch">Tubli Branch</option>
              <option value="Manama Branch">Manama Branch</option>
           </select>
          <div className="flex gap-3 w-full sm:w-auto">

  {/* Excel Button */}
  <button 
    onClick={handleExportExcel}
    className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-4 h-11 rounded-xl btn-export-excel text-xs font-bold shadow-md transition-all active:scale-95"
  >
    <FileSpreadsheet size={14} /> Excel
  </button>

  {/* PDF Button */}
  <button 
    onClick={handleExportPDF}
    className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-4 h-11 rounded-xl btn-export-pdf text-xs font-bold shadow-md transition-all active:scale-95"
  >
    <FileText size={14} /> PDF
  </button>
  <button
    onClick={handleExportAttachmentsPDF}
    className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-4 h-11 rounded-xl btn-export-pdf text-xs font-bold shadow-md transition-all active:scale-95"
  >
    <FileText size={14} /> Attachments PDF
  </button>

</div>
        </div>
      </div>

      {/* Filters & Actions Card */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/20 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50/50 rounded-full -mr-12 -mt-12 blur-2xl opacity-40" />
        <div className="flex items-center gap-2 mb-4 pl-1 relative z-10">
           <div className="w-1.5 h-4 bg-orange-500 rounded-full" />
           <h3 className="text-base font-bold text-gray-900 font-heading tracking-tight">Filters & Actions</h3>
        </div>
        <div className="flex flex-col lg:flex-row gap-3 relative z-10 w-full">
          <div className="flex-1 relative text-left group min-w-0 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={16} />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by patient name or number..." 
              className="w-full pl-10 h-11 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 transition-all border outline-none text-xs font-medium min-w-0" 
            />
          </div>
          <div className="flex flex-col sm:flex-row lg:flex gap-3 w-full lg:w-auto shrink-0 min-w-0">
            <div className="relative w-full sm:w-1/2 lg:w-auto min-w-0">
              <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)}
                className="h-11 w-full lg:min-w-[140px] appearance-none bg-gray-50/50 border border-gray-100 rounded-xl px-3 pr-8 text-[11px] font-bold text-gray-600 focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 outline-none transition-all cursor-pointer min-w-0"
              >
                <option value="All">All Status</option>
                {statuses.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" size={14} />
            </div>
            <div className="relative w-full sm:w-1/2 lg:w-auto min-w-0">
              <select 
                value={payFilter} 
                onChange={e => setPayFilter(e.target.value)}
                className="h-11 w-full lg:min-w-[140px] appearance-none bg-gray-50/50 border border-gray-100 rounded-xl px-3 pr-8 text-[11px] font-bold text-gray-600 focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 outline-none transition-all cursor-pointer min-w-0"
              >
                <option value="All">All Payment</option>
                {payStatuses.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" size={14} />
            </div>
{/* Dentist Filter */}
<div className="relative w-full sm:w-1/2 lg:w-auto min-w-0">
  <select 
    value={dentistFilter} 
    onChange={e => setDentistFilter(e.target.value)}
    className="h-11 w-full lg:min-w-[140px] appearance-none bg-gray-50/50 border border-gray-100 rounded-xl px-3 pr-8 text-[11px] font-bold text-gray-600"
  >
    <option value="All">All Dentists</option>
    {dentists.map(d => (
      <option key={d.id} value={`${d.firstName} ${d.lastName}`}>
        {d.firstName} {d.lastName}
      </option>
    ))}
  </select>
  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" size={14} />
</div>

{/* Lab Filter */}
<div className="relative w-full sm:w-1/2 lg:w-auto min-w-0">
  <select 
    value={labFilter} 
    onChange={e => setLabFilter(e.target.value)}
    className="h-11 w-full lg:min-w-[140px] appearance-none bg-gray-50/50 border border-gray-100 rounded-xl px-3 pr-8 text-[11px] font-bold text-gray-600"
  >
    <option value="All">All Labs</option>
    {labs.map(l => (
      <option key={l.id} value={l.name}>
        {l.name}
      </option>
    ))}
  </select>
  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" size={14} />
</div>
{/* Sort Filter */}
<div className="relative w-full sm:w-1/2 lg:w-auto min-w-0">
  <select
    value={sortBy}
    onChange={e => setSortBy(e.target.value)}
    className="h-11 w-full lg:min-w-[160px] appearance-none bg-gray-50/50 border border-gray-100 rounded-xl px-3 pr-8 text-[11px] font-bold text-gray-600 focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 outline-none transition-all cursor-pointer min-w-0"
  >
    <option value="createdDesc">Created Newest</option>
    <option value="createdAsc">Created Oldest</option>
    <option value="dueAsc">Due Soonest</option>
    <option value="dueDesc">Due Latest</option>
  </select>
  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" size={14} />
</div>
            {/* Date Range with Clarity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full lg:w-auto">
              <div className="relative group min-w-0">
                <span className="absolute -top-3 left-2 text-[8px] font-black text-gray-400 uppercase tracking-widest bg-white rounded-sm px-1.5 z-10 border border-gray-100/50">From</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="h-11 w-full lg:min-w-[130px] bg-gray-50/50 border border-gray-100 rounded-xl px-3 text-[11px] font-bold text-gray-600 focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 outline-none transition-all cursor-pointer min-w-0 shadow-inner"
                />
              </div>
              <div className="relative group min-w-0">
                <span className="absolute -top-3 left-2 text-[8px] font-black text-gray-400 uppercase tracking-widest bg-white rounded-sm px-1.5 z-10 border border-gray-100/50">To</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="h-11 w-full lg:min-w-[130px] bg-gray-50/50 border border-gray-100 rounded-xl px-3 text-[11px] font-bold text-gray-600 focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 outline-none transition-all cursor-pointer min-w-0 shadow-inner"
                />
              </div>
            </div>
            {/* Clear Filters */}
            {(statusFilter !== 'All' || payFilter !== 'All' || branchFilter !== 'All' || dentistFilter !== 'All' || labFilter !== 'All' || dateFrom || dateTo) && (
              <button
                onClick={() => { 
  setStatusFilter('All'); 
  setPayFilter('All'); 
  setBranchFilter('All'); 
  setDentistFilter('All');   // ✅ ADD THIS
  setLabFilter('All');       // ✅ ADD THIS
  setDateFrom(''); 
  setDateTo(''); 
}}
                className="h-11 px-4 rounded-xl text-[11px] font-bold text-rose-500 bg-rose-50 border border-rose-100 hover:bg-rose-100 transition-all whitespace-nowrap min-w-0 active:scale-95 w-full lg:w-auto"
              >
                Clear Filters
              </button>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0 min-w-0">
            {selectedIDs.length > 0 && checkPermission('payments', 'create') && (
              <button 
                onClick={() => setShowBatchModal(true)}
                className="w-full lg:w-auto px-6 h-11 rounded-xl bg-[#1C3756] hover:bg-[#152a42] text-white font-bold transition-all shadow-lg shadow-blue-900/10 flex items-center justify-center gap-2 text-xs active:scale-95 min-w-0"
              >
                <Layers size={16} className="shrink-0" />
                <span className="truncate">Batch Pay ({selectedIDs.length}) • BHD {selectedTotal.toFixed(3)}</span>
              </button>
            )}
            {checkPermission('lab_cases', 'create') && (
              <button 
                onClick={() => setModal('add')} 
                className="w-full lg:w-auto h-11 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold whitespace-nowrap shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2 text-xs transition-all active:scale-95 min-w-0"
              >
                <Plus size={18} className="shrink-0" /> New Case
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'TOTAL CASES', value: cases.length, color: 'blue', icon: Layers, gradient: 'from-blue-50 to-indigo-50/50' },
          { label: 'PENDING', value: cases.filter(c => c.status === 'Pending').length, color: 'orange', icon: Clock, gradient: 'from-orange-50 to-amber-50/50' },
          { label: 'COMPLETE', value: cases.filter(c => c.status === 'Completed').length, color: 'emerald', icon: CheckCircle2, gradient: 'from-emerald-50 to-teal-50/50' },
          { label: 'UNPAID CASES', value: cases.filter(c => c.paymentStatus === 'Unpaid').length, color: 'rose', icon: CreditCard, gradient: 'from-rose-50 to-pink-50/50' }
        ].map(stat => (
          <div key={stat.label} className={`relative overflow-hidden group px-5 py-3 rounded-[1.25rem] border border-white shadow-lg shadow-gray-100/30 transition-all duration-300 hover:scale-[1.005] hover:shadow-xl hover:shadow-gray-200/40 bg-gradient-to-br ${stat.gradient} text-left`}>
             <div className="relative z-10 flex flex-col justify-between h-full">
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center mb-2 transition-colors ${
                  stat.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                  stat.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                  stat.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                  'bg-rose-100 text-rose-600'
                }`}>
                   <stat.icon size={14} />
                </div>
                <div>
                   <p className={`text-[8px] font-bold uppercase tracking-[0.1em] mb-0 opacity-60 ${
                     stat.color === 'blue' ? 'text-blue-900' :
                     stat.color === 'orange' ? 'text-orange-900' :
                     stat.color === 'emerald' ? 'text-emerald-900' :
                     'text-rose-900'
                   }`}>{stat.label}</p>
                   <p className={`text-xl font-black tracking-tight leading-none ${
                     stat.color === 'blue' ? 'text-blue-900' :
                     stat.color === 'orange' ? 'text-orange-900' :
                     stat.color === 'emerald' ? 'text-emerald-900' :
                     'text-rose-900'
                   }`}>{stat.value}</p>
                </div>
             </div>
             {/* Background Decorative Icon */}
             <div className={`absolute -right-3 -bottom-5 opacity-[0.03] group-hover:opacity-[0.06] group-hover:scale-105 transition-all duration-500 pointer-events-none ${
               stat.color === 'blue' ? 'text-blue-900' :
               stat.color === 'orange' ? 'text-orange-900' :
               stat.color === 'emerald' ? 'text-emerald-900' :
               'text-rose-900'
             }`}>
                <stat.icon size={72} />
             </div>
          </div>
        ))}
      </div>

      {/* Table / Cards View */}
      <div className="mt-6 overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden lg:block card p-0 overflow-hidden border-gray-100 shadow-sm rounded-3xl min-w-0">
          <div className="table-container overflow-auto max-h-[calc(100vh-260px)]">
            <table className="table w-full">
              <thead className="sticky top-0 z-20 bg-gray-50 shadow-sm">
                <tr className="bg-gray-50">
                  <th className="w-14 text-center px-4">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded-full border-gray-300 text-primary focus:ring-primary cursor-pointer transition-all active:scale-90" 
                      checked={filtered.length > 0 && selectedIDs.length === filtered.length}
                      onChange={toggleSelectAll}
                    />
                </th>
<th className="px-6 py-4 text-[11px] font-black text-gray-700 uppercase text-left">Patient Name</th>
<th className="px-6 py-4 text-[11px] font-black text-gray-700 uppercase text-left">Laboratory</th>
<th className="px-6 py-4 text-[11px] font-black text-gray-700 uppercase text-left">Prosthesis</th>
<th className="px-6 py-4 text-[11px] font-black text-gray-700 uppercase text-left">Status</th>
<th className="px-6 py-4 text-[11px] font-black text-gray-700 uppercase text-left">Created</th>
<th className="px-6 py-4 text-[11px] font-black text-gray-700 uppercase text-left">Due Date</th>
<th className="px-6 py-4 text-[11px] font-black text-gray-700 uppercase text-left">Amount Due</th>
<th className="px-6 py-4 text-[11px] font-black text-gray-700 uppercase text-left">Payment</th>
<th className="px-6 py-4 text-[11px] font-black text-gray-700 uppercase text-center">Pickup</th>
<th className="px-6 py-4 text-[11px] font-black text-gray-700 uppercase text-center">Delivery</th>
<th className="px-6 py-4 text-[11px] font-black text-gray-700 uppercase text-left">Last Log</th>
<th className="px-6 py-4 text-[11px] font-black text-gray-700 uppercase text-right">Actions</th>
</tr>
              </thead>
              <tbody>
  {filtered.length === 0 ? (
    <tr>
      <td colSpan={13} className="text-center text-gray-400 py-10">
        No lab cases found.
      </td>
    </tr>
  ) : (
    paginated.map(c => (
  <tr key={c.id} className="hover:bg-gray-50">

    {/* ✅ CHECKBOX COLUMN (FIX) */}
    <td className="px-4 py-2">
  <input
    type="checkbox"
    className="w-4 h-4"
    checked={selectedIDs.includes(c.id)}
    onChange={() => toggleSelect(c.id)}
  />
</td>

    {/* Patient */}
    <td className="px-4 py-2">
      <div className="font-normal text-sm">{c.patientName}</div>
      <div className="text-xs text-gray-500">{c.patientNumber}</div>
    </td>

    {/* Laboratory */}
    <td className="px-4 py-2">
      <div className="flex items-center gap-3 min-w-0">
        <LabLogo logoUrl={c.labLogoUrl} name={c.labName} />
        <div className="min-w-0">
          <div className="text-sm font-normal text-gray-800 truncate max-w-[180px]">{c.labName || 'Unknown Lab'}</div>
          <div className="text-[10px] font-bold text-blue-900/50 uppercase tracking-widest">Laboratory</div>
        </div>
      </div>
    </td>

    {/* Prosthesis */}
    <td className="px-4 py-2">{c.prosthesis}</td>

    {/* Status */}
    <td className="px-4 py-2">
      <StatusBadge status={c.status} />
    </td>

    {/* Created Date */}
    <td className="px-4 py-2 text-sm whitespace-nowrap text-gray-600">
      {c.createdAt || '-'}
    </td>

    {/* Due Date */}
    <td className="px-4 py-2 text-sm whitespace-nowrap">
    {c.expectedDate
  ? new Date(c.expectedDate).toLocaleString('en-GB')
  : '-'}
    </td>

    {/* Amount */}
    <td className="px-4 py-2">
      {formatBHD(getCaseDueAmount(c))}
    </td>

    {/* Payment */}
    <td className="px-4 py-2">
      <PayBadge status={c.paymentStatus} />
    </td>

    {/* Pickup */}
    <td className="px-4 py-2 text-center">
      {checkPermission('lab_cases', 'update') ? (
          <button
            type="button"
            onClick={() => handleQuickLog(c, 'Pickup')}
            disabled={quickLogBusy === `${c.id}-Pickup`}
            className="inline-flex items-center gap-1 rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 py-1.5 text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
            title="Record pickup now"
          >
            <ArrowUpRight size={13} /> Pickup
          </button>
      ) : (
        <span className="text-xs font-semibold text-gray-300">-</span>
      )}
    </td>

    {/* Delivery */}
    <td className="px-4 py-2 text-center">
      {checkPermission('lab_cases', 'update') ? (
          <button
            type="button"
            onClick={() => handleQuickLog(c, 'Delivery')}
            disabled={quickLogBusy === `${c.id}-Delivery`}
            className="inline-flex items-center gap-1 rounded-lg border border-orange-100 bg-orange-50 px-2.5 py-1.5 text-[10px] font-bold text-orange-700 hover:bg-orange-100 disabled:opacity-50"
            title="Record delivery now"
          >
            <ArrowDownLeft size={13} /> Delivery
          </button>
      ) : (
        <span className="text-xs font-semibold text-gray-300">-</span>
      )}
    </td>

    {/* Last Log */}
    <td className="px-4 py-2">
      {c.lastLabMovement ? (
        <div className="min-w-[130px] flex flex-col items-start justify-center gap-1">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
            c.lastLabMovement.type === 'Pickup'
              ? 'border-indigo-100 bg-indigo-50 text-indigo-700'
              : 'border-orange-100 bg-orange-50 text-orange-700'
          }`}>
            {c.lastLabMovement.type === 'Pickup' ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
            {c.lastLabMovement.label}
          </span>
          <div className="text-[11px] font-semibold text-gray-500 whitespace-nowrap leading-none">{c.lastLabMovement.date}</div>
        </div>
      ) : (
        <span className="text-xs font-semibold text-gray-300">-</span>
      )}
    </td>

    {/* ACTIONS */}
    <td className="px-4 py-2">
      <div className="flex items-center justify-end gap-2">

      <button
        type="button"
        onClick={() => setViewItem(c)}
        className="p-2 text-gray-400 hover:text-primary transition-colors"
        title="View"
      >
        <Eye size={16} />
      </button>

      {checkPermission('lab_cases', 'update') && (
        <button
          type="button"
          onClick={() => {
            console.log("EDIT CLICKED");
            setEditItem(c);
            setModal('edit');
          }}
          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
          title="Edit"
        >
          <Edit2 size={16} />
        </button>
      )}

      {checkPermission('lab_cases', 'delete') && (
        <button
          type="button"
          onClick={() => setConfirmDelete(c.id)}
          className="p-2 text-gray-400 hover:text-rose-600 transition-colors"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      )}

      </div>
    </td>

  </tr>
))
  )}
</tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-4 min-w-0">
          {filtered.length === 0 && (
            <div className="text-center text-gray-400 py-10 font-medium">No lab cases found.</div>
          )}
          {paginated.map(c => (
            <div key={c.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm relative overflow-hidden text-left">
              <div className="flex items-start justify-between mb-3">
                <div onClick={() => setViewItem(c)} className="cursor-pointer">
                  <p className="font-extrabold text-gray-900 text-sm tracking-tight">{c.patientNumber}</p>
                  <p className="text-xs text-gray-500 font-medium">{c.patientName}</p>
                </div>
                <div className="flex items-center gap-1.5">
                   {checkPermission('lab_cases', 'update') && (
                     <button onClick={() => { setEditItem(c); setModal('edit'); }} className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                        <Edit2 size={16} />
                     </button>
                   )}
                   {checkPermission('lab_cases', 'delete') && (
                     <button onClick={() => setConfirmDelete(c.id)} className="p-2 text-gray-400 hover:text-rose-600 transition-colors">
                        <Trash2 size={16} />
                     </button>
                   )}
                </div>
              </div>

              <div className="flex items-center gap-3 mb-4 rounded-xl bg-blue-50/60 border border-blue-100 p-2">
                <LabLogo logoUrl={c.labLogoUrl} name={c.labName} />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-blue-900/50 uppercase tracking-widest">Laboratory</p>
                  <p className="text-xs font-black text-gray-800 truncate">{c.labName || 'Unknown Lab'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className="bg-gray-50 px-2.5 py-1 rounded-lg text-[10px] font-bold text-gray-600 border border-gray-100">{c.prosthesis}</span>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${c.status === 'Completed' ? 'bg-teal-50 text-teal-600 border-teal-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                  {c.status}
                </span>
              </div>

              <div className="mb-3 rounded-xl border border-gray-100 bg-gray-50/70 p-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Last Log</p>
                {c.lastLabMovement ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black ${
                      c.lastLabMovement.type === 'Pickup' ? 'bg-indigo-50 text-indigo-700' : 'bg-orange-50 text-orange-700'
                    }`}>
                      {c.lastLabMovement.type === 'Pickup' ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                      {c.lastLabMovement.label}
                    </span>
                    <span className="text-[11px] font-bold text-gray-500">{c.lastLabMovement.date}</span>
                  </div>
                ) : (
                  <p className="text-xs font-semibold text-gray-400">No pickup or delivery log yet</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-3 border-t border-gray-50">
                <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Amount Due</p>
                   <p className="font-black text-gray-900 text-sm">{formatBHD(getCaseDueAmount(c))}</p>
                </div>
                <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Payment</p>
                   <span className={`inline-block px-2 py-0.5 rounded-lg text-[9px] font-black tracking-tight ${
                     c.paymentStatus === 'Paid' ? 'bg-primary/10 text-primary' : 
                     c.paymentStatus === 'Partial' ? 'bg-indigo-50 text-indigo-600' :
                     'bg-rose-50 text-rose-600'
                   }`}>
                      {c.paymentStatus.toUpperCase()}
                   </span>
                </div>
              </div>

              {checkPermission('lab_cases', 'update') && (
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-50">
                  <button
                    type="button"
                    onClick={() => handleQuickLog(c, 'Pickup')}
                    disabled={quickLogBusy === `${c.id}-Pickup`}
                    className="py-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-bold hover:bg-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <ArrowUpRight size={14} /> Pickup
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLog(c, 'Delivery')}
                    disabled={quickLogBusy === `${c.id}-Delivery`}
                    className="py-2.5 rounded-xl bg-orange-50 text-orange-700 border border-orange-100 text-xs font-bold hover:bg-orange-100 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <ArrowDownLeft size={14} /> Delivery
                  </button>
                </div>
              )}

              <button 
                onClick={() => setViewItem(c)}
                className="w-full mt-2 py-2.5 rounded-xl bg-gray-50 text-gray-600 text-xs font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
              >
                <Eye size={14} /> View Full Details
              </button>
            </div>
          ))}
        </div>
      </div>

      <PaginationControls
        totalItems={filtered.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        label="lab cases"
      />

      <CategoryManagerModal 
        isOpen={showCatManager} 
        onClose={() => setShowCatManager(false)} 
        module="LAB_CASES"
        onUpdate={fetchCustomCategories}
      />
    </div>
  );
}


