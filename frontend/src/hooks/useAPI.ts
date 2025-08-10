import { useState, useCallback } from 'react';
import axios, { AxiosResponse } from 'axios';
import { WorkflowResult, ProgressData } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5분 타임아웃
  headers: {
    'Content-Type': 'application/json',
  },
});

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const useAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 헬스체크
  const healthCheck = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response: AxiosResponse = await apiClient.get('/health');
      return response.data;
    } catch (err: any) {
      setError(err.message || '헬스체크 실패');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 데모 워크플로우 실행
  const runDemoWorkflow = useCallback(async (): Promise<WorkflowResult> => {
    try {
      setLoading(true);
      setError(null);
      const response: AxiosResponse = await apiClient.post('/api/workflow/demo');
      return response.data.data;
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || '데모 실행 실패');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Excel 파일 처리 워크플로우
  const processExcelWorkflow = useCallback(async (
    rawDataFilePath: string, 
    automationExcelPath?: string
  ): Promise<WorkflowResult> => {
    try {
      setLoading(true);
      setError(null);
      const response: AxiosResponse = await apiClient.post('/api/workflow/process-excel', {
        rawDataFilePath,
        automationExcelPath,
      });
      return response.data.data;
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Excel 처리 실패');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 분류 실행
  const runClassification = useCallback(async (transactions: any[]) => {
    try {
      setLoading(true);
      setError(null);
      const response: AxiosResponse = await apiClient.post('/api/classification/classify', {
        transactions,
      });
      return response.data.data;
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || '분류 실행 실패');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 계산 실행
  const runCalculation = useCallback(async (classifiedData: any, formulas: any[]) => {
    try {
      setLoading(true);
      setError(null);
      const response: AxiosResponse = await apiClient.post('/api/calculation/execute', {
        classifiedData,
        formulas,
      });
      return response.data.data;
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || '계산 실행 실패');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 검증 실행
  const runValidation = useCallback(async (systemResults: any, excelResults: any) => {
    try {
      setLoading(true);
      setError(null);
      const response: AxiosResponse = await apiClient.post('/api/validation/validate', {
        systemResults,
        excelResults,
      });
      return response.data.data;
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || '검증 실행 실패');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 검증 이력 조회
  const getValidationHistory = useCallback(async (limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      const response: AxiosResponse = await apiClient.get(`/api/validation/history?limit=${limit}`);
      return response.data.data;
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || '검증 이력 조회 실패');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 정확도 트렌드 조회
  const getAccuracyTrend = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response: AxiosResponse = await apiClient.get('/api/validation/trend');
      return response.data.data;
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || '트렌드 조회 실패');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    healthCheck,
    runDemoWorkflow,
    processExcelWorkflow,
    runClassification,
    runCalculation,
    runValidation,
    getValidationHistory,
    getAccuracyTrend,
  };
};

// 실시간 진행률 구독
export const subscribeToProgress = (
  sessionId: string, 
  onProgress: (progress: ProgressData) => void,
  onError: (error: string) => void
) => {
  const eventSource = new EventSource(`${API_BASE_URL}/api/dataflow/progress/${sessionId}`);
  
  eventSource.onmessage = (event) => {
    try {
      const progressData = JSON.parse(event.data);
      onProgress(progressData);
    } catch (err) {
      console.error('Progress parsing error:', err);
    }
  };

  eventSource.onerror = (error) => {
    console.error('EventSource error:', error);
    onError('실시간 진행률 연결 실패');
    eventSource.close();
  };

  return () => {
    eventSource.close();
  };
};