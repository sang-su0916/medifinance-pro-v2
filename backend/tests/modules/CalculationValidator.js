/**
 * SUMIFS 계산 정확도 검증 모듈
 * 
 * Excel의 3950개 수식을 JavaScript로 재현한 결과와 Excel 원본 결과를 비교
 * 특히 SUMIFS 함수의 다중 조건 처리 정확도를 중점 검증
 */

const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

class CalculationValidator {
  constructor() {
    this.formulaTestCases = new Map(); // 수식별 테스트 케이스
    this.excelBaseline = new Map();    // Excel 기준 결과값
    this.toleranceSettings = {
      absolute: 0.01,           // 절대 오차 허용범위
      relative: 0.001,          // 상대 오차 허용범위 (0.1%)
      zeroThreshold: 0.0001     // 0으로 간주할 임계값
    };
  }

  /**
   * SUMIFS 계산 정확도 검증 실행
   * @param {Object} calculationEngine - 계산 엔진
   * @param {Object} classifiedData - 분류된 데이터
   * @param {Object} formulaAnalysis - 수식 분석 결과
   * @param {Object} excelReference - Excel 참조 데이터
   * @returns {Object} 검증 결과
   */
  async validateCalculationAccuracy(calculationEngine, classifiedData, formulaAnalysis, excelReference) {
    console.log('🧮 SUMIFS 계산 정확도 검증 시작...');
    
    const validationResult = {
      summary: {},
      detailed: {},
      errors: [],
      recommendations: []
    };

    try {
      // 1. 수식 테스트 케이스 준비
      await this.prepareFormulaTestCases(formulaAnalysis, excelReference);
      
      // 2. Excel 기준값 추출
      await this.extractExcelBaseline(excelReference);
      
      // 3. JavaScript 계산 실행
      const jsResults = await this.runJavaScriptCalculations(calculationEngine, classifiedData);
      
      // 4. 결과 비교 분석
      const accuracyAnalysis = await this.compareCalculationResults(jsResults);
      
      // 5. 수식별 세부 분석
      const detailedAnalysis = await this.performFormulaTypeAnalysis(jsResults);
      
      // 6. 성능 분석
      const performanceAnalysis = this.analyzeCalculationPerformance(jsResults);
      
      // 7. 결과 종합
      validationResult.summary = this.generateCalculationSummary(accuracyAnalysis, jsResults);
      validationResult.detailed = {
        ...detailedAnalysis,
        performance: performanceAnalysis,
        accuracy: accuracyAnalysis
      };
      validationResult.errors = accuracyAnalysis.errors || [];
      validationResult.recommendations = this.generateCalculationRecommendations(accuracyAnalysis);

      console.log(`✅ 계산 검증 완료 - 정확도: ${validationResult.summary.overallAccuracy?.toFixed(3) || 0}%`);
      
      return validationResult;

    } catch (error) {
      console.error('❌ 계산 검증 실패:', error.message);
      throw error;
    }
  }

  /**
   * 수식 테스트 케이스 준비
   */
  async prepareFormulaTestCases(formulaAnalysis, excelReference) {
    const testCases = [];
    
    // 1. 우선순위 수식들 추출 (SUMIFS 중심)
    const priorityFormulas = this.extractPriorityFormulas(formulaAnalysis);
    
    // 2. Excel 파일에서 실제 수식 추출
    Object.keys(excelReference.formulas).forEach(sheetName => {
      const sheetFormulas = excelReference.formulas[sheetName];
      
      Object.keys(sheetFormulas).forEach(cellRef => {
        const formula = sheetFormulas[cellRef];
        
        if (this.isSupportedFormula(formula)) {
          const testCase = {
            id: `${sheetName}_${cellRef}`,
            sheet: sheetName,
            cell: cellRef,
            formula: formula,
            type: this.getFormulaType(formula),
            complexity: this.assessFormulaComplexity(formula),
            parameters: this.parseFormulaParameters(formula),
            expectedResult: null, // Excel에서 추출
            jsResult: null,       // JavaScript 결과
            status: 'pending'
          };
          
          testCases.push(testCase);
          this.formulaTestCases.set(testCase.id, testCase);
        }
      });
    });

    console.log(`📋 수식 테스트 케이스 준비 완료: ${testCases.length}개`);
    console.log(`   - SUMIFS: ${testCases.filter(tc => tc.type === 'SUMIFS').length}개`);
    console.log(`   - INDEX/MATCH: ${testCases.filter(tc => tc.type === 'INDEX_MATCH').length}개`);
    console.log(`   - 기타: ${testCases.filter(tc => !['SUMIFS', 'INDEX_MATCH'].includes(tc.type)).length}개`);
  }

  /**
   * Excel 기준값 추출
   */
  async extractExcelBaseline(excelReference) {
    console.log('📊 Excel 기준값 추출 중...');
    
    Object.keys(excelReference.data).forEach(sheetName => {
      const sheetData = excelReference.data[sheetName];
      
      // 각 테스트 케이스의 셀에서 실제 값 추출
      this.formulaTestCases.forEach(testCase => {
        if (testCase.sheet === sheetName) {
          const cellValue = this.getCellValue(sheetData, testCase.cell);
          
          if (cellValue !== null) {
            testCase.expectedResult = this.normalizeNumericValue(cellValue);
            this.excelBaseline.set(testCase.id, testCase.expectedResult);
          }
        }
      });
    });

    const extractedCount = Array.from(this.excelBaseline.values()).filter(v => v !== null).length;
    console.log(`✅ Excel 기준값 추출 완료: ${extractedCount}개`);
  }

  /**
   * JavaScript 계산 실행
   */
  async runJavaScriptCalculations(calculationEngine, classifiedData) {
    console.log('⚙️ JavaScript 계산 엔진 실행 중...');
    
    const startTime = Date.now();
    
    // 테스트 케이스를 수식 객체로 변환
    const formulas = Array.from(this.formulaTestCases.values()).map(testCase => ({
      id: testCase.id,
      type: testCase.type,
      sheet: testCase.sheet,
      cell: testCase.cell,
      formula: testCase.formula
    }));

    // 계산 실행
    const results = await calculationEngine.executeCalculations(classifiedData, formulas);
    
    const processingTime = Date.now() - startTime;
    
    // 결과를 테스트 케이스에 반영
    Object.keys(results.calculationResults).forEach(formulaId => {
      const testCase = this.formulaTestCases.get(formulaId);
      if (testCase) {
        testCase.jsResult = this.normalizeNumericValue(results.calculationResults[formulaId]);
        testCase.status = 'completed';
      }
    });
    
    // 오류 케이스 처리
    if (results.errors) {
      results.errors.forEach(error => {
        const testCase = this.formulaTestCases.get(error.formula?.id);
        if (testCase) {
          testCase.status = 'error';
          testCase.error = error.error;
        }
      });
    }

    console.log(`✅ JavaScript 계산 완료: ${results.formulasExecuted}개 (${this.formatTime(processingTime)})`);
    
    return {
      ...results,
      processingTime: processingTime,
      testCases: Array.from(this.formulaTestCases.values())
    };
  }

  /**
   * 계산 결과 비교 분석
   */
  async compareCalculationResults(jsResults) {
    console.log('🔍 계산 결과 비교 분석 중...');
    
    const analysis = {
      exact: [],          // 정확히 일치
      acceptable: [],     // 허용 오차 내
      significant: [],    // 유의미한 차이
      errors: [],         // 계산 오류
      missing: [],        // 기준값 없음
      statistics: {}
    };

    let totalComparisons = 0;
    
    jsResults.testCases.forEach(testCase => {
      if (testCase.status === 'error') {
        analysis.errors.push({
          testCase: testCase,
          error: testCase.error,
          type: 'execution_error'
        });
        return;
      }
      
      if (testCase.expectedResult === null || testCase.expectedResult === undefined) {
        analysis.missing.push(testCase);
        return;
      }
      
      if (testCase.jsResult === null || testCase.jsResult === undefined) {
        analysis.errors.push({
          testCase: testCase,
          error: 'No JavaScript result',
          type: 'missing_result'
        });
        return;
      }
      
      totalComparisons++;
      
      const expectedValue = testCase.expectedResult;
      const actualValue = testCase.jsResult;
      
      const comparison = this.compareValues(expectedValue, actualValue);
      
      switch (comparison.category) {
        case 'exact':
          analysis.exact.push({ testCase, comparison });
          break;
        case 'acceptable':
          analysis.acceptable.push({ testCase, comparison });
          break;
        case 'significant':
          analysis.significant.push({ testCase, comparison });
          break;
      }
    });

    // 통계 계산
    analysis.statistics = {
      totalComparisons: totalComparisons,
      exactMatches: analysis.exact.length,
      acceptableMatches: analysis.acceptable.length,
      significantDifferences: analysis.significant.length,
      errors: analysis.errors.length,
      missing: analysis.missing.length,
      
      exactAccuracy: totalComparisons > 0 ? (analysis.exact.length / totalComparisons) * 100 : 0,
      acceptableAccuracy: totalComparisons > 0 ? ((analysis.exact.length + analysis.acceptable.length) / totalComparisons) * 100 : 0,
      errorRate: jsResults.testCases.length > 0 ? (analysis.errors.length / jsResults.testCases.length) * 100 : 0
    };

    console.log(`📊 비교 분석 완료:`);
    console.log(`   - 정확 일치: ${analysis.exact.length}개 (${analysis.statistics.exactAccuracy.toFixed(2)}%)`);
    console.log(`   - 허용 범위: ${analysis.acceptable.length}개`);
    console.log(`   - 유의미한 차이: ${analysis.significant.length}개`);
    console.log(`   - 계산 오류: ${analysis.errors.length}개`);
    
    return analysis;
  }

  /**
   * 수식 타입별 분석
   */
  async performFormulaTypeAnalysis(jsResults) {
    const typeAnalysis = {};
    
    // 수식 타입별 그룹핑
    const typeGroups = {};
    jsResults.testCases.forEach(testCase => {
      if (!typeGroups[testCase.type]) {
        typeGroups[testCase.type] = [];
      }
      typeGroups[testCase.type].push(testCase);
    });

    // 각 타입별 분석
    Object.keys(typeGroups).forEach(type => {
      const testCases = typeGroups[type];
      const successful = testCases.filter(tc => tc.status === 'completed' && tc.jsResult !== null);
      const failed = testCases.filter(tc => tc.status === 'error');
      
      let exactMatches = 0;
      let acceptableMatches = 0;
      let significantDifferences = 0;
      
      successful.forEach(testCase => {
        if (testCase.expectedResult !== null) {
          const comparison = this.compareValues(testCase.expectedResult, testCase.jsResult);
          switch (comparison.category) {
            case 'exact': exactMatches++; break;
            case 'acceptable': acceptableMatches++; break;
            case 'significant': significantDifferences++; break;
          }
        }
      });
      
      typeAnalysis[type] = {
        total: testCases.length,
        successful: successful.length,
        failed: failed.length,
        exactMatches: exactMatches,
        acceptableMatches: acceptableMatches,
        significantDifferences: significantDifferences,
        successRate: (successful.length / testCases.length) * 100,
        exactAccuracy: successful.length > 0 ? (exactMatches / successful.length) * 100 : 0,
        acceptableAccuracy: successful.length > 0 ? ((exactMatches + acceptableMatches) / successful.length) * 100 : 0
      };
    });

    return {
      byType: typeAnalysis,
      summary: this.summarizeTypeAnalysis(typeAnalysis)
    };
  }

  /**
   * 계산 성능 분석
   */
  analyzeCalculationPerformance(jsResults) {
    const totalTestCases = jsResults.testCases.length;
    const completedCases = jsResults.testCases.filter(tc => tc.status === 'completed').length;
    const errorCases = jsResults.testCases.filter(tc => tc.status === 'error').length;
    
    return {
      throughput: {
        formulasPerSecond: totalTestCases / (jsResults.processingTime / 1000),
        totalProcessingTime: jsResults.processingTime,
        averageFormulaTime: jsResults.processingTime / totalTestCases
      },
      reliability: {
        completionRate: (completedCases / totalTestCases) * 100,
        errorRate: (errorCases / totalTestCases) * 100,
        successfulExecutions: completedCases,
        failedExecutions: errorCases
      },
      complexity: {
        simpleFormulas: jsResults.testCases.filter(tc => tc.complexity === 'simple').length,
        mediumFormulas: jsResults.testCases.filter(tc => tc.complexity === 'medium').length,
        complexFormulas: jsResults.testCases.filter(tc => tc.complexity === 'complex').length
      }
    };
  }

  /**
   * 계산 요약 생성
   */
  generateCalculationSummary(accuracyAnalysis, jsResults) {
    return {
      overallAccuracy: accuracyAnalysis.statistics.acceptableAccuracy,
      exactAccuracy: accuracyAnalysis.statistics.exactAccuracy,
      totalFormulas: jsResults.testCases.length,
      successfulCalculations: accuracyAnalysis.statistics.totalComparisons,
      calculationErrors: accuracyAnalysis.statistics.errors,
      processingTime: jsResults.processingTime,
      formulasPerSecond: jsResults.testCases.length / (jsResults.processingTime / 1000),
      passesThreshold: accuracyAnalysis.statistics.acceptableAccuracy >= 99.9,
      keyMetrics: {
        exactMatchRate: accuracyAnalysis.statistics.exactAccuracy,
        acceptableMatchRate: accuracyAnalysis.statistics.acceptableAccuracy,
        errorRate: accuracyAnalysis.statistics.errorRate,
        significantDifferenceRate: (accuracyAnalysis.statistics.significantDifferences / accuracyAnalysis.statistics.totalComparisons) * 100
      }
    };
  }

  /**
   * 계산 권장사항 생성
   */
  generateCalculationRecommendations(accuracyAnalysis) {
    const recommendations = [];
    
    // 정확도 기준 미달
    if (accuracyAnalysis.statistics.acceptableAccuracy < 99.9) {
      recommendations.push({
        type: 'accuracy_critical',
        priority: 'critical',
        message: `계산 정확도가 99.9% 미만입니다 (${accuracyAnalysis.statistics.acceptableAccuracy.toFixed(2)}%)`,
        impact: 'high',
        actions: [
          '유의미한 차이 케이스 분석 및 수정',
          '수식 파싱 로직 재검토',
          '숫자 정밀도 처리 개선'
        ]
      });
    }
    
    // 오류율 높음
    if (accuracyAnalysis.statistics.errorRate > 1.0) {
      recommendations.push({
        type: 'error_reduction',
        priority: 'high',
        message: `계산 오류율이 높습니다 (${accuracyAnalysis.statistics.errorRate.toFixed(2)}%)`,
        impact: 'medium',
        actions: [
          '오류 케이스 패턴 분석',
          '예외 처리 로직 강화',
          '입력 데이터 검증 개선'
        ]
      });
    }
    
    // 유의미한 차이 많음
    if (accuracyAnalysis.significant.length > 0) {
      const significantRate = (accuracyAnalysis.significant.length / accuracyAnalysis.statistics.totalComparisons) * 100;
      recommendations.push({
        type: 'precision_improvement',
        priority: 'medium',
        message: `${accuracyAnalysis.significant.length}개 케이스에서 유의미한 차이 발견 (${significantRate.toFixed(2)}%)`,
        impact: 'medium',
        actions: [
          '큰 차이 케이스 우선 분석',
          'SUMIFS 다중 조건 처리 로직 점검',
          '범위 참조 처리 정확성 검토'
        ]
      });
    }
    
    return recommendations;
  }

  // ============== 헬퍼 함수들 ==============

  /**
   * 우선순위 수식 추출
   */
  extractPriorityFormulas(formulaAnalysis) {
    if (!formulaAnalysis || !formulaAnalysis.complexFormulasTop10) {
      return [];
    }
    
    return formulaAnalysis.complexFormulasTop10.map(formula => ({
      ...formula,
      priority: 'high'
    }));
  }

  /**
   * 지원되는 수식인지 확인
   */
  isSupportedFormula(formula) {
    const supportedTypes = ['SUMIFS', 'SUMIF', 'INDEX', 'MATCH', 'VLOOKUP', 'IF', 'SUM'];
    const formulaUpper = formula.toUpperCase();
    
    return supportedTypes.some(type => formulaUpper.includes(type));
  }

  /**
   * 수식 타입 추출
   */
  getFormulaType(formula) {
    const formulaUpper = formula.toUpperCase();
    
    if (formulaUpper.includes('SUMIFS')) return 'SUMIFS';
    if (formulaUpper.includes('SUMIF')) return 'SUMIF';
    if (formulaUpper.includes('INDEX') && formulaUpper.includes('MATCH')) return 'INDEX_MATCH';
    if (formulaUpper.includes('VLOOKUP')) return 'VLOOKUP';
    if (formulaUpper.includes('IF')) return 'IF';
    if (formulaUpper.includes('SUM')) return 'SUM';
    
    return 'OTHER';
  }

  /**
   * 수식 복잡도 평가
   */
  assessFormulaComplexity(formula) {
    let complexity = 'simple';
    
    // 함수 중첩도
    const nestingLevel = (formula.match(/\(/g) || []).length;
    if (nestingLevel > 3) complexity = 'complex';
    else if (nestingLevel > 1) complexity = 'medium';
    
    // 조건 개수 (SUMIFS의 경우)
    if (formula.toUpperCase().includes('SUMIFS')) {
      const params = formula.split(',');
      if (params.length > 7) complexity = 'complex'; // 3개 이상 조건
      else if (params.length > 5) complexity = 'medium'; // 2개 조건
    }
    
    // 시트 간 참조
    if (formula.includes('!')) {
      complexity = complexity === 'simple' ? 'medium' : 'complex';
    }
    
    return complexity;
  }

  /**
   * 수식 매개변수 파싱
   */
  parseFormulaParameters(formula) {
    const match = formula.match(/\w+\((.*)\)$/);
    if (!match) return [];
    
    const params = [];
    let current = '';
    let depth = 0;
    let inQuotes = false;
    
    for (let char of match[1]) {
      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        inQuotes = false;
      } else if (char === '(' && !inQuotes) {
        depth++;
      } else if (char === ')' && !inQuotes) {
        depth--;
      } else if (char === ',' && depth === 0 && !inQuotes) {
        params.push(current.trim());
        current = '';
        continue;
      }
      
      current += char;
    }
    
    if (current.trim()) {
      params.push(current.trim());
    }
    
    return params;
  }

  /**
   * 셀 값 가져오기
   */
  getCellValue(sheetData, cellRef) {
    const rowNum = this.getRowNumber(cellRef);
    const colIndex = this.getColumnIndex(cellRef);
    
    if (rowNum > 0 && rowNum <= sheetData.length && colIndex >= 0) {
      const row = sheetData[rowNum - 1];
      if (row && colIndex < row.length) {
        return row[colIndex];
      }
    }
    
    return null;
  }

  /**
   * 행 번호 추출
   */
  getRowNumber(cellRef) {
    const match = cellRef.match(/\d+$/);
    return match ? parseInt(match[0]) : 0;
  }

  /**
   * 열 인덱스 계산
   */
  getColumnIndex(cellRef) {
    const column = cellRef.replace(/\d+$/, '');
    let index = 0;
    
    for (let i = 0; i < column.length; i++) {
      index = index * 26 + (column.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
    }
    
    return index - 1;
  }

  /**
   * 숫자 값 정규화
   */
  normalizeNumericValue(value) {
    if (typeof value === 'number') return value;
    if (value === null || value === undefined || value === '') return 0;
    
    // 문자열에서 숫자 추출
    const cleaned = String(value).replace(/[,\s]/g, '');
    const parsed = parseFloat(cleaned);
    
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * 값 비교
   */
  compareValues(expected, actual) {
    const expectedNum = this.normalizeNumericValue(expected);
    const actualNum = this.normalizeNumericValue(actual);
    
    // 둘 다 0에 가까운 경우
    if (Math.abs(expectedNum) < this.toleranceSettings.zeroThreshold && 
        Math.abs(actualNum) < this.toleranceSettings.zeroThreshold) {
      return {
        category: 'exact',
        absoluteDifference: 0,
        relativeDifference: 0,
        percentageDifference: 0
      };
    }
    
    const absoluteDiff = Math.abs(expectedNum - actualNum);
    const relativeDiff = Math.abs(expectedNum) > 0 ? absoluteDiff / Math.abs(expectedNum) : Infinity;
    const percentageDiff = relativeDiff * 100;
    
    let category;
    if (absoluteDiff === 0) {
      category = 'exact';
    } else if (absoluteDiff <= this.toleranceSettings.absolute || 
               relativeDiff <= this.toleranceSettings.relative) {
      category = 'acceptable';
    } else {
      category = 'significant';
    }
    
    return {
      category: category,
      absoluteDifference: absoluteDiff,
      relativeDifference: relativeDiff,
      percentageDifference: percentageDiff,
      expected: expectedNum,
      actual: actualNum
    };
  }

  /**
   * 타입별 분석 요약
   */
  summarizeTypeAnalysis(typeAnalysis) {
    const summary = {
      bestPerforming: null,
      worstPerforming: null,
      averageAccuracy: 0,
      totalTypes: Object.keys(typeAnalysis).length
    };
    
    let bestAccuracy = -1;
    let worstAccuracy = 101;
    let totalAccuracy = 0;
    
    Object.keys(typeAnalysis).forEach(type => {
      const analysis = typeAnalysis[type];
      const accuracy = analysis.acceptableAccuracy;
      
      if (accuracy > bestAccuracy) {
        bestAccuracy = accuracy;
        summary.bestPerforming = { type, accuracy };
      }
      
      if (accuracy < worstAccuracy) {
        worstAccuracy = accuracy;
        summary.worstPerforming = { type, accuracy };
      }
      
      totalAccuracy += accuracy;
    });
    
    summary.averageAccuracy = summary.totalTypes > 0 ? totalAccuracy / summary.totalTypes : 0;
    
    return summary;
  }

  /**
   * 시간 포맷팅
   */
  formatTime(milliseconds) {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    } else if (milliseconds < 60000) {
      return `${(milliseconds / 1000).toFixed(1)}초`;
    } else {
      const minutes = Math.floor(milliseconds / 60000);
      const seconds = Math.floor((milliseconds % 60000) / 1000);
      return `${minutes}분 ${seconds}초`;
    }
  }
}

module.exports = CalculationValidator;