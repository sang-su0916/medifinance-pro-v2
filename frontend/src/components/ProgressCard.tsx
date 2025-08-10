import React from 'react';
import { ProgressData } from '../types';
import { Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface ProgressCardProps {
  title: string;
  progress: ProgressData | null;
  isComplete?: boolean;
  isError?: boolean;
  error?: string;
}

const ProgressCard: React.FC<ProgressCardProps> = ({ 
  title, 
  progress, 
  isComplete = false, 
  isError = false,
  error 
}) => {
  const getStatusIcon = () => {
    if (isError) return <AlertCircle className="w-5 h-5 text-red-500" />;
    if (isComplete) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (progress) return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    return <Clock className="w-5 h-5 text-gray-400" />;
  };

  const getStatusColor = () => {
    if (isError) return 'border-red-200 bg-red-50';
    if (isComplete) return 'border-green-200 bg-green-50';
    if (progress) return 'border-blue-200 bg-blue-50';
    return 'border-gray-200 bg-gray-50';
  };

  const getProgressWidth = () => {
    if (isComplete) return 100;
    if (progress) return Math.min(progress.progress || 0, 100);
    return 0;
  };

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor()}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {getStatusIcon()}
      </div>

      {/* 진행률 바 */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
        <div 
          className={`h-2.5 rounded-full transition-all duration-300 ${
            isError ? 'bg-red-500' : 
            isComplete ? 'bg-green-500' : 
            'bg-blue-500'
          }`}
          style={{ width: `${getProgressWidth()}%` }}
        />
      </div>

      {/* 상태 메시지 */}
      <div className="text-sm text-gray-600">
        {isError && error && (
          <div className="text-red-600 font-medium">❌ {error}</div>
        )}
        
        {isComplete && !isError && (
          <div className="text-green-600 font-medium">✅ 완료</div>
        )}
        
        {progress && !isComplete && !isError && (
          <div>
            <div className="font-medium text-gray-800 mb-1">
              {progress.message}
            </div>
            {progress.details && (
              <div className="text-xs text-gray-500">
                {progress.details.processed || 0}건 / {progress.details.total || 0}건 처리 중
                {progress.details.currentItem && (
                  <span className="block mt-1">현재: {progress.details.currentItem}</span>
                )}
              </div>
            )}
            <div className="mt-1 font-medium">
              {getProgressWidth().toFixed(1)}% 완료
            </div>
          </div>
        )}
        
        {!progress && !isComplete && !isError && (
          <div className="text-gray-500">대기 중...</div>
        )}
      </div>
    </div>
  );
};

export default ProgressCard;