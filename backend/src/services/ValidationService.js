/**
 * 검증 서비스
 * Excel과 시스템 결과 비교, 정확도 측정, 품질 보증
 */

class ValidationService {
  constructor() {
    this.accuracyThresholds = {
      high: 0.95,    // 95% 이상
      medium: 0.85,  // 85% 이상
      low: 0.70      // 70% 이상
    };
    this.validationResults = [];
  }

  /**
   * 전체 결과 검증
   * @param {Object} systemResults - 시스템 계산 결과
   * @param {Object} excelResults - Excel 원본 결과
   * @returns {Object} 검증 결과
   */
  async validateResults(systemResults, excelResults) {
    const validationResult = {
      timestamp: new Date(),
      overallAccuracy: 0,
      validationDetails: {},
      issues: [],
      recommendations: [],
      qualityScore: 0
    };

    try {
      // 1. 분류 정확도 검증
      if (systemResults.classification && excelResults.classification) {
        validationResult.validationDetails.classification = 
          await this.validateClassification(systemResults.classification, excelResults.classification);
      }

      // 2. 계산 정확도 검증
      if (systemResults.calculations && excelResults.calculations) {
        validationResult.validationDetails.calculations = 
          await this.validateCalculations(systemResults.calculations, excelResults.calculations);
      }

      // 3. 재무제표 검증
      if (systemResults.reports && excelResults.reports) {
        validationResult.validationDetails.reports = 
          await this.validateReports(systemResults.reports, excelResults.reports);
      }

      // 4. 전체 정확도 계산
      validationResult.overallAccuracy = this.calculateOverallAccuracy(validationResult.validationDetails);

      // 5. 품질 점수 계산
      validationResult.qualityScore = this.calculateQualityScore(validationResult);

      // 6. 이슈 및 권장사항 생성
      validationResult.issues = this.identifyIssues(validationResult);
      validationResult.recommendations = this.generateRecommendations(validationResult);

      this.validationResults.push(validationResult);

    } catch (error) {
      validationResult.error = error.message;
      validationResult.issues.push({
        type: 'SYSTEM_ERROR',
        message: '검증 프로세스 실행 중 오류 발생',
        severity: 'critical',
        error: error.message
      });
    }

    return validationResult;
  }

  /**
   * 분류 결과 검증
   * @param {Object} systemClassification - 시스템 분류 결과
   * @param {Object} excelClassification - Excel 분류 결과
   * @returns {Object} 분류 검증 결과
   */
  async validateClassification(systemClassification, excelClassification) {
    const classificationValidation = {
      accuracy: 0,
      totalTransactions: 0,
      correctClassifications: 0,
      incorrectClassifications: 0,
      missingClassifications: 0,
      accountAccuracy: {},
      confusionMatrix: {},
      detailedComparison: []
    };

    // 시스템 분류 결과를 맵으로 변환 (빠른 검색을 위해)
    const systemMap = new Map();
    if (systemClassification.classifiedTransactions) {
      systemClassification.classifiedTransactions.forEach(tx => {
        const key = this.generateTransactionKey(tx.originalData);
        systemMap.set(key, tx.account);
      });
    }

    // Excel 결과와 비교
    if (excelClassification.transactions) {
      classificationValidation.totalTransactions = excelClassification.transactions.length;

      excelClassification.transactions.forEach(excelTx => {
        const key = this.generateTransactionKey(excelTx);
        const systemAccount = systemMap.get(key);
        const excelAccount = excelTx.account || excelTx.계정과목;

        const comparison = {
          transactionKey: key,
          excelAccount: excelAccount,
          systemAccount: systemAccount,
          isCorrect: systemAccount === excelAccount,
          originalData: excelTx
        };

        classificationValidation.detailedComparison.push(comparison);

        if (systemAccount) {
          if (systemAccount === excelAccount) {
            classificationValidation.correctClassifications++;
            
            // 계정별 정확도 업데이트
            if (!classificationValidation.accountAccuracy[excelAccount]) {
              classificationValidation.accountAccuracy[excelAccount] = { correct: 0, total: 0 };
            }
            classificationValidation.accountAccuracy[excelAccount].correct++;
            classificationValidation.accountAccuracy[excelAccount].total++;

          } else {
            classificationValidation.incorrectClassifications++;
            
            // 혼동 행렬 업데이트
            if (!classificationValidation.confusionMatrix[excelAccount]) {
              classificationValidation.confusionMatrix[excelAccount] = {};
            }
            classificationValidation.confusionMatrix[excelAccount][systemAccount] = 
              (classificationValidation.confusionMatrix[excelAccount][systemAccount] || 0) + 1;

            if (!classificationValidation.accountAccuracy[excelAccount]) {
              classificationValidation.accountAccuracy[excelAccount] = { correct: 0, total: 0 };
            }
            classificationValidation.accountAccuracy[excelAccount].total++;
          }
        } else {
          classificationValidation.missingClassifications++;
        }
      });

      // 정확도 계산
      classificationValidation.accuracy = 
        classificationValidation.correctClassifications / classificationValidation.totalTransactions;

      // 계정별 정확도 비율 계산
      Object.keys(classificationValidation.accountAccuracy).forEach(account => {
        const stats = classificationValidation.accountAccuracy[account];
        stats.accuracy = stats.correct / stats.total;
      });
    }

    return classificationValidation;
  }

  /**
   * 계산 결과 검증
   * @param {Object} systemCalculations - 시스템 계산 결과
   * @param {Object} excelCalculations - Excel 계산 결과
   * @returns {Object} 계산 검증 결과
   */
  async validateCalculations(systemCalculations, excelCalculations) {
    const calculationValidation = {
      accuracy: 0,
      totalFormulas: 0,
      correctCalculations: 0,
      incorrectCalculations: 0,
      toleranceErrors: 0, // 오차 범위 내 차이
      significantErrors: 0, // 오차 범위 초과 차이
      formulaAccuracy: {},
      detailedComparison: []
    };

    const tolerance = 0.01; // 1% 오차 허용

    // 시스템 계산 결과를 맵으로 변환
    const systemMap = new Map();
    if (systemCalculations.calculationResults) {
      Object.entries(systemCalculations.calculationResults).forEach(([formulaId, result]) => {
        systemMap.set(formulaId, result);
      });
    }

    // Excel 계산 결과와 비교
    if (excelCalculations.results) {
      calculationValidation.totalFormulas = Object.keys(excelCalculations.results).length;

      Object.entries(excelCalculations.results).forEach(([formulaId, excelResult]) => {
        const systemResult = systemMap.get(formulaId);
        
        const comparison = {
          formulaId: formulaId,
          excelResult: excelResult,
          systemResult: systemResult,
          difference: null,
          percentDifference: null,
          isCorrect: false,
          withinTolerance: false
        };

        if (systemResult !== undefined && systemResult !== null) {
          const excelNum = this.parseNumericValue(excelResult);
          const systemNum = this.parseNumericValue(systemResult);

          if (!isNaN(excelNum) && !isNaN(systemNum)) {
            comparison.difference = Math.abs(systemNum - excelNum);
            comparison.percentDifference = excelNum === 0 ? 0 : 
              Math.abs((systemNum - excelNum) / excelNum);

            comparison.isCorrect = comparison.difference === 0;
            comparison.withinTolerance = comparison.percentDifference <= tolerance;

            if (comparison.isCorrect) {
              calculationValidation.correctCalculations++;
            } else if (comparison.withinTolerance) {
              calculationValidation.toleranceErrors++;
            } else {
              calculationValidation.significantErrors++;
              calculationValidation.incorrectCalculations++;
            }

          } else {
            // 비숫자 값 비교
            comparison.isCorrect = String(systemResult) === String(excelResult);
            if (comparison.isCorrect) {
              calculationValidation.correctCalculations++;
            } else {
              calculationValidation.incorrectCalculations++;
            }
          }

        } else {
          calculationValidation.incorrectCalculations++;
        }

        calculationValidation.detailedComparison.push(comparison);
      });

      // 정확도 계산 (허용 오차 포함)
      const acceptableResults = calculationValidation.correctCalculations + calculationValidation.toleranceErrors;
      calculationValidation.accuracy = acceptableResults / calculationValidation.totalFormulas;
    }

    return calculationValidation;
  }

  /**
   * 리포트 검증
   * @param {Object} systemReports - 시스템 생성 리포트
   * @param {Object} excelReports - Excel 원본 리포트
   * @returns {Object} 리포트 검증 결과
   */
  async validateReports(systemReports, excelReports) {
    const reportValidation = {
      accuracy: 0,
      incomeStatementAccuracy: 0,
      balanceSheetAccuracy: 0,
      detailedComparisons: {},
      structuralDifferences: [],
      valueDifferences: []
    };

    // 손익계산서 검증
    if (systemReports.incomeStatement && excelReports.incomeStatement) {
      reportValidation.detailedComparisons.incomeStatement = 
        this.compareFinancialStatement(systemReports.incomeStatement, excelReports.incomeStatement);
      reportValidation.incomeStatementAccuracy = 
        reportValidation.detailedComparisons.incomeStatement.accuracy;
    }

    // 재무상태표 검증
    if (systemReports.balanceSheet && excelReports.balanceSheet) {
      reportValidation.detailedComparisons.balanceSheet = 
        this.compareFinancialStatement(systemReports.balanceSheet, excelReports.balanceSheet);
      reportValidation.balanceSheetAccuracy = 
        reportValidation.detailedComparisons.balanceSheet.accuracy;
    }

    // 전체 리포트 정확도 계산
    const accuracyValues = [];
    if (reportValidation.incomeStatementAccuracy > 0) {
      accuracyValues.push(reportValidation.incomeStatementAccuracy);
    }
    if (reportValidation.balanceSheetAccuracy > 0) {
      accuracyValues.push(reportValidation.balanceSheetAccuracy);
    }

    reportValidation.accuracy = accuracyValues.length > 0 ? 
      accuracyValues.reduce((sum, acc) => sum + acc, 0) / accuracyValues.length : 0;

    return reportValidation;
  }

  /**
   * 재무제표 비교
   * @param {Object} systemStatement - 시스템 재무제표
   * @param {Object} excelStatement - Excel 재무제표
   * @returns {Object} 비교 결과
   */
  compareFinancialStatement(systemStatement, excelStatement) {
    const comparison = {
      accuracy: 0,
      totalItems: 0,
      correctItems: 0,
      itemComparisons: []
    };

    const tolerance = 0.01; // 1% 오차 허용

    // 모든 항목 비교
    const allKeys = new Set([
      ...Object.keys(systemStatement),
      ...Object.keys(excelStatement)
    ]);

    allKeys.forEach(key => {
      const systemValue = systemStatement[key];
      const excelValue = excelStatement[key];

      const itemComparison = {
        item: key,
        systemValue: systemValue,
        excelValue: excelValue,
        difference: null,
        percentDifference: null,
        isCorrect: false,
        withinTolerance: false
      };

      if (systemValue !== undefined && excelValue !== undefined) {
        if (typeof systemValue === 'object' && typeof excelValue === 'object') {
          // 중첩 객체인 경우 재귀적 비교
          const nestedComparison = this.compareFinancialStatement(systemValue, excelValue);
          itemComparison.nestedComparison = nestedComparison;
          itemComparison.isCorrect = nestedComparison.accuracy >= this.accuracyThresholds.high;
        } else {
          // 숫자 값 비교
          const systemNum = this.parseNumericValue(systemValue);
          const excelNum = this.parseNumericValue(excelValue);

          if (!isNaN(systemNum) && !isNaN(excelNum)) {
            itemComparison.difference = Math.abs(systemNum - excelNum);
            itemComparison.percentDifference = excelNum === 0 ? 0 : 
              Math.abs((systemNum - excelNum) / excelNum);

            itemComparison.isCorrect = itemComparison.difference === 0;
            itemComparison.withinTolerance = itemComparison.percentDifference <= tolerance;

            if (itemComparison.isCorrect || itemComparison.withinTolerance) {
              comparison.correctItems++;
            }
          } else {
            itemComparison.isCorrect = String(systemValue) === String(excelValue);
            if (itemComparison.isCorrect) {
              comparison.correctItems++;
            }
          }
        }

        comparison.totalItems++;
        comparison.itemComparisons.push(itemComparison);
      }
    });

    comparison.accuracy = comparison.totalItems > 0 ? 
      comparison.correctItems / comparison.totalItems : 0;

    return comparison;
  }

  /**
   * 전체 정확도 계산
   * @param {Object} validationDetails - 검증 세부사항
   * @returns {number} 전체 정확도
   */
  calculateOverallAccuracy(validationDetails) {
    const weights = {
      classification: 0.4,
      calculations: 0.35,
      reports: 0.25
    };

    let weightedSum = 0;
    let totalWeight = 0;

    if (validationDetails.classification) {
      weightedSum += validationDetails.classification.accuracy * weights.classification;
      totalWeight += weights.classification;
    }

    if (validationDetails.calculations) {
      weightedSum += validationDetails.calculations.accuracy * weights.calculations;
      totalWeight += weights.calculations;
    }

    if (validationDetails.reports) {
      weightedSum += validationDetails.reports.accuracy * weights.reports;
      totalWeight += weights.reports;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * 품질 점수 계산
   * @param {Object} validationResult - 검증 결과
   * @returns {number} 품질 점수 (0-100)
   */
  calculateQualityScore(validationResult) {
    let score = validationResult.overallAccuracy * 100;

    // 이슈에 따른 점수 차감
    validationResult.issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical':
          score -= 20;
          break;
        case 'high':
          score -= 10;
          break;
        case 'medium':
          score -= 5;
          break;
        case 'low':
          score -= 2;
          break;
      }
    });

    // 추가 품질 보너스
    if (validationResult.overallAccuracy >= this.accuracyThresholds.high) {
      score += 5; // 고품질 보너스
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * 이슈 식별
   * @param {Object} validationResult - 검증 결과
   * @returns {Array} 이슈 목록
   */
  identifyIssues(validationResult) {
    const issues = [];

    // 전체 정확도 이슈
    if (validationResult.overallAccuracy < this.accuracyThresholds.low) {
      issues.push({
        type: 'ACCURACY_CRITICAL',
        message: `전체 정확도가 매우 낮습니다 (${(validationResult.overallAccuracy * 100).toFixed(1)}%)`,
        severity: 'critical',
        threshold: this.accuracyThresholds.low * 100
      });
    } else if (validationResult.overallAccuracy < this.accuracyThresholds.medium) {
      issues.push({
        type: 'ACCURACY_LOW',
        message: `전체 정확도가 낮습니다 (${(validationResult.overallAccuracy * 100).toFixed(1)}%)`,
        severity: 'high',
        threshold: this.accuracyThresholds.medium * 100
      });
    }

    // 분류 관련 이슈
    if (validationResult.validationDetails.classification) {
      const classValidation = validationResult.validationDetails.classification;
      
      if (classValidation.missingClassifications > 0) {
        issues.push({
          type: 'CLASSIFICATION_MISSING',
          message: `${classValidation.missingClassifications}건의 거래내역이 분류되지 않았습니다`,
          severity: 'high',
          count: classValidation.missingClassifications
        });
      }

      if (classValidation.incorrectClassifications > classValidation.totalTransactions * 0.15) {
        issues.push({
          type: 'CLASSIFICATION_ERROR_HIGH',
          message: `분류 오류율이 15%를 초과합니다 (${classValidation.incorrectClassifications}건)`,
          severity: 'high',
          count: classValidation.incorrectClassifications,
          rate: (classValidation.incorrectClassifications / classValidation.totalTransactions * 100).toFixed(1)
        });
      }
    }

    // 계산 관련 이슈
    if (validationResult.validationDetails.calculations) {
      const calcValidation = validationResult.validationDetails.calculations;
      
      if (calcValidation.significantErrors > 0) {
        issues.push({
          type: 'CALCULATION_SIGNIFICANT_ERRORS',
          message: `${calcValidation.significantErrors}개 수식에서 큰 오차가 발견되었습니다`,
          severity: 'high',
          count: calcValidation.significantErrors
        });
      }

      if (calcValidation.incorrectCalculations > calcValidation.totalFormulas * 0.05) {
        issues.push({
          type: 'CALCULATION_ERROR_RATE_HIGH',
          message: `계산 오류율이 5%를 초과합니다`,
          severity: 'medium',
          rate: (calcValidation.incorrectCalculations / calcValidation.totalFormulas * 100).toFixed(1)
        });
      }
    }

    return issues;
  }

  /**
   * 권장사항 생성
   * @param {Object} validationResult - 검증 결과
   * @returns {Array} 권장사항 목록
   */
  generateRecommendations(validationResult) {
    const recommendations = [];

    // 정확도 기반 권장사항
    if (validationResult.overallAccuracy < this.accuracyThresholds.high) {
      recommendations.push({
        type: 'IMPROVE_ACCURACY',
        priority: 'high',
        message: '분류 규칙과 계산 로직을 검토하여 정확도를 개선하세요',
        actions: [
          '분류 규칙 재검토',
          '수식 로직 검증',
          '추가 테스트 케이스 확보'
        ]
      });
    }

    // 분류 관련 권장사항
    if (validationResult.validationDetails.classification) {
      const classValidation = validationResult.validationDetails.classification;
      
      if (classValidation.missingClassifications > 0) {
        recommendations.push({
          type: 'FIX_MISSING_CLASSIFICATIONS',
          priority: 'high',
          message: '분류되지 않은 거래내역에 대한 규칙을 추가하세요',
          actions: [
            '누락된 거래 유형 분석',
            '새로운 분류 규칙 추가',
            '기본값 분류 규칙 검토'
          ]
        });
      }

      // 계정별 정확도가 낮은 경우
      Object.entries(classValidation.accountAccuracy || {}).forEach(([account, stats]) => {
        if (stats.accuracy < this.accuracyThresholds.medium) {
          recommendations.push({
            type: 'IMPROVE_ACCOUNT_CLASSIFICATION',
            priority: 'medium',
            message: `${account} 계정의 분류 정확도가 낮습니다 (${(stats.accuracy * 100).toFixed(1)}%)`,
            account: account,
            accuracy: stats.accuracy,
            actions: [
              `${account} 관련 키워드 보강`,
              `${account} 분류 조건 세분화`,
              `${account} 예외 케이스 규칙 추가`
            ]
          });
        }
      });
    }

    // 계산 관련 권장사항
    if (validationResult.validationDetails.calculations) {
      const calcValidation = validationResult.validationDetails.calculations;
      
      if (calcValidation.significantErrors > 0) {
        recommendations.push({
          type: 'FIX_CALCULATION_ERRORS',
          priority: 'critical',
          message: '큰 오차가 있는 수식들을 우선적으로 수정하세요',
          actions: [
            '오차가 큰 수식 재검토',
            'Excel 원본과 상세 비교',
            '수식 변환 로직 점검'
          ]
        });
      }
    }

    // 전반적 개선 권장사항
    if (validationResult.issues.length > 5) {
      recommendations.push({
        type: 'COMPREHENSIVE_REVIEW',
        priority: 'high',
        message: '전반적인 시스템 검토가 필요합니다',
        actions: [
          '전체 프로세스 재점검',
          '테스트 데이터 확대',
          '단계별 검증 강화'
        ]
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
    });
  }

  /**
   * 거래내역 키 생성
   * @param {Object} transaction - 거래내역
   * @returns {string} 거래 키
   */
  generateTransactionKey(transaction) {
    return [
      transaction.날짜 || transaction.date || '',
      transaction.항목 || transaction.item || '',
      transaction.금액 || transaction.amount || '',
      transaction.거래처 || transaction.vendor || ''
    ].join('|');
  }

  /**
   * 숫자 값 파싱
   * @param {any} value - 파싱할 값
   * @returns {number} 숫자 값
   */
  parseNumericValue(value) {
    if (typeof value === 'number') return value;
    
    const cleanValue = String(value).replace(/[,\s]/g, '');
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * 검증 이력 조회
   * @param {number} limit - 조회할 개수
   * @returns {Array} 검증 이력
   */
  getValidationHistory(limit = 10) {
    return this.validationResults
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * 정확도 트렌드 분석
   * @returns {Object} 트렌드 분석 결과
   */
  analyzeAccuracyTrend() {
    if (this.validationResults.length < 2) {
      return { message: '트렌드 분석을 위한 충분한 데이터가 없습니다' };
    }

    const recentResults = this.validationResults
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);

    const trend = {
      currentAccuracy: recentResults[0].overallAccuracy,
      previousAccuracy: recentResults[1].overallAccuracy,
      change: recentResults[0].overallAccuracy - recentResults[1].overallAccuracy,
      trend: 'stable',
      averageAccuracy: recentResults.reduce((sum, r) => sum + r.overallAccuracy, 0) / recentResults.length
    };

    if (Math.abs(trend.change) > 0.05) {
      trend.trend = trend.change > 0 ? 'improving' : 'declining';
    }

    return trend;
  }

  /**
   * 벤치마크 비교
   * @param {Object} currentResults - 현재 결과
   * @returns {Object} 벤치마크 비교 결과
   */
  compareWithBenchmark(currentResults) {
    const benchmark = {
      classification: 0.95,
      calculations: 0.98,
      reports: 0.92,
      overall: 0.95
    };

    const comparison = {
      classification: {
        current: currentResults.validationDetails.classification?.accuracy || 0,
        benchmark: benchmark.classification,
        gap: (currentResults.validationDetails.classification?.accuracy || 0) - benchmark.classification
      },
      calculations: {
        current: currentResults.validationDetails.calculations?.accuracy || 0,
        benchmark: benchmark.calculations,
        gap: (currentResults.validationDetails.calculations?.accuracy || 0) - benchmark.calculations
      },
      reports: {
        current: currentResults.validationDetails.reports?.accuracy || 0,
        benchmark: benchmark.reports,
        gap: (currentResults.validationDetails.reports?.accuracy || 0) - benchmark.reports
      },
      overall: {
        current: currentResults.overallAccuracy,
        benchmark: benchmark.overall,
        gap: currentResults.overallAccuracy - benchmark.overall
      }
    };

    comparison.meetsBenchmark = Object.values(comparison).every(item => item.gap >= 0);

    return comparison;
  }
}

module.exports = ValidationService;