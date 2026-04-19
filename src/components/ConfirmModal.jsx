import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger' }) {
  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      icon: <AlertCircle className="text-rose-500" size={24} />,
      btn: 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-200',
      bg: 'bg-rose-50'
    },
    warning: {
      icon: <AlertCircle className="text-amber-500" size={24} />,
      btn: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200',
      bg: 'bg-amber-50'
    },
    primary: {
      icon: <AlertCircle className="text-primary" size={24} />,
      btn: 'bg-primary hover:bg-primary-dark text-white shadow-primary-200',
      bg: 'bg-primary-50'
    }
  };

  const config = typeConfig[type] || typeConfig.danger;

  return (
    <div className="modal-overlay z-[200]" onClick={onCancel}>
      <div 
        className="modal-content max-w-sm bg-white overflow-hidden animate-scale-in" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 text-center space-y-4">
          <div className={`w-16 h-16 rounded-full ${config.bg} flex items-center justify-center mx-auto mb-2`}>
            {config.icon}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">{title}</h3>
            <p className="text-sm text-gray-500 mt-1 px-4">{message}</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button 
              onClick={onCancel}
              className="flex-1 py-2.5 text-sm font-semibold text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
            >
              {cancelText}
            </button>
            <button 
              onClick={onConfirm}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl shadow-lg transition-transform active:scale-95 ${config.btn}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
