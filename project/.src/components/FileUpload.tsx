import React, { useState, useRef } from 'react';
import { Upload, File, CheckCircle, AlertCircle, X } from 'lucide-react';

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  ];

  const allowedExtensions = ['pptx', 'docx', 'xlsx'];

  const validateFile = (file: File): boolean => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (!extension || !allowedExtensions.includes(extension)) {
      setErrorMessage('Only PPTX, DOCX, and XLSX files are allowed');
      return false;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      setErrorMessage('File size must be less than 50MB');
      return false;
    }

    return true;
  };

  const handleFiles = async (files: FileList) => {
    if (files.length === 0) return;

    const file = files[0];
    setErrorMessage('');
    setUploadStatus('idle');

    if (!validateFile(file)) {
      setUploadStatus('error');
      return;
    }

    setUploading(true);
    try {
      await onUpload(file);
      setUploadStatus('success');
    } catch (error) {
      setUploadStatus('error');
      setErrorMessage('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Upload Files</h3>
      
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : uploadStatus === 'success'
            ? 'border-green-400 bg-green-50'
            : uploadStatus === 'error'
            ? 'border-red-400 bg-red-50'
            : 'border-slate-300 hover:border-slate-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pptx,.docx,.xlsx"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />

        <div className="flex flex-col items-center space-y-4">
          {uploading ? (
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          ) : uploadStatus === 'success' ? (
            <CheckCircle className="h-12 w-12 text-green-500" />
          ) : uploadStatus === 'error' ? (
            <AlertCircle className="h-12 w-12 text-red-500" />
          ) : (
            <Upload className="h-12 w-12 text-slate-400" />
          )}

          <div>
            {uploading ? (
              <p className="text-blue-600 font-medium">Uploading file...</p>
            ) : uploadStatus === 'success' ? (
              <p className="text-green-600 font-medium">File uploaded successfully!</p>
            ) : uploadStatus === 'error' ? (
              <p className="text-red-600 font-medium">Upload failed</p>
            ) : (
              <>
                <p className="text-slate-600 font-medium">
                  Drop files here or click to browse
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Only PPTX, DOCX, and XLSX files (max 50MB)
                </p>
              </>
            )}
          </div>

          {errorMessage && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{errorMessage}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {allowedExtensions.map((ext) => (
          <span
            key={ext}
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800"
          >
            <File className="h-3 w-3 mr-1" />
            {ext.toUpperCase()}
          </span>
        ))}
      </div>
    </div>
  );
};

export default FileUpload;