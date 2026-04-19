import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Edit2, Trash2, Check, Loader2, Tag, Settings, AlertCircle } from 'lucide-react';
import API from '../api';

export default function CategoryManagerModal({ isOpen, onClose, module, onUpdate, defaultCategories = [] }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get(`/categories?module=${module}`);
      setCategories(res.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [module]);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen, fetchCategories]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await API.post('/categories', { name: newName.trim(), module });
      setNewName('');
      fetchCategories();
      onUpdate?.();
    } catch (err) {
      console.error('Error adding category:', err);
      setError(err.response?.data?.message || 'Error adding category');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await API.put(`/categories/${id}`, { name: editName.trim() });
      setEditingId(null);
      setEditName('');
      fetchCategories();
      onUpdate?.();
    } catch (err) {
      console.error('Error updating category:', err);
      setError(err.response?.data?.message || 'Error updating category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? Any items using this category will be reset.')) return;
    setSaving(true);
    try {
      await API.delete(`/categories/${id}`);
      fetchCategories();
      onUpdate?.();
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err.response?.data?.message || 'Error deleting category');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay z-[200]" onClick={onClose}>
      <div 
        className="modal-content max-w-md bg-white overflow-hidden rounded-[2rem] shadow-2xl animate-scale-in flex flex-col max-h-[85vh]" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
              <Settings size={20} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg tracking-tight">Manage Categories</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{module} SCOPE</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-white transition-all shadow-sm border border-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto scrollbar-hide space-y-6 flex-1">
          {/* Status Message */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-xs font-bold animate-pulse">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {/* Add New Section */}
          <form onSubmit={handleAdd} className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block pl-1">Add New Category</label>
            <div className="flex gap-2">
              <input 
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Medical Supplies"
                className="input h-11 flex-1 rounded-xl border-gray-200 focus:ring-primary/20 focus:border-primary font-bold text-gray-700 text-sm"
                disabled={saving}
              />
              <button 
                type="submit" 
                disabled={saving || !newName.trim()}
                className="w-11 h-11 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={20} />}
              </button>
            </div>
          </form>

          {/* List Section */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block pl-1">Existing Categories</label>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-300">
                <Loader2 size={32} className="animate-spin" />
                <p className="text-xs font-bold uppercase tracking-widest">Loading...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400">
                <Tag size={24} className="mx-auto mb-2 opacity-20" />
                <p className="text-xs font-medium">No custom categories added yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {categories.map(cat => (
                  <div 
                    key={cat.id} 
                    className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl hover:border-primary/30 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors shrink-0">
                      <Tag size={14} />
                    </div>
                    
                    {editingId === cat.id ? (
                      <div className="flex-1 flex gap-2">
                        <input 
                          autoFocus
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="input h-8 flex-1 text-sm py-0 rounded-lg border-primary/30 focus:ring-primary/10"
                        />
                        <button 
                          onClick={() => handleUpdate(cat.id)}
                          className="w-8 h-8 bg-emerald-500 text-white rounded-lg flex items-center justify-center hover:bg-emerald-600 transition-colors"
                        >
                          <Check size={14} />
                        </button>
                        <button 
                          onClick={() => { setEditingId(null); setEditName(''); }}
                          className="w-8 h-8 bg-gray-100 text-gray-400 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 text-sm font-bold text-gray-700">{cat.name}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}
                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button 
                            onClick={() => handleDelete(cat.id)}
                            className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
          <p className="text-[10px] text-gray-400 font-medium">Categories are private to this software.</p>
        </div>
      </div>
    </div>
  );
}
