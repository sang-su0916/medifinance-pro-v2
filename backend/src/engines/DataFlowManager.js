/**
 * 데이터 플로우 관리자
 * 시트간 의존성 처리, 계산 순서 관리, 실시간 업데이트
 */

class DataFlowManager {
  constructor() {
    this.dependencyGraph = new Map(); // 시트간 의존성 그래프
    this.executionQueue = []; // 실행 대기열
    this.sheetStatus = new Map(); // 시트별 상태
    this.updateSubscribers = new Map(); // 업데이트 구독자들
    this.processingStats = {
      totalSteps: 0,
      completedSteps: 0,
      errors: [],
      startTime: null,
      endTime: null
    };
  }

  /**
   * 데이터 플로우 초기화 및 실행
   * @param {Object} rawData - 원시 데이터
   * @param {Object} classificationEngine - 분류 엔진
   * @param {Object} calculationEngine - 계산 엔진
   * @returns {Object} 실행 결과
   */
  async executeDataFlow(rawData, classificationEngine, calculationEngine) {
    this.processingStats.startTime = Date.now();
    
    try {
      // 1. 데이터 플로우 계획 수립
      const executionPlan = await this.createExecutionPlan(rawData);
      this.processingStats.totalSteps = executionPlan.steps.length;

      console.log(`📊 데이터 플로우 시작: ${this.processingStats.totalSteps}개 단계`);

      // 2. 단계별 실행
      const results = {};
      
      for (const step of executionPlan.steps) {
        console.log(`🔄 실행 중: ${step.name} (${this.processingStats.completedSteps + 1}/${this.processingStats.totalSteps})`);
        
        try {
          const stepResult = await this.executeStep(step, {
            rawData,
            classificationEngine,
            calculationEngine,
            previousResults: results
          });
          
          results[step.id] = stepResult;
          this.processingStats.completedSteps++;
          
          // 실시간 진행률 알림
          this.notifyProgress({
            step: step.name,
            progress: (this.processingStats.completedSteps / this.processingStats.totalSteps) * 100,
            result: stepResult
          });
          
        } catch (error) {
          this.processingStats.errors.push({
            step: step.id,
            error: error.message,
            timestamp: Date.now()
          });
          
          // 중요 단계 실패 시 전체 프로세스 중단
          if (step.critical) {
            throw new Error(`중요 단계 실패: ${step.name} - ${error.message}`);
          }
          
          console.warn(`⚠️ 단계 실패 (계속 진행): ${step.name} - ${error.message}`);
        }
      }

      // 3. 최종 검증 및 결과 집계
      const finalResults = await this.validateAndAggregateResults(results);
      
      this.processingStats.endTime = Date.now();
      
      return {
        success: true,
        results: finalResults,
        statistics: this.getProcessingStatistics(),
        errors: this.processingStats.errors
      };

    } catch (error) {
      this.processingStats.endTime = Date.now();
      
      return {
        success: false,
        error: error.message,
        statistics: this.getProcessingStatistics(),
        errors: this.processingStats.errors
      };
    }
  }

  /**
   * 실행 계획 수립
   * @param {Object} rawData - 원시 데이터
   * @returns {Object} 실행 계획
   */
  async createExecutionPlan(rawData) {
    const plan = {
      steps: [],
      dependencies: {},
      estimatedTime: 0
    };

    // 단계별 실행 계획
    const steps = [
      {
        id: 'data_validation',
        name: '데이터 검증',
        type: 'validation',
        critical: true,
        estimatedTime: 5000, // 5초
        dependencies: []
      },
      {
        id: 'data_preprocessing',
        name: '데이터 전처리',
        type: 'preprocessing',
        critical: true,
        estimatedTime: 10000, // 10초
        dependencies: ['data_validation']
      },
      {
        id: 'account_classification',
        name: '계정과목 자동분류',
        type: 'classification',
        critical: true,
        estimatedTime: 30000, // 30초
        dependencies: ['data_preprocessing']
      },
      {
        id: 'sheet_preparation',
        name: '시트 데이터 준비',
        type: 'preparation',
        critical: true,
        estimatedTime: 15000, // 15초
        dependencies: ['account_classification']
      },
      {
        id: 'formula_execution',
        name: 'Excel 수식 실행',
        type: 'calculation',
        critical: true,
        estimatedTime: 60000, // 60초
        dependencies: ['sheet_preparation']
      },
      {
        id: 'result_validation',
        name: '결과 검증',
        type: 'validation',
        critical: false,
        estimatedTime: 20000, // 20초
        dependencies: ['formula_execution']
      },
      {
        id: 'report_generation',
        name: '리포트 생성',
        type: 'reporting',
        critical: false,
        estimatedTime: 25000, // 25초
        dependencies: ['result_validation']
      }
    ];

    // 의존성 순서로 정렬
    plan.steps = this.topologicalSort(steps);
    plan.estimatedTime = steps.reduce((sum, step) => sum + step.estimatedTime, 0);

    return plan;
  }

  /**
   * 개별 단계 실행
   * @param {Object} step - 실행할 단계
   * @param {Object} context - 실행 컨텍스트
   * @returns {Object} 단계 실행 결과
   */
  async executeStep(step, context) {
    const stepStartTime = Date.now();
    
    let result;
    
    switch (step.type) {
      case 'validation':
        result = await this.executeValidationStep(step, context);
        break;
      case 'preprocessing':
        result = await this.executePreprocessingStep(step, context);
        break;
      case 'classification':
        result = await this.executeClassificationStep(step, context);
        break;
      case 'preparation':
        result = await this.executePreparationStep(step, context);
        break;
      case 'calculation':
        result = await this.executeCalculationStep(step, context);
        break;
      case 'reporting':
        result = await this.executeReportingStep(step, context);
        break;
      default:
        throw new Error(`알 수 없는 단계 타입: ${step.type}`);
    }
    
    const executionTime = Date.now() - stepStartTime;
    
    return {
      ...result,
      metadata: {
        stepId: step.id,
        stepName: step.name,
        executionTime: executionTime,
        timestamp: Date.now()
      }
    };
  }

  /**
   * 데이터 검증 단계
   * @param {Object} step - 단계 정보
   * @param {Object} context - 실행 컨텍스트
   * @returns {Object} 검증 결과
   */
  async executeValidationStep(step, context) {
    const { rawData } = context;
    
    const validationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      statistics: {}
    };

    // 기본 데이터 존재 확인
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
      validationResult.isValid = false;
      validationResult.errors.push('입력 데이터가 비어있거나 잘못된 형식입니다.');
      return validationResult;
    }

    // 데이터 구조 검증
    const requiredFields = ['날짜', '항목', '금액'];
    const fieldPresence = {};
    
    rawData.forEach((row, index) => {
      requiredFields.forEach(field => {
        if (!fieldPresence[field]) {
          fieldPresence[field] = 0;
        }
        
        if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
          fieldPresence[field]++;
        }
      });
    });

    // 필수 필드 존재율 확인
    requiredFields.forEach(field => {
      const presence = (fieldPresence[field] / rawData.length) * 100;
      if (presence < 80) {
        validationResult.warnings.push(`필수 필드 '${field}'의 존재율이 낮습니다: ${presence.toFixed(1)}%`);
      }
      validationResult.statistics[`${field}_presence`] = presence;
    });

    validationResult.statistics.totalRows = rawData.length;
    validationResult.statistics.validRows = rawData.filter(row => 
      requiredFields.every(field => row[field] !== undefined && row[field] !== null && row[field] !== '')
    ).length;

    return validationResult;
  }

  /**
   * 데이터 전처리 단계
   * @param {Object} step - 단계 정보
   * @param {Object} context - 실행 컨텍스트
   * @returns {Object} 전처리 결과
   */
  async executePreprocessingStep(step, context) {
    const { rawData } = context;
    
    const preprocessedData = [];
    const processingLog = [];

    for (let i = 0; i < rawData.length; i++) {
      const row = { ...rawData[i] };
      
      try {
        // 날짜 정규화 - 다양한 날짜 필드 지원
        const dateFields = ['날짜', 'date', '수납일', '진료일', '거래일'];
        dateFields.forEach(field => {
          if (row[field]) {
            row[field] = this.normalizeDate(row[field]);
            // 표준화된 날짜 필드도 설정
            if (!row.날짜 && field !== '날짜') {
              row.날짜 = row[field];
            }
          }
        });
        
        // 금액 정규화 - 다양한 금액 필드 지원
        const amountFields = ['금액', 'amount', '총진료비', '수납액', '환자부담액', '공급가액'];
        amountFields.forEach(field => {
          if (row[field] && typeof row[field] === 'number' && row[field] > 0) {
            row[field] = this.normalizeAmount(row[field]);
            // 표준화된 금액 필드도 설정 (가장 큰 금액을 주요 금액으로)
            if (!row.금액 || row[field] > row.금액) {
              row.금액 = row[field];
            }
          }
        });
        
        // 텍스트 정규화 - 실제 병원 데이터 필드 지원
        const textFields = ['항목', '거래처', '비고', '보험종류', '보험유형', '성명', '담당의', '외래입원구분', '진료구분'];
        textFields.forEach(field => {
          if (row[field]) {
            row[field] = this.normalizeText(row[field]);
          }
        });
        
        // 병원 데이터 표준화 필드 매핑
        if (row.보험종류 && !row.보험유형) {
          row.보험유형 = row.보험종류;
        }
        if (row.성명 && !row.거래처) {
          row.거래처 = row.성명;
        }
        if (row.외래입원구분 && !row.항목) {
          row.항목 = row.외래입원구분 + '진료';
        }
        
        preprocessedData.push(row);
        
      } catch (error) {
        processingLog.push({
          rowIndex: i,
          error: error.message,
          originalData: rawData[i]
        });
      }
    }

    return {
      processedData: preprocessedData,
      originalCount: rawData.length,
      processedCount: preprocessedData.length,
      processingLog: processingLog
    };
  }

  /**
   * 계정분류 단계
   * @param {Object} step - 단계 정보
   * @param {Object} context - 실행 컨텍스트
   * @returns {Object} 분류 결과
   */
  async executeClassificationStep(step, context) {
    const { classificationEngine, previousResults } = context;
    const preprocessedData = previousResults.data_preprocessing.processedData;
    
    console.log(`📊 분류 시작: ${preprocessedData?.length || 0}개 전처리된 데이터`);
    
    // 분류 엔진을 통한 자동 분류
    const classificationResult = await classificationEngine.classifyTransactions(preprocessedData);
    
    console.log(`✅ 분류 완료: 성공 ${classificationResult.classified?.length || 0}건, 실패 ${classificationResult.failed?.length || 0}건`);
    
    const result = {
      classifiedTransactions: classificationResult.classified,
      uncertainCases: classificationResult.uncertain,
      failedCases: classificationResult.failed,
      statistics: classificationResult.statistics,
      processingTime: classificationResult.processingTime
    };
    
    console.log(`📋 분류 결과 구조:`, Object.keys(result));
    
    return result;
  }

  /**
   * 시트 준비 단계
   * @param {Object} step - 단계 정보
   * @param {Object} context - 실행 컨텍스트
   * @returns {Object} 준비 결과
   */
  async executePreparationStep(step, context) {
    const { calculationEngine, previousResults } = context;
    const classificationResult = previousResults.account_classification;
    
    // 계산 엔진에서 시트 데이터 준비
    await calculationEngine.prepareSheetData(classificationResult);
    
    return {
      sheetsCreated: Array.from(calculationEngine.sheetData.keys()),
      dataDistribution: this.analyzeDataDistribution(classificationResult.classifiedTransactions)
    };
  }

  /**
   * 계산 실행 단계
   * @param {Object} step - 단계 정보
   * @param {Object} context - 실행 컨텍스트
   * @returns {Object} 계산 결과
   */
  async executeCalculationStep(step, context) {
    const { calculationEngine, previousResults } = context;
    const classificationResult = previousResults.account_classification;
    
    // 사전 정의된 수식들 (실제로는 Excel 파일에서 추출)
    const formulas = this.generateStandardFormulas();
    
    // 수식 실행
    const calculationResult = await calculationEngine.executeCalculations(classificationResult, formulas);
    
    return calculationResult;
  }

  /**
   * 리포트 생성 단계
   * @param {Object} step - 단계 정보
   * @param {Object} context - 실행 컨텍스트
   * @returns {Object} 리포트 결과
   */
  async executeReportingStep(step, context) {
    const { previousResults } = context;
    
    const reports = {
      incomeStatement: this.generateIncomeStatement(previousResults),
      balanceSheet: this.generateBalanceSheet(previousResults),
      analysisReport: this.generateAnalysisReport(previousResults),
      classificationSummary: this.generateClassificationSummary(previousResults)
    };
    
    return {
      reports: reports,
      generatedAt: new Date().toISOString(),
      reportCount: Object.keys(reports).length
    };
  }

  /**
   * 표준 수식 생성 (Excel 분석 결과 기반)
   * @returns {Array} 수식 목록
   */
  generateStandardFormulas() {
    return [
      {
        id: 'monthly_revenue_sum_1',
        type: 'SUMIFS',
        sheet: '월별요약손익계산서(추정)',
        cell: 'C3',
        formula: 'SUMIFS(매출내역total!$G:$G,매출내역total!$A:$A,C$2,매출내역total!$J:$J,$B3)'
      },
      {
        id: 'monthly_revenue_sum_2',
        type: 'SUMIFS',
        sheet: '월별요약손익계산서(추정)',
        cell: 'D3',
        formula: 'SUMIFS(매출내역total!$G:$G,매출내역total!$A:$A,D$2,매출내역total!$J:$J,$B3)'
      },
      {
        id: 'monthly_revenue_sum_3',
        type: 'SUMIFS',
        sheet: '월별요약손익계산서(추정)',
        cell: 'E3',
        formula: 'SUMIFS(매출내역total!$G:$G,매출내역total!$A:$A,E$2,매출내역total!$J:$J,$B3)'
      },
      {
        id: 'transaction_lookup',
        type: 'INDEX_MATCH',
        sheet: '출',
        cell: 'J2',
        formula: 'INDEX(분!$A$2:$K$7102,MATCH(출!C2&출!I2,분!$C$2:$C$7102&분!$I$2:$I$7102,0),10)'
      }
      // ... 더 많은 수식들 (실제로는 456개)
    ];
  }

  /**
   * 위상정렬 (의존성 순서)
   * @param {Array} steps - 단계 목록
   * @returns {Array} 정렬된 단계 목록
   */
  topologicalSort(steps) {
    const inDegree = new Map();
    const adjList = new Map();
    
    // 초기화
    steps.forEach(step => {
      inDegree.set(step.id, 0);
      adjList.set(step.id, []);
    });
    
    // 의존성 그래프 구축
    steps.forEach(step => {
      step.dependencies.forEach(dep => {
        if (adjList.has(dep)) {
          adjList.get(dep).push(step.id);
          inDegree.set(step.id, inDegree.get(step.id) + 1);
        }
      });
    });
    
    // 위상정렬
    const queue = [];
    const result = [];
    
    inDegree.forEach((degree, id) => {
      if (degree === 0) {
        queue.push(id);
      }
    });
    
    while (queue.length > 0) {
      const current = queue.shift();
      const step = steps.find(s => s.id === current);
      result.push(step);
      
      adjList.get(current).forEach(neighbor => {
        inDegree.set(neighbor, inDegree.get(neighbor) - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      });
    }
    
    return result;
  }

  /**
   * 데이터 분포 분석
   * @param {Array} transactions - 거래내역
   * @returns {Object} 분포 분석 결과
   */
  analyzeDataDistribution(transactions) {
    const distribution = {
      byAccount: {},
      byMonth: {},
      byPatientType: {},
      totalAmount: 0,
      totalCount: transactions.length
    };

    transactions.forEach(transaction => {
      const account = transaction.account;
      const month = this.getMonth(transaction.metadata.date);
      const patientType = transaction.metadata.patientType;
      const amount = transaction.metadata.amount || 0;

      // 계정별 분포
      if (!distribution.byAccount[account]) {
        distribution.byAccount[account] = { count: 0, amount: 0 };
      }
      distribution.byAccount[account].count++;
      distribution.byAccount[account].amount += amount;

      // 월별 분포
      if (!distribution.byMonth[month]) {
        distribution.byMonth[month] = { count: 0, amount: 0 };
      }
      distribution.byMonth[month].count++;
      distribution.byMonth[month].amount += amount;

      // 환자유형별 분포
      if (patientType) {
        if (!distribution.byPatientType[patientType]) {
          distribution.byPatientType[patientType] = { count: 0, amount: 0 };
        }
        distribution.byPatientType[patientType].count++;
        distribution.byPatientType[patientType].amount += amount;
      }

      distribution.totalAmount += amount;
    });

    return distribution;
  }

  /**
   * 손익계산서 생성
   * @param {Object} results - 이전 단계 결과들
   * @returns {Object} 손익계산서
   */
  generateIncomeStatement(results) {
    const calculationResults = results.formula_execution.calculationResults;
    
    return {
      revenue: {
        외래수익: this.sumByAccount(results, '외래수익'),
        입원수익: this.sumByAccount(results, '입원수익'),
        기타수익: this.sumByAccount(results, '기타수익')
      },
      expenses: {
        의약품비: this.sumByAccount(results, '의약품비'),
        의료재료비: this.sumByAccount(results, '의료재료비'),
        급여: this.sumByAccount(results, '급여'),
        기타비용: this.sumByAccount(results, '기타비용')
      },
      netIncome: 0 // 계산 로직 추가 필요
    };
  }

  /**
   * 계정별 합계 계산
   * @param {Object} results - 결과 데이터
   * @param {string} account - 계정명
   * @returns {number} 합계
   */
  sumByAccount(results, account) {
    const transactions = results.account_classification.classifiedTransactions;
    return transactions
      .filter(t => t.account === account)
      .reduce((sum, t) => sum + (t.metadata.amount || 0), 0);
  }

  /**
   * 월 추출 헬퍼 함수
   * @param {string} dateStr - 날짜 문자열
   * @returns {number} 월
   */
  getMonth(dateStr) {
    try {
      return new Date(dateStr).getMonth() + 1;
    } catch {
      return 1;
    }
  }

  /**
   * 날짜 정규화
   * @param {string} dateStr - 원본 날짜
   * @returns {string} 정규화된 날짜
   */
  normalizeDate(dateStr) {
    try {
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
    } catch {
      return dateStr;
    }
  }

  /**
   * 금액 정규화
   * @param {any} amount - 원본 금액
   * @returns {number} 정규화된 금액
   */
  normalizeAmount(amount) {
    if (typeof amount === 'number') return amount;
    
    const cleanAmount = String(amount).replace(/[,\s]/g, '');
    const parsed = parseFloat(cleanAmount);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * 텍스트 정규화
   * @param {string} text - 원본 텍스트
   * @returns {string} 정규화된 텍스트
   */
  normalizeText(text) {
    return String(text).trim().replace(/\s+/g, ' ');
  }

  /**
   * 진행률 알림
   * @param {Object} progress - 진행률 정보
   */
  notifyProgress(progress) {
    // 실시간 업데이트 구독자들에게 알림
    this.updateSubscribers.forEach((callback, subscriberId) => {
      try {
        callback(progress);
      } catch (error) {
        console.warn(`구독자 ${subscriberId} 알림 실패:`, error);
      }
    });
  }

  /**
   * 진행률 구독 등록
   * @param {string} subscriberId - 구독자 ID
   * @param {Function} callback - 콜백 함수
   */
  subscribeToProgress(subscriberId, callback) {
    this.updateSubscribers.set(subscriberId, callback);
  }

  /**
   * 진행률 구독 해제
   * @param {string} subscriberId - 구독자 ID
   */
  unsubscribeFromProgress(subscriberId) {
    this.updateSubscribers.delete(subscriberId);
  }

  /**
   * 처리 통계 조회
   * @returns {Object} 처리 통계
   */
  getProcessingStatistics() {
    const totalTime = this.processingStats.endTime - this.processingStats.startTime;
    
    return {
      totalSteps: this.processingStats.totalSteps,
      completedSteps: this.processingStats.completedSteps,
      successRate: ((this.processingStats.completedSteps / this.processingStats.totalSteps) * 100).toFixed(2) + '%',
      totalProcessingTime: totalTime,
      averageStepTime: totalTime / this.processingStats.completedSteps,
      errorCount: this.processingStats.errors.length,
      errors: this.processingStats.errors
    };
  }

  /**
   * 결과 검증 및 집계
   * @param {Object} results - 단계별 결과
   * @returns {Object} 최종 결과
   */
  async validateAndAggregateResults(results) {
    const finalResults = {
      summary: {
        dataProcessed: results.data_preprocessing?.processedCount || 0,
        classificationsCompleted: results.account_classification?.classifiedTransactions?.length || 0,
        formulasExecuted: results.formula_execution?.formulasExecuted || 0,
        reportsGenerated: results.report_generation?.reportCount || 0
      },
      classification: results.account_classification,
      calculations: results.formula_execution,
      reports: results.report_generation?.reports,
      validation: {
        dataQuality: this.assessDataQuality(results),
        accuracyScore: this.calculateAccuracyScore(results),
        recommendations: this.generateRecommendations(results)
      }
    };

    return finalResults;
  }

  /**
   * 데이터 품질 평가
   * @param {Object} results - 결과 데이터
   * @returns {Object} 품질 평가
   */
  assessDataQuality(results) {
    const classification = results.account_classification;
    if (!classification) return { score: 0, issues: ['분류 결과 없음'] };

    const total = classification.classifiedTransactions.length + 
                  classification.uncertainCases.length + 
                  classification.failedCases.length;

    const qualityScore = (classification.classifiedTransactions.length / total) * 100;
    
    return {
      score: qualityScore.toFixed(2),
      totalProcessed: total,
      successful: classification.classifiedTransactions.length,
      uncertain: classification.uncertainCases.length,
      failed: classification.failedCases.length,
      issues: this.identifyQualityIssues(classification)
    };
  }

  /**
   * 품질 이슈 식별
   * @param {Object} classification - 분류 결과
   * @returns {Array} 이슈 목록
   */
  identifyQualityIssues(classification) {
    const issues = [];
    
    if (classification.failedCases.length > 0) {
      issues.push(`${classification.failedCases.length}건의 분류 실패`);
    }
    
    if (classification.uncertainCases.length > classification.classifiedTransactions.length * 0.1) {
      issues.push('불확실 케이스 비율이 높음 (10% 초과)');
    }
    
    return issues;
  }

  /**
   * 정확도 점수 계산
   * @param {Object} results - 결과 데이터
   * @returns {number} 정확도 점수
   */
  calculateAccuracyScore(results) {
    // 복합 정확도 점수 계산 로직
    const weights = {
      classification: 0.4,
      calculation: 0.3,
      validation: 0.3
    };
    
    let score = 0;
    
    // 분류 정확도
    if (results.account_classification) {
      const classificationAccuracy = this.assessDataQuality(results).score;
      score += (classificationAccuracy / 100) * weights.classification;
    }
    
    // 계산 정확도 (오류율 기반)
    if (results.formula_execution) {
      const calculationAccuracy = results.formula_execution.errors.length === 0 ? 1.0 : 
        Math.max(0, 1 - (results.formula_execution.errors.length / results.formula_execution.formulasExecuted));
      score += calculationAccuracy * weights.calculation;
    }
    
    // 검증 정확도
    score += 1.0 * weights.validation; // 기본값
    
    return Math.round(score * 100);
  }

  /**
   * 개선 권장사항 생성
   * @param {Object} results - 결과 데이터
   * @returns {Array} 권장사항 목록
   */
  generateRecommendations(results) {
    const recommendations = [];
    
    const classification = results.account_classification;
    if (classification) {
      if (classification.uncertainCases.length > 0) {
        recommendations.push({
          type: 'classification_improvement',
          message: `${classification.uncertainCases.length}건의 불확실 케이스 검토 필요`,
          priority: 'high'
        });
      }
      
      if (classification.failedCases.length > 0) {
        recommendations.push({
          type: 'data_quality',
          message: `${classification.failedCases.length}건의 분류 실패 케이스 데이터 품질 개선 필요`,
          priority: 'high'
        });
      }
    }
    
    const calculation = results.formula_execution;
    if (calculation && calculation.errors.length > 0) {
      recommendations.push({
        type: 'formula_fix',
        message: `${calculation.errors.length}개 수식 오류 수정 필요`,
        priority: 'critical'
      });
    }
    
    return recommendations;
  }
}

module.exports = DataFlowManager;