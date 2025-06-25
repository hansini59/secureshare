import React, { useState, useEffect } from 'react';
import { Download, File, Calendar, User, ExternalLink, RefreshCw, Clock } from 'lucide-react';
import { FileItem } from '../types';

interface FileListProps {
  onDownload: (fileId: string) => Promise<{ downloadUrl: string }>;
  files: FileItem[];
}

const FileList: React.FC<FileListProps> = ({ onDownload, files }) => {
  const [loading, setLoading] = useState(true);
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    const loadFiles = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLoading(false);
      setLastUpdated(new Date());
    };

    loadFiles();

    // Set up real-time updates
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000); // Update timestamp every 30 seconds

    return () => clearInterval(interval);
  }, [files]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    return <File className="h-8 w-8 text-blue-500" />;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const handleDownload = async (fileId: string) => {
    setDownloadingFiles(prev => new Set(prev).add(fileId));
    
    try {
      const result = await onDownload(fileId);
      
      // Generate secure download URL
      const encryptedUrl = `${window.location.origin}/secure-download/${btoa(fileId + Date.now())}`;
      
      // Open the secure download URL in a new tab
      window.open(encryptedUrl, '_blank');
      
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 text-slate-400 animate-spin" />
          <span className="ml-3 text-slate-600">Loading files...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Available Files</h3>
            <p className="text-sm text-slate-600 mt-1">
              {files.length} file{files.length !== 1 ? 's' : ''} available for download
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-500">
            <Clock className="h-4 w-4" />
            <span>Updated {formatTimeAgo(lastUpdated.toISOString())}</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-200">
        {files.length === 0 ? (
          <div className="p-8 text-center">
            <File className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No files available</p>
            <p className="text-sm text-slate-400 mt-1">Files will appear here in real-time when uploaded</p>
          </div>
        ) : (
          files.map((file) => (
            <div key={file.id} className="p-6 hover:bg-slate-50 transition-colors group">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {getFileIcon(file.type)}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-slate-900 truncate">
                      {file.name}
                    </h4>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-slate-500">
                      <span className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {file.uploadedBy}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatTimeAgo(file.uploadedAt)}
                      </span>
                      <span>{formatFileSize(file.size)}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => handleDownload(file.id)}
                  disabled={downloadingFiles.has(file.id)}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group-hover:shadow-md"
                >
                  {downloadingFiles.has(file.id) ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span>
                    {downloadingFiles.has(file.id) ? 'Generating...' : 'Download'}
                  </span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FileList;