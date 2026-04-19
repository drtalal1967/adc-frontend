import React, { useState } from 'react';
import { X, Download, ExternalLink, FileText, Image as ImageIcon, AlertCircle } from 'lucide-react';

const FilePreviewModal = ({ file, onClose }) => {
  const [pdfError, setPdfError] = useState(false);

  if (!file) return null;

  // Determine if file is an API document object or a raw File/Blob object
  const isApiDoc = typeof file === 'object' && file.fileUrl && !(file instanceof Blob);
  
  const fileUrl = typeof file === 'string' 
    ? encodeURI(file) 
    : (isApiDoc ? file.fileUrl : URL.createObjectURL(file));

  const fileName = typeof file === 'string' 
    ? decodeURIComponent(file.split('/').pop().replace(/file-\d+-\d+-/, '')) || 'Attachment'
    : (file.fileName || file.name || 'Attachment');

  const isImage = typeof file === 'string' 
    ? (file.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i) || file.startsWith('blob:') || file.startsWith('data:image'))
    : (isApiDoc ? file.fileUrl.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i) : file.type?.startsWith('image/'));
  
  const isPDF = typeof file === 'string'
    ? (file.match(/\.pdf$/i) || file.includes('application/pdf'))
    : (isApiDoc ? file.fileUrl.match(/\.pdf$/i) : (file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')));

  // For non-image, non-PDF files or PDFs on cross-origin, open in new tab
  const handleOpenInNewTab = (e) => {
    e.stopPropagation();
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 md:p-8 animate-fade-in" onClick={onClose}>
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg text-white">
            {isImage ? <ImageIcon size={20} /> : <FileText size={20} />}
          </div>
          <span className="text-white font-bold text-sm md:text-base truncate max-w-[200px] md:max-w-md">{fileName}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenInNewTab}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all shadow-lg"
            title="Open in new tab"
          >
            <ExternalLink size={20} />
          </button>
          <a 
            href={fileUrl} 
            download={fileName}
            onClick={e => e.stopPropagation()}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all shadow-lg"
            title="Download"
          >
            <Download size={20} />
          </a>
          <button 
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all shadow-lg"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="relative w-full h-full flex items-center justify-center mt-12 bg-white/5 rounded-3xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {isImage ? (
          <img 
            src={fileUrl} 
            alt={fileName} 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-scale-in"
          />
        ) : isPDF && !pdfError ? (
          <embed
            src={fileUrl}
            type="application/pdf"
            className="w-full h-full rounded-2xl animate-scale-in"
            title={fileName}
            onError={() => setPdfError(true)}
          />
        ) : (
          <div className="bg-white p-12 rounded-3xl flex flex-col items-center gap-6 shadow-2xl animate-scale-in">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {pdfError ? <AlertCircle size={48} className="text-rose-500" /> : <FileText size={48} />}
            </div>
            <div className="text-center space-y-2 text-gray-900">
              <p className="text-xl font-bold">{fileName}</p>
              <p className="text-sm text-gray-500">
                {pdfError 
                  ? 'Could not embed this PDF. Click the button below to view it in your browser.' 
                  : 'Preview not supported for this file type.'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleOpenInNewTab}
                className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
              >
                <ExternalLink size={18} /> View in Browser
              </button>
              <a 
                href={fileUrl} 
                download={fileName}
                className="px-8 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:scale-105 transition-all flex items-center gap-2"
              >
                <Download size={18} /> Download
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilePreviewModal;
