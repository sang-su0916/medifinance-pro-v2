// 데이터 타입 정의
export interface Transaction {
  날짜: string;
  항목: string;
  금액: number;
  보험유형?: string;
  진료과?: string;
  거래처: string;
  비고?: string;
}

export interface ClassificationResult {
  classifiedTransactions: Transaction[];
  summary: {
    totalTransactions: number;
    classified: number;
    accuracy: number;
    needsReview: number;
  };
  breakdown: {
    [category: string]: {
      count: number;
      amount: number;
    };
  };
}

export interface CalculationResult {
  formulasExecuted: number;
  totalFormulas: number;
  accuracy: number;
  correctMatches: number;
  mismatches: number;
  results: {
    [formula: string]: any;
  };
}

export interface ValidationResult {
  score: number;
  passed: boolean;
  timestamp: string;
  categories: {
    classification: {
      accuracy: number;
      processed: number;
      passed: boolean;
    };
    calculation: {
      accuracy: number;
      processed: number;
      passed: boolean;
    };
    workflow: {
      accuracy: number;
      completed: number;
      total: number;
      passed: boolean;
      processed?: number; // workflow에도 processed 추가
    };
  };
  recommendations: Array<{
    category: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    message: string;
  }>;
  issues: string[];
}

export interface WorkflowResult {
  success: boolean;
  summary: {
    inputTransactions: number;
    classifiedTransactions: number;
    formulasExecuted: number;
    processingTime: number;
    successRate: string;
  };
  classification?: ClassificationResult;
  calculations?: CalculationResult;
  reports?: any[];
  excelAnalysis?: any;
  statistics?: any;
  errors?: string[];
}

export interface ProgressData {
  stage: string;
  progress: number;
  message: string;
  details?: {
    processed: number;
    total: number;
    currentItem?: string;
  };
}

export interface DashboardState {
  isProcessing: boolean;
  currentStage: string;
  progress: ProgressData | null;
  results: WorkflowResult | null;
  validation: ValidationResult | null;
  error: string | null;
}