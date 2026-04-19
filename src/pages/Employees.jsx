import React, { useState, useMemo, useRef, useEffect } from 'react';
import { BRANCHES } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Filter, Download, Eye, Edit2, Trash2, CheckCircle, User, Activity, MapPin, Hash, Phone, Mail, Clock, Calendar, X, AlertCircle, Users, AlertTriangle, Upload, ChevronDown, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { exportToCSV } from '../utils/exportUtils';
import FileUpload from '../components/FileUpload';
import * as XLSX from 'xlsx';
import API, { BACKEND_URL } from '../api';
import FilePreviewModal from '../components/FilePreviewModal';

const ROLES = ['All', 'admin', 'manager', 'secretary', 'dentist', 'assistant', 'accountant'];
const JOB_TITLES = ['All', 'Consultant', 'Specialist', 'General Dentist', 'Dental Assistant', 'Secretary', 'Accountant', 'Cleaner', 'Driver'];

const ROLE_COLORS = {
  admin: 'bg-teal-100 text-teal-700',
  manager: 'bg-blue-100 text-blue-700',
  secretary: 'bg-emerald-100 text-emerald-700',
  dentist: 'bg-purple-100 text-purple-700',
  assistant: 'bg-cyan-100 text-cyan-700',
  accountant: 'bg-amber-100 text-amber-700',
};

function EmployeeModal({ item, onClose, onSave }) {
  const [form, setForm] = useState(item || {
    name: '', idNumber: '', jobTitle: '', licenseExpiry: '', visaExpiry: '', workPermitExpiry: '', startDate: '', endDate: '', role: '',
    phone: '', email: '', password: '', documents: [], image: null
  });
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState(null); // raw File object for upload
  const fileInputRef = useRef(null);

  const handleFileUpload = async (newDocItems) => {
    // Check which items are new (have a 'file' property) vs already existing (just a URL)
    const itemsToUpload = newDocItems.filter(item => item.file);
    const existingPaths = newDocItems.filter(item => !item.file).map(i => i.url || i);

    if (itemsToUpload.length === 0) {
      update('documents', existingPaths);
      return;
    }

    setUploadingDoc(true);
    try {
      const uploadedPaths = await Promise.all(
        itemsToUpload.map(async (docItem) => {
          const formData = new FormData();
          formData.append('title', `ID Doc - ${form.name}`);
          formData.append('category', 'ID');
          formData.append('file', docItem.file);
          formData.append('skipDb', true);
          const res = await API.post('/documents/upload', formData);
          return res.data.fileUrl; // This is the persistent server path
        })
      );

      const allPaths = [...existingPaths, ...uploadedPaths];
      update('documents', allPaths);
    } catch (err) {
      console.error("Document upload error:", err);
      alert("Failed to upload document to server");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Store the raw file for actual upload on save
      setPendingImageFile(file);
      // Show a local preview only
      const url = URL.createObjectURL(file);
      setForm(f => ({ ...f, image: url }));
    }
  };

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="modal-overlay z-[100]" onClick={onClose}>
      <div className="modal-content max-w-2xl bg-white overflow-hidden shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-header px-6 py-5 flex items-center justify-between text-white border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-soft">
              <Users size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">{item ? 'Edit Employee Record' : 'Add New Employee'}</h2>
              <p className="text-[10px] text-white/80 uppercase tracking-widest font-bold">Staff Management</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/70 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto scrollbar-hide px-6 py-6 space-y-8">
          {/* Identity Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-l-4 border-primary pl-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Identity Details</h3>
            </div>

            {/* Profile Image Upload */}
            <div className="flex flex-col items-center justify-center p-6 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 gap-4 group hover:border-primary/30 transition-all">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-white shadow-lg border-4 border-white overflow-hidden flex items-center justify-center ring-4 ring-primary/5 group-hover:ring-primary/10 transition-all">
                  {form.image ? (
                    <img src={form.image} alt="Profile Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-gray-300 flex flex-col items-center">
                      <User size={32} />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all outline-none ring-4 ring-white"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="text-center">
                <p className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Profile Photo</p>
                <p className="text-[10px] text-gray-400 font-medium">JPG, PNG or SVG. Max 2MB</p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
                accept="image/*"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                  <User size={13} className="text-primary" /> Full Name *
                </label>
                <input value={form.name} onChange={e => update('name', e.target.value)} placeholder="e.g. Dr. Sarah Connor" className="input w-full bg-gray-50/50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                  <Hash size={13} className="text-secondary" /> ID Number *
                </label>
                <input
                  value={form.idNumber}
                  onChange={e => update('idNumber', e.target.value.replace(/\D/g, '').slice(0, 9))}
                  placeholder="9-digit Bahrain ID"
                  maxLength={9}
                  pattern="[0-9]{9}"
                  inputMode="numeric"
                  className="input w-full font-mono bg-gray-50/50"
                />
                {form.idNumber && form.idNumber.length > 0 && form.idNumber.length < 9 && (
                  <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                    <AlertCircle size={10} /> Must be exactly 9 digits ({form.idNumber.length}/9)
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                  <Calendar size={13} className="text-emerald-500" /> Start Date
                </label>
                <input type="date" value={form.startDate} onChange={e => update('startDate', e.target.value)} className="input w-full bg-gray-50/50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                  <Calendar size={13} className="text-rose-500" /> End Date
                </label>
                <input type="date" value={form.endDate} onChange={e => update('endDate', e.target.value)} className="input w-full bg-gray-50/50" />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                  <Phone size={13} className="text-indigo-500" /> Phone Number
                </label>
                <input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="e.g. +973-33445566" className="input w-full bg-gray-50/50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                  <Mail size={13} className="text-indigo-500" /> Email Address
                </label>
                <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="e.g. sarah@example.com" className="input w-full bg-gray-50/50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                  <Hash size={13} className="text-indigo-500" /> Password {item ? '(Leave blank to keep current)' : '*'}
                </label>
                <input type="password" value={form.password} onChange={e => update('password', e.target.value)} placeholder="••••••••" className="input w-full bg-gray-50/50" />
              </div>
            </div>
          </div>

          {/* Job Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-l-4 border-secondary pl-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Employment Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                  <Activity size={13} className="text-indigo-500" /> Job Title *
                </label>
                <select value={form.jobTitle} onChange={e => update('jobTitle', e.target.value)} className="select w-full bg-gray-50/50">
                  <option value="">Select job title...</option>
                  {JOB_TITLES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                  <Users size={13} className="text-amber-500" /> System Role *
                </label>
                <select value={form.role} onChange={e => update('role', e.target.value)} className="select w-full bg-gray-50/50 capitalize">
                  <option value="">Select system role...</option>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Documents & Expiries */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-l-4 border-amber-500 pl-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Documents & Credentials</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                  <AlertCircle size={13} className="text-rose-500" /> License Expiry
                </label>
                <input type="date" value={form.licenseExpiry} onChange={e => update('licenseExpiry', e.target.value)} className="input w-full bg-gray-50/50 text-gray-700" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                  <AlertCircle size={13} className="text-rose-500" /> Visa Expiry
                </label>
                <input type="date" value={form.visaExpiry} onChange={e => update('visaExpiry', e.target.value)} className="input w-full bg-gray-50/50 text-gray-700" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                  <AlertCircle size={13} className="text-rose-500" /> Work Permit Expiry
                </label>
                <input type="date" value={form.workPermitExpiry} onChange={e => update('workPermitExpiry', e.target.value)} className="input w-full bg-gray-50/50 text-gray-700" />
              </div>
            </div>

            <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 relative">
              {uploadingDoc && (
                <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] rounded-2xl flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin text-primary" size={18} />
                  <span className="text-[10px] font-black uppercase text-primary tracking-widest animate-pulse">Syncing Storage...</span>
                </div>
              )}
              <FileUpload
                label="Upload ID Data & Documents"
                value={form.documents?.map(doc => {
                  const url = doc.fileUrl || doc;
                  const name = doc.fileName || (typeof url === 'string' ? url.split('/').pop() : 'document');
                  return { url, name };
                }) || []}
                multiple={true}
                onChange={handleFileUpload}
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button type="button" onClick={onClose} className="btn-ghost flex-1 py-3 text-sm rounded-2xl">Discard</button>
          <button onClick={async () => {
            let imageUrl = form.image;
            // If there's a new pending image file, upload it to cloud first
            if (pendingImageFile) {
              try {
                const fd = new FormData();
                fd.append('file', pendingImageFile);
                fd.append('title', `Profile - ${form.name}`);
                fd.append('category', 'ID');
                fd.append('skipDb', true);
                const res = await API.post('/documents/upload', fd);
                imageUrl = res.data.fileUrl; // persistent cloud URL from ImageKit
              } catch (err) {
                console.error('Profile image upload failed:', err);
                alert('Failed to upload profile image. Please try again.');
                return;
              }
            }
            onSave({ ...form, image: imageUrl });
          }} className="btn-primary flex-[2] py-3 text-sm rounded-2xl shadow-lg shadow-primary/20">
            {item ? 'Save Employee Info' : 'Confirm & Add Employee'}
          </button>
        </div>
      </div>
    </div>
  );
}

function isExpiringSoon(dateStr) {
  if (!dateStr || dateStr === 'N/A') return false;
  const diff = (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24);
  return diff <= 60 && diff >= 0;
}

function ViewEmployeeModal({ item, onClose, onPreview }) {
  if (!item) return null;

  const getFileIcon = (fileName) => {
    if (!fileName) return <FileText size={18} className="text-gray-400" />;
    const ext = fileName.split('.').pop().toLowerCase();
    if (['pdf'].includes(ext)) return <FileText size={18} className="text-red-500" />;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <ImageIcon size={18} className="text-blue-500" />;
    return <FileText size={18} className="text-gray-500" />;
  };

  return (
    <div className="modal-overlay z-[100]" onClick={onClose}>
      <div className="modal-content max-w-2xl bg-white overflow-hidden shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-header px-6 py-5 flex items-center justify-between text-white border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-soft">
              <Eye size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">Employee Details</h2>
              <p className="text-[10px] text-white/80 uppercase tracking-widest font-bold">Staff Directory</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/70 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto scrollbar-hide px-6 py-8 space-y-10">
          {/* Top Profile Section */}
          <div className="flex flex-col md:flex-row items-center gap-8 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
            <div className="w-32 h-32 rounded-3xl bg-white shadow-xl border-4 border-white overflow-hidden flex-shrink-0 flex items-center justify-center ring-4 ring-primary/5">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/5 flex items-center justify-center text-primary text-4xl font-black italic">
                  {item.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="text-center md:text-left space-y-3">
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">{item.name}</h3>
                <p className="text-sm font-bold text-primary uppercase tracking-widest mt-1 italic">{item.jobTitle}</p>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${ROLE_COLORS[item.role] || 'bg-gray-100 text-gray-600'}`}>
                  {item.role}
                </span>
                <span className="px-4 py-1 rounded-full bg-white text-gray-500 text-[10px] font-black border border-gray-100 uppercase tracking-widest shadow-sm">
                  ID: {item.idNumber}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            {/* Contact Details */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact Details</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-all">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Phone Number</p>
                    <p className="text-sm font-black text-gray-800 tracking-tight">{item.phone || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-all">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Email Address</p>
                    <p className="text-sm font-black text-gray-800 tracking-tight">{item.email || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Employment Details */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-l-4 border-emerald-500 pl-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Employment</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-all">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Join Date</p>
                    <p className="text-sm font-black text-gray-800 tracking-tight">{item.startDate || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-all">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">System Role</p>
                    <p className="text-sm font-black text-gray-800 tracking-tight capitalize">{item.role || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Credential Expiries */}
            <div className="md:col-span-2 space-y-5">
              <div className="flex items-center gap-2 border-l-4 border-rose-500 pl-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Expiries & Credentials</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'License', date: item.licenseExpiry, color: 'text-rose-500', bg: 'bg-rose-50' },
                  { label: 'Visa', date: item.visaExpiry, color: 'text-amber-500', bg: 'bg-amber-50' },
                  { label: 'Work Permit', date: item.workPermitExpiry, color: 'text-primary', bg: 'bg-primary/5' }
                ].map((exp, idx) => (
                  <div key={idx} className={`${exp.bg} p-4 rounded-2xl border border-white shadow-soft flex flex-col gap-1`}>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{exp.label} Expiry</p>
                    <p className={`text-xs font-black italic ${isExpiringSoon(exp.date) ? 'text-rose-600 animate-pulse' : 'text-gray-700'}`}>
                      {exp.date && exp.date !== 'N/A' ? exp.date : 'N/A'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ID & Documents Section */}
            <div className="md:col-span-2 space-y-5">
              <div className="flex items-center gap-2 border-l-4 border-primary pl-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">ID Data & Documents</h3>
              </div>

              {!item.documents || item.documents.length === 0 ? (
                <div className="bg-gray-50 border border-dashed border-gray-200 rounded-3xl py-10 flex flex-col items-center justify-center text-gray-400">
                  <FileText size={32} strokeWidth={1.5} className="mb-2 opacity-50" />
                  <p className="text-xs font-bold uppercase tracking-widest">No documents uploaded</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 mt-2">
                  {item.documents.map((doc, idx) => {
                    const url = doc.fileUrl || doc;
                    const isBlob = typeof url === 'string' && url.startsWith('blob:');

                    // Cleanup URL: prevent double localhost and handle relative paths correctly
                    let fullUrl = url;
                    if (!isBlob && typeof url === 'string' && !url.startsWith('http')) {
                      const cleanUrl = url.startsWith('/') ? url : `/${url}`;
                      fullUrl = `${BACKEND_URL}${cleanUrl}`;
                    }

                    const fileName = doc.fileName || (typeof url === 'string' ? url.split('/').pop() : 'document');
                    const ext = fileName.split('.').pop().toLowerCase();
                    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);

                    return (
                      <button
                        key={idx}
                        onClick={() => onPreview(fullUrl)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:border-primary hover:text-primary transition-all shadow-sm hover:shadow active:scale-95"
                      >
                        {isImage ? <ImageIcon size={14} className="text-blue-500" /> : <FileText size={14} className="text-rose-500" />}
                        <span className="uppercase tracking-widest text-[10px] mt-0.5">
                          {doc.category && doc.category !== 'OTHER' ? `${doc.category} (${idx + 1})` : (isImage ? `Image ${idx + 1}` : `${ext.toUpperCase()} ${idx + 1}`)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="btn-primary w-full py-3 text-sm rounded-2xl shadow-lg shadow-primary/20">Close Profile</button>
        </div>
      </div>
    </div>
  );
}

export default function Employees() {
  const { checkPermission } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [jobFilter, setJobFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [modal, setModal] = useState(null); // 'add' or 'edit'
  const [editItem, setEditItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [showImportSuccess, setShowImportSuccess] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await API.get('/employees');
      const formattedData = res.data.map(emp => ({
        ...emp,
        name: `${emp.firstName}${emp.lastName && emp.lastName.trim() && emp.lastName !== '.' ? ' ' + emp.lastName : ''}`.trim(),
        id: emp.id,
        idNumber: emp.nationalId || '',          // ← fix: map nationalId → idNumber
        role: emp.user?.role?.toLowerCase() || 'assistant',
        email: emp.user?.email || '',
        jobTitle: emp.jobTitle || emp.specialization || 'Staff',
        startDate: emp.joiningDate ? emp.joiningDate.split('T')[0] : '',
        endDate: emp.endDate ? emp.endDate.split('T')[0] : '',
        licenseExpiry: emp.licenseExpiry ? emp.licenseExpiry.split('T')[0] : '',
        visaExpiry: emp.visaExpiry ? emp.visaExpiry.split('T')[0] : '',
        workPermitExpiry: emp.workPermitExpiry ? emp.workPermitExpiry.split('T')[0] : '',
        image: emp.profileImageUrl,
        documents: emp.documents || []
      }));
      setEmployees(formattedData);
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => {
      const matchesSearch =
        (e.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.jobTitle || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.idNumber || '').toLowerCase().includes(search.toLowerCase());

      const matchesRole = roleFilter === 'All' || e.role === roleFilter;
      const matchesJob = jobFilter === 'All' || e.jobTitle === jobFilter;

      const today = new Date().setHours(0, 0, 0, 0);
      const isActive = !e.endDate || new Date(e.endDate) >= today;
      const matchesStatus = statusFilter === 'All' ||
        (statusFilter === 'Active' && isActive) ||
        (statusFilter === 'Inactive' && !isActive);

      return matchesSearch && matchesRole && matchesJob && matchesStatus;
    });
  }, [employees, search, roleFilter, jobFilter, statusFilter]);

  const handleSave = async (form) => {
    try {
      // Clean dates: empty string or 'N/A' should become null/undefined for backend
      const cleanDate = (d) => (!d || d === 'N/A' || d === 'Invalid Date') ? '' : d;

      const nameParts = form.name.trim().split(/\s+/);
      const firstName = nameParts[0] || 'Unknown';
      const lastName = nameParts.slice(1).join(' ') || '.'; // Use . so backend validation passes, frontend strips it

      const payload = {
        ...form,
        firstName,
        lastName,
        email: form.email,
        password: form.password || undefined,
        role: form.role?.toUpperCase(),
        nationalId: form.idNumber || undefined,
        joiningDate: cleanDate(form.startDate),
        endDate: cleanDate(form.endDate) || null,
        licenseExpiry: cleanDate(form.licenseExpiry),
        visaExpiry: cleanDate(form.visaExpiry),
        workPermitExpiry: cleanDate(form.workPermitExpiry),
        basicSalary: form.basicSalary || 0,
        profileImageUrl: form.image,
        documents: form.documents
      };

      if (editItem) {
        await API.put(`/employees/${editItem.id}`, payload);
      } else {
        await API.post('/employees', payload);
      }
      fetchEmployees();
      setModal(null);
      setEditItem(null);
    } catch (err) {
      console.error('Error saving employee:', err);
      alert(err.response?.data?.message || 'Error saving employee');
    }
  };

  const deleteEmployee = async () => {
    if (confirmDelete) {
      try {
        await API.delete(`/employees/${confirmDelete}`);
        fetchEmployees();
        setConfirmDelete(null);
      } catch (err) {
        console.error('Error deleting employee:', err);
        alert(err.response?.data?.message || 'Error deleting employee. They may be linked to clinical cases.');
      }
    }
  };

  const handleExport = () => {
    exportToCSV(employees, 'Employees_List');
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
              .filter(row => Object.keys(row).length > 0)
              .map((item, index) => ({
                id: Date.now() + index,
                name: item["Full Name"] || item.name || item.Name || "Unknown Employee",
                idNumber: item["ID Number"] || item.idNumber || item.ID || `EMP-${Date.now()}`,
                jobTitle: item["Job Title"] || item.jobTitle || item.Job || "Staff",
                role: (item.Role || item.role || "assistant").toLowerCase(),
                phone: item.Phone || item.phone || "",
                email: item.Email || item.email || "",
                licenseExpiry: item["License Expiry"] || 'N/A',
                visaExpiry: item["Visa Expiry"] || 'N/A',
                workPermitExpiry: item["Work Permit Expiry"] || 'N/A',
                startDate: item["Start Date"] || item.startDate || new Date().toISOString().split('T')[0],
                documents: [],
                image: null
              }));

            if (formatted.length > 0) {
              API.post('/employees/import', formatted)
                .then(() => {
                  fetchEmployees();
                  setSearch('');
                  setShowImportSuccess(true);
                  setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }, 100);
                })
                .catch(err => {
                  console.error('Error importing employees:', err);
                  alert(err.response?.data?.message || "Failed to import employees");
                })
                .finally(() => {
                  setImporting(false);
                });
            } else {
              alert("No valid data found in file");
              setImporting(false);
            }
          }
        } catch (err) {
          console.error('Error importing Excel file:', err);
          alert("Error parsing Excel file");
        } finally {
          setImporting(false);
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

  // Expiry Alerts
  const expiringEmployees = employees.filter(e =>
    isExpiringSoon(e.licenseExpiry) ||
    isExpiringSoon(e.visaExpiry) ||
    isExpiringSoon(e.workPermitExpiry)
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="sticky top-[-20px] -mx-4 px-4 py-4 z-10 bg-[#f8fafc]/95 backdrop-blur-md border-b border-gray-200/50 space-y-4 transition-all">
        {/* Row 1: Title & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="section-title text-xl md:text-2xl">Employees</h1>
            <p className="section-subtitle text-xs md:text-sm">{filteredEmployees.length} team members filtered</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {checkPermission('employees', 'create') && (
              <>
                <button onClick={() => setModal('add')} className="btn-primary flex-1 sm:flex-none justify-center py-2.5 text-xs md:text-sm shadow-md shadow-primary/20 whitespace-nowrap">
                  <Plus size={18} /> Add Employee
                </button>
                <button onClick={handleImportClick} className="btn-ghost btn-sm border border-gray-100 justify-center py-2 text-[10px] md:text-sm whitespace-nowrap"><Upload size={14} /> Import</button>
              </>
            )}
            {checkPermission('employees', 'export') && (
              <button onClick={handleExport} className="btn-ghost btn-sm border border-gray-100 justify-center py-2 text-[10px] md:text-sm whitespace-nowrap"><Download size={14} /> Export</button>
            )}
          </div>
        </div>

        {/* Row 2: Search & Filters */}
        <div className="flex flex-col lg:flex-row items-center gap-3 w-full">
          {/* Search bar */}
          <div className="relative w-full lg:flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search employees by name, title or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-2xl text-xs font-bold text-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            {/* Job Title Filter */}
            <div className="relative flex-1 lg:w-40">
              <Activity className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <select
                value={jobFilter}
                onChange={(e) => setJobFilter(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-white border border-gray-100 rounded-2xl text-[11px] font-black text-gray-600 appearance-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm uppercase tracking-wider"
              >
                {JOB_TITLES.map(title => <option key={title} value={title}>{title}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            </div>

            {/* Status Filter */}
            <div className="relative flex-1 lg:w-40">
              <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-white border border-gray-100 rounded-2xl text-[11px] font-black text-gray-600 appearance-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm uppercase tracking-wider"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            </div>

            {/* Role Filter */}
            <div className="relative flex-1 lg:w-40">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-white border border-gray-100 rounded-2xl text-[11px] font-black text-gray-600 appearance-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm uppercase tracking-wider"
              >
                {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* Expiry Alerts */}
      {expiringEmployees.length > 0 && (
        <div className="card border border-amber-200 bg-amber-50/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
              <AlertTriangle size={18} />
            </div>
            <p className="font-bold text-amber-900 text-sm">Expiry Alerts</p>
          </div>
          <div className="space-y-2">
            {employees.filter(e => isExpiringSoon(e.licenseExpiry)).map(e => (
              <div key={`lic-${e.id}`} className="flex items-center gap-2 p-3 bg-white/50 rounded-xl border border-amber-100 hover:border-amber-200 transition-all">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <p className="text-[11px] text-amber-800 font-medium">
                  <span className="font-bold">{e.name}</span>'s license expires {e.licenseExpiry}
                </p>
              </div>
            ))}
            {employees.filter(e => isExpiringSoon(e.visaExpiry)).map(e => (
              <div key={`visa-${e.id}`} className="flex items-center gap-2 p-3 bg-white/50 rounded-xl border border-amber-100 hover:border-amber-200 transition-all">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                <p className="text-[11px] text-amber-900 font-medium">
                  <span className="font-bold">{e.name}</span>'s visa expires {e.visaExpiry}
                </p>
              </div>
            ))}
            {employees.filter(e => isExpiringSoon(e.workPermitExpiry)).map(e => (
              <div key={`wp-${e.id}`} className="flex items-center gap-2 p-3 bg-white/50 rounded-xl border border-amber-100 hover:border-amber-200 transition-all">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <p className="text-[11px] text-primary-dark font-medium">
                  <span className="font-bold">{e.name}</span>'s work permit expires {e.workPermitExpiry}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Desktop View: Table */}
      <div className="hidden md:block card p-0 overflow-hidden shadow-sm border-gray-100">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4">Employee Name</th>
                <th className="hidden lg:table-cell px-6 py-4">ID Number & Contact</th>
                <th className="px-6 py-4">Job Title</th>
                <th className="px-6 py-4">Role</th>
                <th className="hidden xl:table-cell px-6 py-4">Expiries</th>
                <th className="hidden lg:table-cell px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {filteredEmployees.map(e => (
                <tr key={e.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white shadow-soft border border-gray-100 overflow-hidden flex items-center justify-center ring-4 ring-primary/5">
                        {e.image ? (
                          <img src={e.image} alt={e.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-primary font-black italic text-xs">
                            {e.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 tracking-tight">{e.name}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{e.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden lg:table-cell px-6 py-4">
                    <div className="space-y-1">
                      <p className="font-mono text-[11px] text-gray-400">{e.idNumber}</p>
                      <p className="text-[10px] text-gray-400 flex items-center gap-1"><Phone size={10} /> {e.phone}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-medium">{e.jobTitle}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${ROLE_COLORS[e.role] || 'bg-gray-100 text-gray-600'}`}>
                      {e.role}
                    </span>
                  </td>
                  <td className="hidden xl:table-cell px-6 py-4">
                    <div className="space-y-1">
                      <p className={`text-[10px] font-bold ${isExpiringSoon(e.licenseExpiry) ? 'text-rose-500' : 'text-gray-400'}`}>LIC: {e.licenseExpiry}</p>
                      <p className={`text-[10px] font-bold ${isExpiringSoon(e.visaExpiry) ? 'text-rose-500' : 'text-gray-400'}`}>VIS: {e.visaExpiry}</p>
                      <p className={`text-[10px] font-bold ${isExpiringSoon(e.workPermitExpiry) ? 'text-rose-500' : 'text-gray-400'}`}>PER: {e.workPermitExpiry}</p>
                    </div>
                  </td>
                  <td className="hidden lg:table-cell px-6 py-4 text-xs text-gray-400">{e.startDate}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setViewItem(e)} className="p-2 rounded-xl text-gray-400 hover:text-primary hover:bg-primary/5 transition-all">
                        <Eye size={15} />
                      </button>
                      {checkPermission('employees', 'update') && (
                        <button onClick={() => { setEditItem(e); setModal('edit'); }} className="p-2 rounded-xl text-gray-400 hover:text-secondary hover:bg-orange-50 transition-all">
                          <Edit2 size={15} />
                        </button>
                      )}
                      {checkPermission('employees', 'delete') && (
                        <button onClick={() => setConfirmDelete(e.id)} className="p-2 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View: Card List */}
      <div className="md:hidden space-y-4">
        {filteredEmployees.map(e => (
          <div key={e.id} className="card p-4 space-y-4 relative group active:scale-[0.98] transition-all duration-150 border-gray-100 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-soft border border-gray-100 overflow-hidden flex items-center justify-center ring-4 ring-primary/5">
                  {e.image ? (
                    <img src={e.image} alt={e.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary font-black italic">
                      {e.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-sm leading-tight">{e.name}</h3>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">{e.idNumber}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${ROLE_COLORS[e.role] || 'bg-gray-100 text-gray-600'}`}>
                {e.role}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-2 border-b border-gray-50">
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Job Title</p>
                <p className="text-xs font-bold text-gray-700">{e.jobTitle}</p>
              </div>
              <div className="space-y-0.5 text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Joined</p>
                <p className="text-xs font-bold text-gray-700">{e.startDate}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                {(isExpiringSoon(e.licenseExpiry) || isExpiringSoon(e.visaExpiry) || isExpiringSoon(e.workPermitExpiry)) && (
                  <div className="flex flex-wrap gap-2">
                    {isExpiringSoon(e.licenseExpiry) && <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded flex items-center gap-1"><AlertCircle size={10} /> LIC: {e.licenseExpiry}</span>}
                    {isExpiringSoon(e.visaExpiry) && <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded flex items-center gap-1"><AlertCircle size={10} /> VIS: {e.visaExpiry}</span>}
                    {isExpiringSoon(e.workPermitExpiry) && <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded flex items-center gap-1"><AlertCircle size={10} /> PER: {e.workPermitExpiry}</span>}
                  </div>
                )}
                {!isExpiringSoon(e.licenseExpiry) && !isExpiringSoon(e.visaExpiry) && !isExpiringSoon(e.workPermitExpiry) && (
                  <p className="text-[10px] text-gray-400 flex items-center gap-1"><CheckCircle size={10} className="text-emerald-500" /> All credentials valid</p>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setViewItem(e)} className="w-9 h-9 rounded-xl bg-primary/5 text-primary flex items-center justify-center hover:bg-primary/10 transition-all">
                  <Eye size={16} />
                </button>
                <button onClick={() => { setEditItem(e); setModal('edit'); }} className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-all">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => setConfirmDelete(e.id)} className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="absolute right-0 bottom-0 p-1 opacity-[0.03] pointer-events-none group-hover:opacity-[0.08] transition-opacity">
              <Users size={60} />
            </div>
          </div>
        ))}
      </div>
      {/* Modals & Overlays */}
      {(modal === 'add' || editItem) && (
        <EmployeeModal item={editItem} onClose={() => { setModal(null); setEditItem(null); }} onSave={handleSave} />
      )}
      {viewItem && (
        <ViewEmployeeModal item={viewItem} onClose={() => setViewItem(null)} onPreview={setPreviewFile} />
      )}
      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Delete Employee?"
        message="This action will remove the employee record permanently. Do you wish to continue?"
        onConfirm={deleteEmployee}
        onCancel={() => setConfirmDelete(null)}
      />

      <ConfirmModal
        isOpen={showImportSuccess}
        title="Sync Complete"
        message="Employee records have been successfully imported and matched in the system database."
        onConfirm={() => setShowImportSuccess(false)}
        confirmText="Done"
        showCancel={false}
      />

      {importing && (
        <div className="fixed inset-0 z-[200] bg-white/60 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-primary animate-pulse uppercase tracking-widest">Processing Staff Records...</p>
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
    </div>
  );
}
