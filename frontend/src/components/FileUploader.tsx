import React, { useState, useRef } from 'react';
import { Upload, File, X, AlertCircle } from 'lucide-react';

interface FileUploaderProps {
  onFilesSelected: (files: { rawData?: File; automation?: File }) => void;
  isProcessing?: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
  onFilesSelected, 
  isProcessing = false 
}) => {
  const [selectedFiles, setSelectedFiles] = useState<{
    rawData?: File;
    automation?: File;
  }>({});
  
  const [dragOver, setDragOver] = useState<'rawData' | 'automation' | null>(null);
  
  const rawDataInputRef = useRef<HTMLInputElement>(null);
  const automationInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (type: 'rawData' | 'automation', file: File) => {
    // Excel 파일 체크
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      alert('Excel 파일(.xlsx, .xls) 또는 CSV 파일만 업로드 가능합니다.');
      return;
    }

    const newFiles = { ...selectedFiles, [type]: file };
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const handleDrop = (e: React.DragEvent, type: 'rawData' | 'automation') => {
    e.preventDefault();
    setDragOver(null);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(type, files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'rawData' | 'automation') => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(type, file);
    }
  };

  const removeFile = (type: 'rawData' | 'automation') => {
    const newFiles = { ...selectedFiles };
    delete newFiles[type];
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const FileUploadArea = ({ 
    type, 
    title, 
    description, 
    required = false 
  }: { 
    type: 'rawData' | 'automation'; 
    title: string; 
    description: string; 
    required?: boolean;
  }) => {
    const file = selectedFiles[type];
    const isRequired = required && !file;

    return (
      <div className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
        dragOver === type ? 'border-blue-500 bg-blue-50' :
        isRequired ? 'border-red-300 bg-red-50' :
        file ? 'border-green-300 bg-green-50' :
        'border-gray-300 hover:border-gray-400'
      }`}>
        {!file ? (
          <div
            className="text-center cursor-pointer"
            onDrop={(e) => handleDrop(e, type)}
            onDragOver={(e) => { e.preventDefault(); setDragOver(type); }}
            onDragLeave={() => setDragOver(null)}
            onClick={() => {
              if (type === 'rawData') rawDataInputRef.current?.click();
              else automationInputRef.current?.click();
            }}
          >
            <Upload className={`mx-auto w-12 h-12 mb-4 ${
              isRequired ? 'text-red-400' : 'text-gray-400'
            }`} />
            <h3 className={`text-lg font-semibold mb-2 ${
              isRequired ? 'text-red-700' : 'text-gray-700'
            }`}>
              {title}
              {required && <span className="text-red-500 ml-1">*</span>}
            </h3>
            <p className={`text-sm mb-4 ${
              isRequired ? 'text-red-600' : 'text-gray-600'
            }`}>
              {description}
            </p>
            <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
              isRequired ? 'border-red-300 text-red-700 hover:bg-red-100' :
              'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}>
              <Upload className="w-4 h-4" />
              <span>파일 선택 또는 드래그&드롭</span>
            </div>
            
            {isRequired && (
              <div className="mt-3 flex items-center justify-center text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span>필수 파일입니다</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <File className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeFile(type);
              }}
              className="p-1 text-red-500 hover:text-red-700 transition-colors"
              disabled={isProcessing}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">📁 파일 업로드</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FileUploadArea
          type="rawData"
          title="로우데이터 파일"
          description="분류할 거래내역이 포함된 Excel 파일을 업로드하세요"
          required
        />
        
        <FileUploadArea
          type="automation"
          title="자동화 Excel 파일"
          description="SUMIFS 수식이 포함된 Excel 파일 (선택사항)"
        />
      </div>

      {/* 숨겨진 파일 입력 */}
      <input
        ref={rawDataInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={(e) => handleFileInputChange(e, 'rawData')}
        className="hidden"
      />
      <input
        ref={automationInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={(e) => handleFileInputChange(e, 'automation')}
        className="hidden"
      />

      {/* 파일 형식 안내 */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">📋 지원 파일 형식</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Excel 파일: .xlsx, .xls</li>
          <li>• CSV 파일: .csv</li>
          <li>• 최대 파일 크기: 50MB</li>
          <li>• 권장: UTF-8 인코딩</li>
        </ul>
      </div>

      {/* 업로드된 파일 요약 */}
      {(selectedFiles.rawData || selectedFiles.automation) && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2">✅ 업로드된 파일</h4>
          <div className="space-y-2 text-sm">
            {selectedFiles.rawData && (
              <div className="flex items-center space-x-2 text-green-700">
                <File className="w-4 h-4" />
                <span>로우데이터: {selectedFiles.rawData.name}</span>
              </div>
            )}
            {selectedFiles.automation && (
              <div className="flex items-center space-x-2 text-green-700">
                <File className="w-4 h-4" />
                <span>자동화 파일: {selectedFiles.automation.name}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;