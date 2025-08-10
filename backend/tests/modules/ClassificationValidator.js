/**
 * 계정과목 자동분류 정확도 검증 모듈
 * 
 * 실제 병원 데이터를 이용해 JavaScript 분류 엔진과 Excel 수작업 결과를 비교
 */

const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

class ClassificationValidator {
  constructor() {
    this.testCases = [];
    this.benchmarkData = new Map(); // Excel 기준 데이터
    this.validationRules = this.initializeValidationRules();
  }

  /**
   * 분류 정확도 검증 실행
   * @param {Object} classificationEngine - 분류 엔진
   * @param {Array} rawTransactions - 원시 거래 데이터
   * @param {Object} excelReference - Excel 참조 데이터
   * @returns {Object} 검증 결과
   */
  async validateClassificationAccuracy(classificationEngine, rawTransactions, excelReference) {
    console.log('🏥 계정과목 분류 정확도 검증 시작...');
    
    const validationResult = {
      summary: {},
      detailed: {},
      errors: [],
      recommendations: []
    };

    try {
      // 1. 테스트 케이스 준비
      await this.prepareTestCases(rawTransactions, excelReference);
      
      // 2. JavaScript 엔진으로 분류 실행
      const jsResults = await this.runJavaScriptClassification(classificationEngine, rawTransactions);
      
      // 3. Excel 기준 데이터 추출
      const excelResults = await this.extractExcelClassifications(excelReference);
      
      // 4. 정확도 비교 분석
      const accuracyAnalysis = this.compareClassificationResults(jsResults, excelResults);
      
      // 5. 세부 분석 수행
      const detailedAnalysis = this.performDetailedAnalysis(jsResults, excelResults);
      
      // 6. 결과 종합
      validationResult.summary = this.generateSummary(accuracyAnalysis, jsResults, excelResults);
      validationResult.detailed = detailedAnalysis;
      validationResult.errors = accuracyAnalysis.errors || [];
      validationResult.recommendations = this.generateRecommendations(accuracyAnalysis);

      console.log(`✅ 분류 검증 완료 - 정확도: ${validationResult.summary.overallAccuracy?.toFixed(2) || 0}%`);
      
      return validationResult;

    } catch (error) {
      console.error('❌ 분류 검증 실패:', error.message);
      throw error;
    }
  }

  /**
   * 테스트 케이스 준비
   */
  async prepareTestCases(rawTransactions, excelReference) {
    this.testCases = rawTransactions.map((transaction, index) => ({
      id: `test_${index}`,
      originalData: transaction,
      expectedAccount: null, // Excel에서 추출
      jsResult: null,        // JavaScript 결과
      metadata: {
        dataQuality: this.assessDataQuality(transaction),
        complexity: this.assessComplexity(transaction),
        category: this.categorizeTransaction(transaction)
      }
    }));

    console.log(`📋 테스트 케이스 준비 완료: ${this.testCases.length}건`);
  }

  /**
   * JavaScript 분류 실행
   */
  async runJavaScriptClassification(classificationEngine, rawTransactions) {
    const startTime = Date.now();
    
    const results = await classificationEngine.classifyTransactions(rawTransactions);
    
    const processingTime = Date.now() - startTime;
    
    return {
      classified: results.classified,
      uncertain: results.uncertain,
      failed: results.failed,
      statistics: results.statistics,
      processingTime: processingTime,
      performance: {
        transactionsPerSecond: rawTransactions.length / (processingTime / 1000),
        averageConfidence: this.calculateAverageConfidence(results.classified)
      }
    };
  }

  /**
   * Excel 분류 결과 추출
   */
  async extractExcelClassifications(excelReference) {
    const classifications = [];
    
    // Excel 파일에서 계정과목이 지정된 시트 찾기
    const targetSheets = ['매출내역total', '출', '분'];
    
    targetSheets.forEach(sheetName => {
      if (excelReference.data[sheetName]) {
        const sheetData = excelReference.data[sheetName];
        
        // 헤더 행 찾기
        const headerRow = sheetData[0];
        const accountColumnIndex = this.findAccountColumnIndex(headerRow);
        
        if (accountColumnIndex !== -1) {
          // 데이터 행들에서 분류 결과 추출
          for (let i = 1; i < sheetData.length; i++) {
            const row = sheetData[i];
            if (row && row[accountColumnIndex]) {
              const classification = {
                originalData: this.reconstructTransactionFromRow(row, headerRow),
                account: row[accountColumnIndex],
                confidence: 1.0, // Excel은 수작업이므로 신뢰도 100%
                source: sheetName,
                rowIndex: i
              };
              
              classifications.push(classification);
            }
          }
        }
      }
    });

    return {
      classifications: classifications,
      totalCount: classifications.length,
      byAccount: this.groupByAccount(classifications),
      bySheet: this.groupBySheet(classifications)
    };
  }

  /**
   * 분류 결과 비교 분석
   */
  compareClassificationResults(jsResults, excelResults) {
    const comparison = {
      matched: [],
      mismatched: [],
      jsOnly: [],
      excelOnly: [],
      statistics: {}
    };

    // JavaScript 결과를 Excel 결과와 매칭
    jsResults.classified.forEach(jsItem => {
      const matchingExcelItem = this.findMatchingExcelClassification(jsItem, excelResults.classifications);
      
      if (matchingExcelItem) {
        if (jsItem.account === matchingExcelItem.account) {
          comparison.matched.push({
            jsResult: jsItem,
            excelResult: matchingExcelItem,
            confidence: jsItem.confidence
          });
        } else {
          comparison.mismatched.push({
            jsResult: jsItem,
            excelResult: matchingExcelItem,
            jsMReasoning: jsItem.appliedRules || [],
            difference: {
              js: jsItem.account,
              excel: matchingExcelItem.account,
              confidence: jsItem.confidence
            }
          });
        }
      } else {
        comparison.jsOnly.push(jsItem);
      }
    });

    // Excel 전용 분류 찾기 (JavaScript에서 분류되지 않은 것)
    excelResults.classifications.forEach(excelItem => {
      const hasJsMatch = jsResults.classified.some(jsItem => 
        this.isTransactionMatch(jsItem.originalData, excelItem.originalData)
      );
      
      if (!hasJsMatch) {
        comparison.excelOnly.push(excelItem);
      }
    });

    // 통계 계산
    comparison.statistics = this.calculateComparisonStatistics(comparison);

    return comparison;
  }

  /**
   * 세부 분석 수행
   */
  performDetailedAnalysis(jsResults, excelResults) {
    return {
      accountAccuracy: this.analyzeAccountAccuracy(jsResults, excelResults),
      confidenceAnalysis: this.analyzeConfidenceLevels(jsResults),
      errorPatterns: this.identifyErrorPatterns(jsResults, excelResults),
      dataQualityImpact: this.analyzeDataQualityImpact(jsResults),
      performanceMetrics: this.calculatePerformanceMetrics(jsResults),
      improvementOpportunities: this.identifyImprovementOpportunities(jsResults, excelResults)
    };
  }

  /**
   * 계정별 정확도 분석
   */
  analyzeAccountAccuracy(jsResults, excelResults) {
    const accountStats = {};
    
    // 모든 계정 종류 수집
    const allAccounts = new Set();
    jsResults.classified.forEach(item => allAccounts.add(item.account));
    excelResults.classifications.forEach(item => allAccounts.add(item.account));
    
    Array.from(allAccounts).forEach(account => {
      const jsCount = jsResults.classified.filter(item => item.account === account).length;
      const excelCount = excelResults.classifications.filter(item => item.account === account).length;
      
      // 정확히 일치하는 분류 개수
      const correctCount = this.countCorrectClassifications(account, jsResults, excelResults);
      
      accountStats[account] = {
        jsCount: jsCount,
        excelCount: excelCount,
        correctCount: correctCount,
        accuracy: jsCount > 0 ? (correctCount / jsCount) * 100 : 0,
        precision: jsCount > 0 ? (correctCount / jsCount) * 100 : 0,
        recall: excelCount > 0 ? (correctCount / excelCount) * 100 : 0
      };
      
      // F1 점수 계산
      if (accountStats[account].precision + accountStats[account].recall > 0) {
        accountStats[account].f1Score = 2 * (accountStats[account].precision * accountStats[account].recall) / 
                                        (accountStats[account].precision + accountStats[account].recall);
      } else {
        accountStats[account].f1Score = 0;
      }
    });
    
    return accountStats;
  }

  /**
   * 신뢰도 수준 분석
   */
  analyzeConfidenceLevels(jsResults) {
    const confidenceRanges = {
      '0.9-1.0': [],
      '0.8-0.9': [],
      '0.7-0.8': [],
      '0.6-0.7': [],
      '0.5-0.6': [],
      'below-0.5': []
    };
    
    jsResults.classified.forEach(item => {
      const confidence = item.confidence;
      
      if (confidence >= 0.9) {
        confidenceRanges['0.9-1.0'].push(item);
      } else if (confidence >= 0.8) {
        confidenceRanges['0.8-0.9'].push(item);
      } else if (confidence >= 0.7) {
        confidenceRanges['0.7-0.8'].push(item);
      } else if (confidence >= 0.6) {
        confidenceRanges['0.6-0.7'].push(item);
      } else if (confidence >= 0.5) {
        confidenceRanges['0.5-0.6'].push(item);
      } else {
        confidenceRanges['below-0.5'].push(item);
      }
    });
    
    return {
      ranges: confidenceRanges,
      distribution: Object.keys(confidenceRanges).map(range => ({
        range: range,
        count: confidenceRanges[range].length,
        percentage: (confidenceRanges[range].length / jsResults.classified.length) * 100
      })),
      averageConfidence: jsResults.classified.reduce((sum, item) => sum + item.confidence, 0) / jsResults.classified.length,
      minConfidence: Math.min(...jsResults.classified.map(item => item.confidence)),
      maxConfidence: Math.max(...jsResults.classified.map(item => item.confidence))
    };
  }

  /**
   * 오류 패턴 식별
   */
  identifyErrorPatterns(jsResults, excelResults) {
    const patterns = {
      frequentMisclassifications: {},
      lowConfidenceErrors: [],
      dataQualityRelated: [],
      ruleConflicts: []
    };
    
    // 빈발 오분류 패턴
    const misclassifications = this.findMisclassifications(jsResults, excelResults);
    misclassifications.forEach(error => {
      const key = `${error.jsAccount} -> ${error.excelAccount}`;
      if (!patterns.frequentMisclassifications[key]) {
        patterns.frequentMisclassifications[key] = [];
      }
      patterns.frequentMisclassifications[key].push(error);
    });
    
    // 낮은 신뢰도 오류
    patterns.lowConfidenceErrors = misclassifications.filter(error => error.confidence < 0.7);
    
    // 데이터 품질 관련 오류
    patterns.dataQualityRelated = jsResults.failed.filter(item => 
      item.reason && item.reason.includes('데이터')
    );
    
    return patterns;
  }

  /**
   * 성능 지표 계산
   */
  calculatePerformanceMetrics(jsResults) {
    return {
      throughput: {
        transactionsPerSecond: jsResults.performance.transactionsPerSecond,
        totalProcessingTime: jsResults.processingTime
      },
      accuracy: {
        classificationRate: (jsResults.classified.length / 
          (jsResults.classified.length + jsResults.uncertain.length + jsResults.failed.length)) * 100,
        uncertaintyRate: (jsResults.uncertain.length / 
          (jsResults.classified.length + jsResults.uncertain.length + jsResults.failed.length)) * 100,
        failureRate: (jsResults.failed.length / 
          (jsResults.classified.length + jsResults.uncertain.length + jsResults.failed.length)) * 100
      },
      quality: {
        averageConfidence: jsResults.performance.averageConfidence,
        highConfidenceRate: (jsResults.classified.filter(item => item.confidence >= 0.9).length / 
          jsResults.classified.length) * 100
      }
    };
  }

  /**
   * 개선 기회 식별
   */
  identifyImprovementOpportunities(jsResults, excelResults) {
    const opportunities = [];
    
    // 1. 낮은 신뢰도 분류 개선
    const lowConfidenceItems = jsResults.classified.filter(item => item.confidence < 0.8);
    if (lowConfidenceItems.length > 0) {
      opportunities.push({
        type: 'confidence_improvement',
        priority: 'medium',
        description: `${lowConfidenceItems.length}건의 낮은 신뢰도 분류 개선 필요`,
        impact: 'accuracy_increase',
        recommendation: '분류 규칙 재검토 및 키워드 확장'
      });
    }
    
    // 2. 실패 케이스 분석
    if (jsResults.failed.length > 0) {
      opportunities.push({
        type: 'failure_reduction',
        priority: 'high',
        description: `${jsResults.failed.length}건의 분류 실패 케이스 해결`,
        impact: 'coverage_increase',
        recommendation: '데이터 전처리 로직 강화 및 예외 처리 개선'
      });
    }
    
    // 3. 빈발 오분류 패턴 개선
    const misclassifications = this.findMisclassifications(jsResults, excelResults);
    const frequentErrors = this.findFrequentErrorPatterns(misclassifications);
    
    if (frequentErrors.length > 0) {
      opportunities.push({
        type: 'pattern_correction',
        priority: 'high',
        description: `${frequentErrors.length}개의 빈발 오분류 패턴 수정`,
        impact: 'accuracy_increase',
        recommendation: '특정 분류 규칙 수정 및 우선순위 조정'
      });
    }
    
    return opportunities;
  }

  /**
   * 비교 통계 계산
   */
  calculateComparisonStatistics(comparison) {
    const total = comparison.matched.length + comparison.mismatched.length;
    
    return {
      totalComparisons: total,
      matchCount: comparison.matched.length,
      mismatchCount: comparison.mismatched.length,
      accuracy: total > 0 ? (comparison.matched.length / total) * 100 : 0,
      jsOnlyCount: comparison.jsOnly.length,
      excelOnlyCount: comparison.excelOnly.length,
      coverageRate: total > 0 ? ((comparison.matched.length + comparison.mismatched.length) / 
        (total + comparison.excelOnly.length)) * 100 : 0
    };
  }

  /**
   * 요약 결과 생성
   */
  generateSummary(accuracyAnalysis, jsResults, excelResults) {
    return {
      overallAccuracy: accuracyAnalysis.statistics.accuracy,
      totalTransactions: jsResults.classified.length + jsResults.uncertain.length + jsResults.failed.length,
      successfulClassifications: jsResults.classified.length,
      uncertainClassifications: jsResults.uncertain.length,
      failedClassifications: jsResults.failed.length,
      processingTime: jsResults.processingTime,
      averageConfidence: jsResults.performance.averageConfidence,
      passesThreshold: accuracyAnalysis.statistics.accuracy >= 95.0,
      keyMetrics: {
        precision: this.calculateOverallPrecision(accuracyAnalysis),
        recall: this.calculateOverallRecall(accuracyAnalysis),
        f1Score: this.calculateOverallF1Score(accuracyAnalysis)
      }
    };
  }

  /**
   * 권장사항 생성
   */
  generateRecommendations(accuracyAnalysis) {
    const recommendations = [];
    
    if (accuracyAnalysis.statistics.accuracy < 95.0) {
      recommendations.push({
        type: 'accuracy_improvement',
        priority: 'high',
        message: '분류 정확도가 95% 미만입니다',
        actions: [
          '가장 빈발한 오분류 패턴 분석 및 규칙 수정',
          '신뢰도 임계값 조정 검토',
          '데이터 전처리 로직 개선'
        ]
      });
    }
    
    if (accuracyAnalysis.statistics.mismatchCount > accuracyAnalysis.statistics.matchCount * 0.1) {
      recommendations.push({
        type: 'rule_refinement',
        priority: 'medium', 
        message: '오분류율이 높습니다 (10% 초과)',
        actions: [
          '분류 규칙의 우선순위 재검토',
          '키워드 기반 규칙 확장',
          '복합 조건 규칙 추가 고려'
        ]
      });
    }
    
    return recommendations;
  }

  // ============== 헬퍼 함수들 ==============

  /**
   * 검증 규칙 초기화
   */
  initializeValidationRules() {
    return {
      requiredFields: ['날짜', '항목', '금액'],
      accountCategories: [
        '건보수익', '의보수익', '일반수익', '산재수익', '자보수익',
        '의약품비', '의료재료비', '급여', '임차료'
      ],
      confidenceThreshold: 0.8,
      accuracyThreshold: 95.0
    };
  }

  /**
   * 데이터 품질 평가
   */
  assessDataQuality(transaction) {
    let score = 100;
    const issues = [];
    
    this.validationRules.requiredFields.forEach(field => {
      if (!transaction[field] || transaction[field] === '') {
        score -= 30;
        issues.push(`필수 필드 누락: ${field}`);
      }
    });
    
    return { score: Math.max(0, score), issues: issues };
  }

  /**
   * 거래 복잡도 평가
   */
  assessComplexity(transaction) {
    let complexity = 'simple';
    
    // 복합 조건이 필요한 경우
    if (transaction.보험유형 && transaction.진료과) {
      complexity = 'medium';
    }
    
    // 키워드가 모호한 경우
    if (transaction.항목 && transaction.항목.split(' ').length > 3) {
      complexity = 'high';
    }
    
    return complexity;
  }

  /**
   * 거래 분류
   */
  categorizeTransaction(transaction) {
    const amount = parseFloat(transaction.금액) || 0;
    return amount > 0 ? 'revenue' : 'expense';
  }

  /**
   * 평균 신뢰도 계산
   */
  calculateAverageConfidence(classified) {
    if (classified.length === 0) return 0;
    return classified.reduce((sum, item) => sum + item.confidence, 0) / classified.length;
  }

  /**
   * 계정과목 컬럼 인덱스 찾기
   */
  findAccountColumnIndex(headerRow) {
    const accountHeaders = ['계정과목', 'account', '과목'];
    
    for (let i = 0; i < headerRow.length; i++) {
      const header = String(headerRow[i]).toLowerCase();
      if (accountHeaders.some(ah => header.includes(ah))) {
        return i;
      }
    }
    
    return -1;
  }

  /**
   * 행에서 거래내역 복원
   */
  reconstructTransactionFromRow(row, headerRow) {
    const transaction = {};
    
    headerRow.forEach((header, index) => {
      if (header && row[index] !== null && row[index] !== undefined) {
        transaction[header] = row[index];
      }
    });
    
    return transaction;
  }

  /**
   * 계정별 그룹핑
   */
  groupByAccount(classifications) {
    const grouped = {};
    
    classifications.forEach(item => {
      if (!grouped[item.account]) {
        grouped[item.account] = [];
      }
      grouped[item.account].push(item);
    });
    
    return grouped;
  }

  /**
   * 시트별 그룹핑
   */
  groupBySheet(classifications) {
    const grouped = {};
    
    classifications.forEach(item => {
      if (!grouped[item.source]) {
        grouped[item.source] = [];
      }
      grouped[item.source].push(item);
    });
    
    return grouped;
  }

  /**
   * Excel 분류와 매칭 찾기
   */
  findMatchingExcelClassification(jsItem, excelClassifications) {
    return excelClassifications.find(excelItem => 
      this.isTransactionMatch(jsItem.originalData, excelItem.originalData)
    );
  }

  /**
   * 거래내역 매칭 확인
   */
  isTransactionMatch(trans1, trans2) {
    // 날짜, 금액, 항목을 기준으로 매칭
    const date1 = this.normalizeDate(trans1.날짜 || trans1.date);
    const date2 = this.normalizeDate(trans2.날짜 || trans2.date);
    
    const amount1 = this.normalizeAmount(trans1.금액 || trans1.amount);
    const amount2 = this.normalizeAmount(trans2.금액 || trans2.amount);
    
    const item1 = String(trans1.항목 || trans1.item || '').trim();
    const item2 = String(trans2.항목 || trans2.item || '').trim();
    
    return date1 === date2 && 
           Math.abs(amount1 - amount2) < 0.01 && // 소수점 오차 허용
           item1 === item2;
  }

  /**
   * 날짜 정규화
   */
  normalizeDate(dateValue) {
    if (!dateValue) return '';
    try {
      return new Date(dateValue).toISOString().split('T')[0];
    } catch {
      return String(dateValue);
    }
  }

  /**
   * 금액 정규화
   */
  normalizeAmount(amountValue) {
    if (typeof amountValue === 'number') return amountValue;
    const cleaned = String(amountValue).replace(/[,\s]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * 정확한 분류 개수 계산
   */
  countCorrectClassifications(account, jsResults, excelResults) {
    let correctCount = 0;
    
    jsResults.classified.forEach(jsItem => {
      if (jsItem.account === account) {
        const matchingExcel = excelResults.classifications.find(excelItem => 
          this.isTransactionMatch(jsItem.originalData, excelItem.originalData) &&
          excelItem.account === account
        );
        
        if (matchingExcel) {
          correctCount++;
        }
      }
    });
    
    return correctCount;
  }

  /**
   * 오분류 찾기
   */
  findMisclassifications(jsResults, excelResults) {
    const misclassifications = [];
    
    jsResults.classified.forEach(jsItem => {
      const matchingExcel = excelResults.classifications.find(excelItem => 
        this.isTransactionMatch(jsItem.originalData, excelItem.originalData)
      );
      
      if (matchingExcel && jsItem.account !== matchingExcel.account) {
        misclassifications.push({
          originalData: jsItem.originalData,
          jsAccount: jsItem.account,
          excelAccount: matchingExcel.account,
          confidence: jsItem.confidence,
          appliedRules: jsItem.appliedRules || []
        });
      }
    });
    
    return misclassifications;
  }

  /**
   * 빈발 오류 패턴 찾기
   */
  findFrequentErrorPatterns(misclassifications) {
    const patterns = {};
    
    misclassifications.forEach(error => {
      const key = `${error.jsAccount}->${error.excelAccount}`;
      if (!patterns[key]) {
        patterns[key] = [];
      }
      patterns[key].push(error);
    });
    
    // 2건 이상인 패턴만 반환
    return Object.keys(patterns)
      .filter(key => patterns[key].length >= 2)
      .map(key => ({
        pattern: key,
        count: patterns[key].length,
        examples: patterns[key].slice(0, 3) // 예시 3개만
      }));
  }

  /**
   * 전체 정밀도 계산
   */
  calculateOverallPrecision(accuracyAnalysis) {
    const total = accuracyAnalysis.statistics.matchCount + accuracyAnalysis.statistics.mismatchCount;
    return total > 0 ? (accuracyAnalysis.statistics.matchCount / total) * 100 : 0;
  }

  /**
   * 전체 재현율 계산
   */
  calculateOverallRecall(accuracyAnalysis) {
    // 실제로는 더 복잡한 계산이 필요하지만, 여기서는 단순화
    return this.calculateOverallPrecision(accuracyAnalysis);
  }

  /**
   * 전체 F1 점수 계산
   */
  calculateOverallF1Score(accuracyAnalysis) {
    const precision = this.calculateOverallPrecision(accuracyAnalysis);
    const recall = this.calculateOverallRecall(accuracyAnalysis);
    
    return (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  }
}

module.exports = ClassificationValidator;