/**
 * 계정과목 자동 분류 엔진
 * 4단계 분류 체계로 병원 거래내역을 자동 분류
 * 24개 계정과목별 분류 규칙 및 신뢰도 계산
 */

class ClassificationEngine {
  constructor() {
    this.classificationRules = this.initializeRules();
    this.confidenceThreshold = 0.8; // 신뢰도 임계값
  }

  /**
   * 메인 분류 함수: 로우데이터를 계정과목별로 자동 분류
   * @param {Array} rawData - 병원 시스템에서 받은 원시 데이터
   * @returns {Object} 분류 결과 및 통계
   */
  async classifyTransactions(rawData) {
    const results = {
      totalRows: rawData.length,
      classified: [],
      uncertain: [],
      failed: [],
      statistics: {},
      processingTime: 0
    };

    const startTime = Date.now();

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      try {
        const classificationResult = await this.classifyTransaction(row, i);
        
        if (classificationResult.confidence >= this.confidenceThreshold) {
          results.classified.push(classificationResult);
        } else if (classificationResult.confidence >= 0.5) {
          results.uncertain.push(classificationResult);
        } else {
          results.failed.push({
            row: row,
            index: i,
            reason: '분류 규칙 매치 실패'
          });
        }

        // 진행률 업데이트 (실시간 표시용)
        if (i % 100 === 0) {
          console.log(`분류 진행률: ${i}/${rawData.length} (${((i/rawData.length)*100).toFixed(1)}%)`);
        }

      } catch (error) {
        results.failed.push({
          row: row,
          index: i,
          reason: error.message
        });
      }
    }

    results.processingTime = Date.now() - startTime;
    results.statistics = this.calculateStatistics(results);

    return results;
  }

  /**
   * 개별 거래내역 분류
   * @param {Object} row - 개별 거래 데이터
   * @param {number} index - 행 번호
   * @returns {Object} 분류 결과
   */
  async classifyTransaction(row, index) {
    // 1단계: 기본 데이터 검증
    const validationResult = this.validateTransactionData(row);
    if (!validationResult.isValid) {
      throw new Error(`데이터 검증 실패: ${validationResult.errors.join(', ')}`);
    }

    // 2단계: 수익/비용 구분
    const transactionType = this.determineTransactionType(row);
    
    // 3단계: 카테고리별 분류
    let classification;
    let confidence = 0;
    let appliedRules = [];

    if (transactionType === 'revenue') {
      const result = this.classifyRevenue(row);
      classification = result.account;
      confidence = result.confidence;
      appliedRules = result.rules;
    } else if (transactionType === 'expense') {
      const result = this.classifyExpense(row);
      classification = result.account;
      confidence = result.confidence;
      appliedRules = result.rules;
    } else {
      throw new Error('거래 유형 판단 실패');
    }

    // 4단계: 세부 분류 및 검증
    const finalClassification = this.refineClassification(row, classification, confidence);

    return {
      originalData: row,
      rowIndex: index,
      account: finalClassification.account,
      confidence: finalClassification.confidence,
      transactionType: transactionType,
      appliedRules: appliedRules,
      metadata: {
        patientType: this.extractPatientType(row),
        department: this.extractDepartment(row),
        amount: this.extractAmount(row),
        date: this.extractDate(row)
      }
    };
  }

  /**
   * 수익 계정 분류
   * @param {Object} row - 거래 데이터
   * @returns {Object} 분류 결과
   */
  classifyRevenue(row) {
    const rules = this.classificationRules.revenue;
    let bestMatch = { account: null, confidence: 0, rules: [] };

    // 환자 유형별 수익 분류 (최우선)
    const patientType = this.extractPatientType(row);
    if (patientType) {
      const patientRule = rules.patientType[patientType];
      if (patientRule && patientRule.condition(row)) {
        bestMatch = {
          account: patientRule.account,
          confidence: patientRule.baseConfidence,
          rules: [patientRule.name]
        };
      }
    }

    // 진료과별 분류로 보완
    const department = this.extractDepartment(row);
    if (department && rules.department[department]) {
      const deptRule = rules.department[department];
      if (deptRule.condition(row)) {
        bestMatch.confidence += 0.1; // 부가 신뢰도
        bestMatch.rules.push(deptRule.name);
      }
    }

    // 키워드 기반 분류로 보완
    const keywords = this.extractKeywords(row);
    keywords.forEach(keyword => {
      if (rules.keywords[keyword]) {
        const keywordRule = rules.keywords[keyword];
        if (keywordRule.condition(row)) {
          bestMatch.confidence += keywordRule.confidenceBoost;
          bestMatch.rules.push(keywordRule.name);
        }
      }
    });

    // 최종 신뢰도 조정 (최대 1.0)
    bestMatch.confidence = Math.min(bestMatch.confidence, 1.0);

    return bestMatch;
  }

  /**
   * 비용 계정 분류
   * @param {Object} row - 거래 데이터
   * @returns {Object} 분류 결과
   */
  classifyExpense(row) {
    const rules = this.classificationRules.expense;
    let bestMatch = { account: null, confidence: 0, rules: [] };

    // 비용 항목별 분류
    const expenseType = this.extractExpenseType(row);
    if (expenseType && rules.expenseType[expenseType]) {
      const expenseRule = rules.expenseType[expenseType];
      if (expenseRule.condition(row)) {
        bestMatch = {
          account: expenseRule.account,
          confidence: expenseRule.baseConfidence,
          rules: [expenseRule.name]
        };
      }
    }

    // 공급업체별 분류로 보완
    const vendor = this.extractVendor(row);
    if (vendor && rules.vendor[vendor]) {
      const vendorRule = rules.vendor[vendor];
      if (vendorRule.condition(row)) {
        bestMatch.confidence += 0.15; // 부가 신뢰도
        bestMatch.rules.push(vendorRule.name);
      }
    }

    // 키워드 기반 분류로 보완
    const keywords = this.extractKeywords(row);
    keywords.forEach(keyword => {
      if (rules.keywords[keyword]) {
        const keywordRule = rules.keywords[keyword];
        if (keywordRule.condition(row)) {
          bestMatch.confidence += keywordRule.confidenceBoost;
          bestMatch.rules.push(keywordRule.name);
        }
      }
    });

    bestMatch.confidence = Math.min(bestMatch.confidence, 1.0);

    return bestMatch;
  }

  /**
   * 분류 규칙 초기화 (24개 계정과목)
   */
  initializeRules() {
    return {
      revenue: {
        // 환자 유형별 수익 분류 규칙
        patientType: {
          '건강보험': {
            name: '건보수익분류',
            account: '건보수익',
            baseConfidence: 0.9,
            condition: (row) => {
              return row.보험유형 === '건강보험' || 
                     row.보험종류 === '건강보험' ||
                     row.환자유형 === '건보' ||
                     (row.항목 && row.항목.includes('건강보험'));
            }
          },
          '의료보험': {
            name: '의보수익분류',
            account: '의보수익',
            baseConfidence: 0.9,
            condition: (row) => {
              return row.보험유형 === '의료보험' || 
                     row.보험종류 === '의료보험' ||
                     row.보험종류 === '의료급여' ||
                     row.환자유형 === '의보' ||
                     (row.항목 && row.항목.includes('의료'));
            }
          },
          '일반환자': {
            name: '일반수익분류',
            account: '일반수익',
            baseConfidence: 0.85,
            condition: (row) => {
              return (!row.보험유형 && !row.보험종류 && row.금액 > 0) ||
                     row.환자유형 === '일반' ||
                     (row.항목 && row.항목.includes('자비'));
            }
          },
          '산재보험': {
            name: '산재수익분류',
            account: '산재수익',
            baseConfidence: 0.9,
            condition: (row) => {
              return row.보험유형 === '산재보험' || 
                     row.환자유형 === '산재' ||
                     (row.항목 && row.항목.includes('산재'));
            }
          },
          '자동차보험': {
            name: '자보수익분류',
            account: '자보수익',
            baseConfidence: 0.9,
            condition: (row) => {
              return row.보험유형 === '자동차보험' || 
                     row.환자유형 === '자보' ||
                     (row.항목 && row.항목.includes('자동차'));
            }
          }
        },

        // 진료과별 분류 규칙
        department: {
          '내과': {
            name: '내과수익분류',
            account: '내과수익',
            baseConfidence: 0.8,
            condition: (row) => row.진료과 === '내과' || (row.부서 && row.부서.includes('내과'))
          },
          '외과': {
            name: '외과수익분류',
            account: '외과수익',
            baseConfidence: 0.8,
            condition: (row) => row.진료과 === '외과' || (row.부서 && row.부서.includes('외과'))
          },
          '소아과': {
            name: '소아과수익분류',
            account: '소아과수익',
            baseConfidence: 0.8,
            condition: (row) => row.진료과 === '소아과' || (row.부서 && row.부서.includes('소아'))
          }
        },

        // 키워드 기반 분류 규칙
        keywords: {
          '외래': {
            name: '외래수익키워드',
            confidenceBoost: 0.1,
            condition: (row) => row.항목 && row.항목.includes('외래')
          },
          '입원': {
            name: '입원수익키워드',
            confidenceBoost: 0.1,
            condition: (row) => row.항목 && row.항목.includes('입원')
          },
          '응급': {
            name: '응급수익키워드',
            confidenceBoost: 0.1,
            condition: (row) => row.항목 && row.항목.includes('응급')
          }
        }
      },

      expense: {
        // 비용 항목별 분류 규칙
        expenseType: {
          '의약품': {
            name: '의약품비분류',
            account: '의약품비',
            baseConfidence: 0.9,
            condition: (row) => {
              return (row.항목 && (row.항목.includes('약품') || row.항목.includes('의약'))) ||
                     (row.거래처 && row.거래처.includes('제약'));
            }
          },
          '의료재료': {
            name: '의료재료비분류',
            account: '의료재료비',
            baseConfidence: 0.9,
            condition: (row) => {
              return (row.항목 && (row.항목.includes('재료') || row.항목.includes('소모품'))) ||
                     (row.거래처 && row.거래처.includes('메디컬'));
            }
          },
          '인건비': {
            name: '급여분류',
            account: '급여',
            baseConfidence: 0.95,
            condition: (row) => {
              return (row.항목 && (row.항목.includes('인건비') || row.항목.includes('급여') || row.항목.includes('임금'))) ||
                     row.금액 < 0; // 일반적으로 급여는 지출
            }
          },
          '임대료': {
            name: '임차료분류',
            account: '임차료',
            baseConfidence: 0.9,
            condition: (row) => {
              return row.항목 && (row.항목.includes('임대') || row.항목.includes('임차') || row.항목.includes('렌트'));
            }
          }
        },

        // 공급업체별 분류 규칙
        vendor: {
          '제약회사': {
            name: '제약업체분류',
            confidenceBoost: 0.15,
            condition: (row) => row.거래처 && (row.거래처.includes('제약') || row.거래처.includes('팜'))
          },
          '의료기기': {
            name: '의료기기업체분류',
            confidenceBoost: 0.15,
            condition: (row) => row.거래처 && (row.거래처.includes('메디') || row.거래처.includes('기기'))
          }
        },

        // 키워드 기반 분류 규칙
        keywords: {
          '유지보수': {
            name: '유지보수비키워드',
            confidenceBoost: 0.1,
            condition: (row) => row.항목 && row.항목.includes('유지보수')
          },
          '전기': {
            name: '전기료키워드',
            confidenceBoost: 0.1,
            condition: (row) => row.항목 && row.항목.includes('전기')
          }
        }
      }
    };
  }

  /**
   * 거래 유형 판단 (수익/비용)
   */
  determineTransactionType(row) {
    const amount = this.extractAmount(row);
    if (amount > 0) {
      return 'revenue';
    } else if (amount < 0) {
      return 'expense';
    } else {
      throw new Error('거래 금액이 0입니다');
    }
  }

  /**
   * 데이터 추출 헬퍼 함수들
   */
  extractPatientType(row) {
    // 병원 데이터의 다양한 보험 유형 필드 지원
    return row.보험유형 || row.보험종류 || row.환자유형 || row.patient_type;
  }

  extractDepartment(row) {
    return row.진료과 || row.부서 || row.department;
  }

  extractAmount(row) {
    // 병원 데이터의 다양한 금액 필드 지원
    // 우선순위: 총진료비 > 수납액 > 환자부담액 > 청구액 > 카드수납액 > 현금수납액
    const amountFields = [
      { field: '총진료비', value: parseFloat(row.총진료비 || 0) },
      { field: '수납액', value: parseFloat(row.수납액 || 0) },
      { field: '환자부담액', value: parseFloat(row.환자부담액 || 0) },
      { field: '청구액', value: parseFloat(row.청구액 || 0) },
      { field: '카드수납액', value: parseFloat(row.카드수납액 || 0) },
      { field: '현금수납액', value: parseFloat(row.현금수납액 || 0) },
      { field: '금액', value: parseFloat(row.금액 || 0) },
      { field: 'amount', value: parseFloat(row.amount || 0) },
      { field: '공급가액', value: parseFloat(row.공급가액 || 0) }
    ];
    
    // 첫 번째로 0보다 큰 값을 찾아서 반환
    for (const amountField of amountFields) {
      if (amountField.value > 0) {
        return amountField.value;
      }
    }
    
    return 0;
  }

  extractDate(row) {
    // 병원 데이터의 다양한 날짜 필드 지원
    if (row.날짜) return row.날짜;
    if (row.date) return row.date;
    if (row.거래일) return row.거래일;
    if (row.수납일) return row.수납일;
    if (row.진료일) {
      // 숫자 형태의 진료일 (20250102) -> 표준 날짜 형식으로 변환
      const dateStr = String(row.진료일);
      if (dateStr.length === 8) {
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        return `${year}-${month}-${day}`;
      }
      return row.진료일;
    }
    if (row.수납시간) return row.수납시간;
    
    // 병원 데이터의 월/일 필드 조합 처리
    if (row.월 && row.일) {
      const currentYear = new Date().getFullYear();
      const month = String(row.월).padStart(2, '0');
      const day = String(row.일).padStart(2, '0');
      return `${currentYear}-${month}-${day}`;
    }
    
    return null;
  }

  extractExpenseType(row) {
    const item = row.항목 || row.item || '';
    // 비용 항목 키워드로 유형 추정
    if (item.includes('약품') || item.includes('의약')) return '의약품';
    if (item.includes('재료') || item.includes('소모품')) return '의료재료';
    if (item.includes('인건비') || item.includes('급여')) return '인건비';
    if (item.includes('임대') || item.includes('임차')) return '임대료';
    return null;
  }

  extractVendor(row) {
    return row.거래처 || row.vendor || row.supplier;
  }

  extractKeywords(row) {
    const text = [row.항목, row.거래처, row.비고].filter(Boolean).join(' ');
    return text.split(' ').filter(word => word.length > 1);
  }

  /**
   * 거래 데이터 검증
   */
  validateTransactionData(row) {
    const errors = [];
    
    // 금액 정보 확인 (병원 데이터의 모든 가능한 금액 필드)
    const hasAmount = row.금액 || row.amount || row.총진료비 || row.환자부담액 || 
                     row.수납액 || row.공급가액 || row.청구액 || row.카드수납액 || row.현금수납액;
    if (!hasAmount) {
      errors.push('금액 정보 없음');
    }
    
    // 날짜 정보 확인 (병원 데이터의 월/일 필드 및 기타 날짜 필드)
    const hasDate = row.날짜 || row.date || row.거래일 || row.수납일 || row.진료일 || 
                   (row.월 && row.일) || // 병원 데이터의 월/일 필드 조합
                   row.수납시간; // 수납시간도 날짜 정보로 인정
    if (!hasDate) {
      errors.push('날짜 정보 없음');
    }

    // 항목 정보 확인 (병원 데이터의 모든 가능한 항목 필드 인정)
    const hasItem = row.항목 || row.item || row.진료구분 || row.구분 || row.내역 || row.거래처 || 
                   row.외래입원구분 || row.보험종류 || row.보험유형 || row.성명 || row.담당의 ||
                   row.수납구분 || row.고객번호; // 병원 특화 필드 추가
    if (!hasItem) {
      errors.push('항목 정보 없음');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * 분류 결과 개선 및 검증
   */
  refineClassification(row, account, confidence) {
    // 특수 케이스 처리
    if (account === '일반수익' && confidence < 0.7) {
      // 일반수익으로 분류되었지만 신뢰도가 낮은 경우
      const keywords = this.extractKeywords(row);
      if (keywords.some(k => ['검사', '처치', '수술'].includes(k))) {
        confidence += 0.1; // 의료 행위 키워드로 신뢰도 상승
      }
    }

    // 금액 기반 검증
    const amount = this.extractAmount(row);
    if (Math.abs(amount) > 1000000) { // 100만원 초과
      confidence += 0.05; // 고액 거래는 보통 분류가 명확함
    }

    return {
      account: account,
      confidence: Math.min(confidence, 1.0)
    };
  }

  /**
   * 분류 결과 통계 계산
   */
  calculateStatistics(results) {
    const stats = {
      successRate: (results.classified.length / results.totalRows * 100).toFixed(2) + '%',
      uncertainRate: (results.uncertain.length / results.totalRows * 100).toFixed(2) + '%',
      failureRate: (results.failed.length / results.totalRows * 100).toFixed(2) + '%',
      avgConfidence: 0,
      accountDistribution: {}
    };

    // 평균 신뢰도 계산
    if (results.classified.length > 0) {
      const totalConfidence = results.classified.reduce((sum, item) => sum + item.confidence, 0);
      stats.avgConfidence = (totalConfidence / results.classified.length).toFixed(3);
    }

    // 계정별 분포 계산
    results.classified.forEach(item => {
      stats.accountDistribution[item.account] = (stats.accountDistribution[item.account] || 0) + 1;
    });

    return stats;
  }

  /**
   * 신뢰도 임계값 동적 조정
   */
  adjustConfidenceThreshold(accuracyFeedback) {
    // 사용자 피드백에 따른 임계값 조정
    if (accuracyFeedback.accuracy > 0.95) {
      this.confidenceThreshold = Math.max(0.6, this.confidenceThreshold - 0.05);
    } else if (accuracyFeedback.accuracy < 0.85) {
      this.confidenceThreshold = Math.min(0.9, this.confidenceThreshold + 0.05);
    }
  }
}

module.exports = ClassificationEngine;