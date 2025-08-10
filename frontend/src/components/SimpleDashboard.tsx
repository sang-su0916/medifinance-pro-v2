import React, { useState, useEffect } from 'react';
import { Activity, Server, AlertCircle, PlayCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { useAPI } from '../hooks/useAPI';

const SimpleDashboard: React.FC = () => {
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const { 
    loading, 
    error: apiError, 
    healthCheck, 
    runDemoWorkflow,
    getValidationHistory
  } = useAPI();

  // 서버 상태 확인
  useEffect(() => {
    const checkServerHealth = async () => {
      try {
        await healthCheck();
        setServerStatus('online');
      } catch (error) {
        setServerStatus('offline');
      }
    };

    checkServerHealth();
    const interval = setInterval(checkServerHealth, 30000);
    
    return () => clearInterval(interval);
  }, [healthCheck]);

  const handleRunDemo = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      const result = await runDemoWorkflow();
      const validationHistory = await getValidationHistory(1);
      
      setResults({
        workflow: result,
        validation: validationHistory?.[0]
      });
    } catch (error) {
      setError('데모 실행 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setError(null);
  };

  const getServerStatusColor = (status: string) => {
    switch (status) {
      case 'online': return { color: '#16a34a', backgroundColor: '#f0fdf4' };
      case 'offline': return { color: '#dc2626', backgroundColor: '#fef2f2' };
      default: return { color: '#ca8a04', backgroundColor: '#fefce8' };
    }
  };

  const getServerStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <Server className="w-4 h-4" />;
      case 'offline': return <AlertCircle className="w-4 h-4" />;
      default: return <RefreshCw className="w-4 h-4" style={{ animation: 'spin 1s linear infinite' }} />;
    }
  };

  return (
    <div className="dashboard-container">
      {/* 헤더 */}
      <header style={{ 
        background: 'white', 
        borderBottom: '1px solid #e5e7eb', 
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' 
      }}>
        <div className="max-w-7xl mx-auto" style={{ padding: '0 16px' }}>
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Activity className="w-8 h-8" style={{ color: '#2563eb' }} />
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#111827' }}>
                  MediFinance Pro v2
                </h1>
                <p className="text-sm" style={{ color: '#4b5563' }}>
                  병원 재무 자동화 대시보드
                </p>
              </div>
            </div>
            
            {/* 서버 상태 */}
            <div 
              className="flex items-center space-x-2 px-3 py-1 rounded-full"
              style={getServerStatusColor(serverStatus)}
            >
              {getServerStatusIcon(serverStatus)}
              <span className="text-sm font-medium">
                {serverStatus === 'online' ? '서버 연결' : 
                 serverStatus === 'offline' ? '서버 오프라인' : '연결 확인 중'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto" style={{ padding: '32px 16px' }}>
        
        {/* 에러 메시지 */}
        {(error || apiError) && (
          <div 
            className="card" 
            style={{ 
              backgroundColor: '#fef2f2', 
              border: '1px solid #fecaca', 
              marginBottom: '24px' 
            }}
          >
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5" style={{ color: '#ef4444' }} />
              <span style={{ color: '#b91c1c', fontWeight: 500 }}>
                {error || apiError}
              </span>
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        {!isProcessing && !results && (
          <div className="card">
            <h2 className="text-xl font-bold mb-4" style={{ color: '#1f2937' }}>
              🚀 워크플로우 실행
            </h2>
            <div className="flex space-x-4">
              <button
                onClick={handleRunDemo}
                disabled={serverStatus !== 'online' || loading}
                className="btn-primary flex items-center space-x-2"
              >
                <PlayCircle className="w-5 h-5" />
                <span>데모 워크플로우 실행</span>
              </button>
            </div>
            
            <p className="text-sm mt-4" style={{ color: '#4b5563' }}>
              💡 데모를 실행하여 시스템을 테스트해보세요.
            </p>
          </div>
        )}

        {/* 로딩 표시 */}
        {isProcessing && (
          <div className="card text-center">
            <div className="flex flex-col items-center space-y-4">
              <RefreshCw 
                className="w-12 h-12" 
                style={{ 
                  color: '#2563eb',
                  animation: 'spin 1s linear infinite' 
                }} 
              />
              <h3 className="text-lg font-semibold">데모 워크플로우 실행 중...</h3>
              <p className="text-sm" style={{ color: '#4b5563' }}>
                거래내역 분류 및 계산을 진행하고 있습니다.
              </p>
            </div>
          </div>
        )}

        {/* 결과 표시 */}
        {results && (
          <div className="space-y-8">
            {/* 기본 결과 */}
            <div className="card">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                워크플로우 완료
              </h2>
              
              <div className="grid grid-cols-1 md-grid-cols-3" style={{ gap: '16px' }}>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">처리된 거래내역</h3>
                  <p className="text-2xl font-bold text-blue-900">
                    {results.workflow?.summary?.inputTransactions || 0}건
                  </p>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">분류 완료</h3>
                  <p className="text-2xl font-bold text-green-900">
                    {results.workflow?.summary?.classifiedTransactions || 0}건
                  </p>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-800 mb-2">처리 시간</h3>
                  <p className="text-2xl font-bold text-purple-900">
                    {((results.workflow?.summary?.processingTime || 0) / 1000).toFixed(2)}초
                  </p>
                </div>
              </div>

              {results.workflow?.summary?.successRate && (
                <div className="mt-4 p-4" style={{ 
                  backgroundColor: '#f0fdf4', 
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px'
                }}>
                  <p className="text-green-800">
                    <strong>성공률:</strong> {results.workflow.summary.successRate}
                  </p>
                </div>
              )}
            </div>

            {/* 검증 결과 */}
            {results.validation && (
              <div className="card">
                <h2 className="text-xl font-bold mb-4">🔍 검증 결과</h2>
                
                <div className="grid grid-cols-1 md-grid-cols-3" style={{ gap: '16px' }}>
                  {Object.entries(results.validation.categories).map(([key, category]: [string, any]) => (
                    <div 
                      key={key}
                      className={`border rounded-lg p-4 ${
                        category.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <h4 className="font-medium mb-2 capitalize">{key}</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>정확도:</span>
                          <span className={`font-semibold ${category.passed ? 'text-green-600' : 'text-red-600'}`}>
                            {category.accuracy.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>처리량:</span>
                          <span className="font-medium">
                            {'processed' in category ? category.processed : category.completed}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>상태:</span>
                          <span className={`font-medium ${category.passed ? 'text-green-600' : 'text-red-600'}`}>
                            {category.passed ? '통과' : '실패'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <p className="text-lg font-semibold">
                    종합 점수: <span style={{ color: results.validation.score >= 70 ? '#16a34a' : '#dc2626' }}>
                      {results.validation.score.toFixed(1)}%
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* 재실행 버튼 */}
            <div className="card text-center">
              <button
                onClick={handleReset}
                className="btn-primary flex items-center space-x-2 mx-auto"
              >
                <RefreshCw className="w-5 h-5" />
                <span>새 워크플로우 실행</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SimpleDashboard;