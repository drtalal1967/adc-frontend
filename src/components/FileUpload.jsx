import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Camera, Upload, X, Image as ImageIcon, Loader2, RefreshCcw, Check, FileText } from 'lucide-react';
import imageCompression from 'browser-image-compression';

const FileUpload = ({ value, onChange, onPreview, label = "Upload Attachment", multiple = false, accept = "image/*" }) => {
  const [compressing, setCompressing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState('');
  
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    return () => stopCamera(); // Cleanup on unmount
  }, []);

  const startCamera = async () => {
    setShowCamera(true);
    setCameraError('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Prefer back camera
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to blob
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      
      const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
      await processFiles([file]);
      stopCamera();
    }, 'image/jpeg', 0.9);
  };

  const processFiles = async (files) => {
    if (files.length === 0) return;

    setCompressing(true);
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };

      const processedFiles = await Promise.all(
        files.map(async (file) => {
          if (file.type.startsWith('image/')) {
            const compressedFile = await imageCompression(file, options);
            return {
              url: URL.createObjectURL(compressedFile),
              name: file.name,
              file: compressedFile
            };
          }
          return {
            url: URL.createObjectURL(file),
            name: file.name,
            file: file
          };
        })
      );

      if (multiple) {
        onChange([...(value || []), ...processedFiles]);
      } else {
        onChange(processedFiles[0]);
      }
    } catch (error) {
      console.error("Compression error:", error);
    } finally {
      setCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  const removeFile = (index) => {
    if (multiple) {
      const newValue = [...value];
      URL.revokeObjectURL(newValue[index].url);
      newValue.splice(index, 1);
      onChange(newValue);
    } else {
      URL.revokeObjectURL(value.url);
      onChange(null);
    }
  };

  const currentFiles = useMemo(() => {
    if (!value) return [];
    const items = Array.isArray(value) ? value : [value];
    return items.map(item => {
      if (typeof item === 'string') {
        return { url: item, name: item.split('/').pop(), isExisting: true };
      }
      return item;
    });
  }, [value, multiple]);

  return (
    <div className="space-y-3">
      {label && (
        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block pl-1">
          {label}
        </label>
      )}
      
      <div className="flex flex-wrap gap-3">
        {/* Upload Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 w-20 h-20 md:w-24 md:h-24 bg-white border-2 border-dashed border-gray-200 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group"
          >
            <Upload size={20} className="text-gray-400 group-hover:text-primary transition-colors" />
            <span className="text-[10px] font-bold text-gray-400 uppercase group-hover:text-primary">File</span>
          </button>

          <button
            type="button"
            onClick={startCamera}
            className="flex flex-col items-center justify-center gap-2 w-20 h-20 md:w-24 md:h-24 bg-white border-2 border-dashed border-gray-200 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group"
          >
            <Camera size={20} className="text-gray-400 group-hover:text-primary transition-colors" />
            <span className="text-[10px] font-bold text-gray-400 uppercase group-hover:text-primary">Camera</span>
          </button>
        </div>

        {/* Hidden Input for files only */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={accept}
          multiple={multiple}
          className="hidden"
        />

        {/* Previews */}
        {currentFiles.map((file, i) => {
          const isImage = file.file ? file.file.type.startsWith('image/') : (file.url?.match(/\.(jpg|jpeg|png|gif|webp)/i));
          
          return (
            <div key={i} className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border border-gray-200 shadow-sm animate-fade-in group">
              {isImage ? (
                <img src={file.url} alt="" className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform" onClick={() => onPreview && onPreview(file.url)} />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 p-2 text-center cursor-pointer group-hover:bg-gray-100 transition-colors" onClick={() => onPreview && onPreview(file.url)}>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center mb-1 group-hover:bg-blue-100 transition-colors">
                    <FileText size={16} />
                  </div>
                  <span className="text-[8px] text-gray-500 font-bold truncate w-full px-1 capitalize">{file.name || 'document'}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}

        {/* Loading State */}
        {compressing && (
          <div className="flex flex-col items-center justify-center gap-2 w-20 h-20 md:w-24 md:h-24 bg-gray-50 border-2 border-gray-100 rounded-2xl">
            <Loader2 size={18} className="text-primary animate-spin" />
            <span className="text-[9px] font-bold text-primary uppercase">Optimizing</span>
          </div>
        )}
      </div>

      {/* WebRTC Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-sm bg-black/50 rounded-3xl overflow-hidden border border-gray-800 relative">
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
              <span className="text-white text-xs font-bold uppercase tracking-widest">Clinical Photo</span>
              <button onClick={stopCamera} className="w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-colors">
                <X size={16} />
              </button>
            </div>
            
            <div className="relative aspect-[3/4] bg-gray-900 w-full flex items-center justify-center overflow-hidden">
              {cameraError ? (
                <div className="text-center p-6">
                  <Camera size={32} className="text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">{cameraError}</p>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-center items-center gap-6 bg-gradient-to-t from-black/80 to-transparent">
              {/* <button className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors">
                <RefreshCcw size={18} />
              </button> */}
              <button 
                onClick={capturePhoto}
                disabled={!!cameraError || !stream}
                className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="w-12 h-12 bg-white rounded-full transition-transform group-active:scale-90" />
              </button>
              {/* <span className="w-10 h-10" /> Spacer for alignment */}
            </div>
          </div>
          
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  );
};

export default FileUpload;
