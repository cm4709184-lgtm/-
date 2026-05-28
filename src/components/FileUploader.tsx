import React, { useCallback } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
  acrylic?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload, isLoading, acrylic }) => {
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xls') || file.name.endsWith('.xlsx'))) {
      onFileUpload(file);
    }
  }, [onFileUpload]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  }, [onFileUpload]);

  const handleClick = () => {
    if (!isLoading) {
      document.getElementById('file-input')?.click();
    }
  };

  return (
    <div
      className={`
        max-w-lg mx-auto rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-all cursor-pointer
        ${isDragging 
          ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
          : acrylic
            ? 'border-white/25 bg-black/20 hover:border-blue-400/50 active:scale-[0.98]'
            : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50 active:scale-[0.98]'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        type="file"
        id="file-input"
        accept=".xls,.xlsx"
        onChange={handleFileChange}
        className="hidden"
        disabled={isLoading}
      />
      
      <div className="flex flex-col items-center">
        <div className={`
          w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-4
          ${isDragging ? 'bg-blue-100' : acrylic ? 'bg-white/10' : 'bg-gradient-to-br from-blue-50 to-indigo-50'}
        `}>
          {isLoading ? (
            <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          ) : (
            <Upload className={`w-8 h-8 sm:w-10 sm:h-10 ${isDragging ? 'text-blue-600' : acrylic ? 'text-white' : 'text-blue-500'}`} />
          )}
        </div>
        
        <h3 className={`text-base sm:text-lg font-semibold mb-2 ${acrylic ? 'text-white' : 'text-slate-800'}`}>
          {isLoading ? '正在解析课表...' : '点击上传课表文件'}
        </h3>
        
        <p className={`text-xs sm:text-sm mb-3 ${acrylic ? 'text-white/70' : 'text-slate-500'}`}>
          支持 .xls 和 .xlsx 格式
        </p>
        
        {isDragging && (
          <p className={`text-xs sm:text-sm font-medium animate-pulse ${acrylic ? 'text-white' : 'text-blue-500'}`}>
            释放以上传文件
          </p>
        )}
        
        {!isDragging && !isLoading && (
          <div className={`flex items-center gap-2 text-xs ${acrylic ? 'text-white/60' : 'text-slate-400'}`}>
            <FileSpreadsheet className="w-4 h-4" />
            <span>或将文件拖拽到此处</span>
          </div>
        )}
      </div>
    </div>
  );
};
