import React, { useState, useEffect } from 'react';
import { Activity, Server, AlertCircle, PlayCircle, RefreshCw, Clock } from 'lucide-react';
import { useAPI } from '../hooks/useAPI';
import { DashboardState } from '../types';
import FileUploader from './FileUploader';
import ProgressCard from './ProgressCard';
import ClassificationResults from './ClassificationResults';
import CalculationResults from './CalculationResults';
import ComparisonResults from './ComparisonResults';

const Dashboard: React.FC = () => {
  const [state, setState] = useState<DashboardState>({
    isProcessing: false,
    currentStage: '',
    progress: null,
    results: null,
    validation: null,
    error: null,
  });

  const [selectedFiles, setSelectedFiles] = useState<{
    rawData?: File;
    automation?: File;
  }>({});

  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const { 
    loading, 
    error: apiError, 
    healthCheck, 
    runDemoWorkflow, 
    processExcelWorkflow,
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
    const interval = setInterval(checkServerHealth, 30000); // 30초마다 확인
    
    return () => clearInterval(interval);
  }, [healthCheck]);

  // 데모 워크플로우 실행
  const handleRunDemo = async () => {
    try {
      setState(prev => ({
        ...prev,
        isProcessing: true,
        currentStage: 'demo',
        error: null,
        progress: {
          stage: 'demo',
          progress: 0,
          message: '데모 워크플로우 시작 중...',
        }
      }));

      // 진행률 시뮬레이션
      const progressSteps = [
        { progress: 20, message: '데모 데이터 생성 중...' },
        { progress: 40, message: '거래내역 분류 중...' },
        { progress: 60, message: 'SUMIFS 계산 실행 중...' },
        { progress: 80, message: '결과 검증 중...' },
        { progress: 100, message: '데모 완료!' }
      ];

      for (const step of progressSteps) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setState(prev => ({
          ...prev,
          progress: {
            stage: 'demo',
            ...step
          }
        }));
      }

      const result = await runDemoWorkflow();
      
      // 검증 이력 조회
      const validationHistory = await getValidationHistory(1);
      const latestValidation = validationHistory?.[0];

      setState(prev => ({
        ...prev,
        isProcessing: false,
        results: result,
        validation: latestValidation,
        progress: null
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: '데모 실행 중 오류가 발생했습니다.',
        progress: null
      }));
    }
  };

  // Excel 파일 처리
  const handleProcessExcel = async () => {
    if (!selectedFiles.rawData) {
      setState(prev => ({ ...prev, error: '로우데이터 파일을 선택해주세요.' }));
      return;
    }

    try {
      setState(prev => ({
        ...prev,
        isProcessing: true,
        currentStage: 'processing',
        error: null,
        progress: {
          stage: 'processing',
          progress: 0,
          message: 'Excel 파일 처리 시작...',
        }
      }));

      // 실제로는 파일을 서버에 업로드하고 경로를 받아야 함
      // 여기서는 데모용으로 고정된 경로 사용
      const rawDataPath = '/path/to/raw/data.xlsx'; // 실제 업로드 구현 필요
      const automationPath = selectedFiles.automation ? '/path/to/automation.xlsx' : undefined;

      const result = await processExcelWorkflow(rawDataPath, automationPath);
      
      const validationHistory = await getValidationHistory(1);
      const latestValidation = validationHistory?.[0];

      setState(prev => ({
        ...prev,
        isProcessing: false,
        results: result,
        validation: latestValidation,
        progress: null
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: 'Excel 파일 처리 중 오류가 발생했습니다.',
        progress: null
      }));
    }
  };

  // 결과 초기화
  const handleReset = () => {
    setState({
      isProcessing: false,
      currentStage: '',
      progress: null,
      results: null,
      validation: null,
      error: null,
    });
    setSelectedFiles({});
  };

  const getServerStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100';
      case 'offline': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getServerStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <Server className="w-4 h-4" />;
      case 'offline': return <AlertCircle className="w-4 h-4" />;
      default: return <RefreshCw className="w-4 h-4 animate-spin" />;
    }
  };

  return (
    <div className="dashboard-container">
      {/* 헤더 */}
      <header style={{ background: 'white', borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
        <div className="max-w-7xl mx-auto" style={{ padding: '0 16px' }}>
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Activity className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  MediFinance Pro v2
                </h1>
                <p className="text-sm text-gray-600">병원 재무 자동화 대시보드</p>
              </div>
            </div>
            
            {/* 서버 상태 */}
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${getServerStatusColor(serverStatus)}`}>
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
      <main className="max-w-7xl mx-auto py-8" style={{ padding: '32px 16px' }}>
        
        {/* 에러 메시지 */}
        {(state.error || apiError) && (
          <div className="card" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', marginBottom: '24px' }}>
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5" style={{ color: '#ef4444' }} />
              <span style={{ color: '#b91c1c', fontWeight: 500 }}>
                {state.error || apiError}
              </span>
            </div>
          </div>
        )}

        {/* 파일 업로드 섹션 */}
        {!state.results && (
          <div className="mb-8">
            <FileUploader 
              onFilesSelected={setSelectedFiles}
              isProcessing={state.isProcessing}
            />
          </div>
        )}

        {/* 액션 버튼 */}
        {!state.isProcessing && !state.results && (
          <div className="card mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">🚀 워크플로우 실행</h2>
            <div className="flex space-x-4" style={{ flexWrap: 'wrap', gap: '16px' }}>
              <button
                onClick={handleRunDemo}
                disabled={serverStatus !== 'online' || loading}
                className="btn-primary flex items-center space-x-2"
              >
                <PlayCircle className="w-5 h-5" />
                <span>데모 워크플로우 실행</span>
              </button>
              
              <button
                onClick={handleProcessExcel}
                disabled={serverStatus !== 'online' || !selectedFiles.rawData || loading}
                className="btn-secondary flex items-center space-x-2"
              >
                <Activity className="w-5 h-5" />
                <span>Excel 파일 처리</span>
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mt-4">
              💡 데모를 먼저 실행해보거나, 로우데이터 파일을 업로드하여 실제 워크플로우를 실행하세요.
            </p>
          </div>
        )}

        {/* 진행률 표시 */}
        {state.isProcessing && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <Clock className="w-6 h-6 mr-2 text-blue-600" />
              실시간 진행률
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ProgressCard 
                title="📁 로우데이터 업로드"
                progress={state.progress?.stage === 'demo' || state.progress?.stage === 'processing' ? 
                  { stage: 'upload', progress: 100, message: '완료' } : null}
                isComplete={true}
              />
              
              <ProgressCard 
                title="📊 분류 진행률"
                progress={state.progress}
                isComplete={state.progress?.progress === 100}
              />
              
              <ProgressCard 
                title="⚡ 계산 진행률"
                progress={state.progress && state.progress.progress > 60 ? {
                  stage: 'calculation',
                  progress: Math.min((state.progress.progress - 60) * 2.5, 100),
                  message: 'SUMIFS 계산 중...'
                } : null}
                isComplete={state.progress?.progress === 100}
              />
            </div>
          </div>
        )}

        {/* 결과 표시 */}
        {state.results && (
          <div className="space-y-8">
            {/* 분류 결과 */}
            {state.results.classification && (
              <ClassificationResults results={state.results.classification} />
            )}

            {/* 계산 결과 */}
            {state.results.calculations && (
              <CalculationResults results={state.results.calculations} />
            )}

            {/* 비교 결과 */}
            <ComparisonResults 
              workflowResult={state.results}
              validationResult={state.validation}
            />

            {/* 재실행 버튼 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  onClick={handleReset}
                  className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>새 워크플로우 실행</span>
                </button>
                
                <button
                  onClick={handleRunDemo}
                  disabled={serverStatus !== 'online'}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  <PlayCircle className="w-5 h-5" />
                  <span>데모 다시 실행</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;