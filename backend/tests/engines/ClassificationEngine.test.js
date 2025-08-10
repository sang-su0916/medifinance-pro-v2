/**
 * ClassificationEngine 테스트
 * 계정과목 자동 분류 엔진의 정확도와 성능 검증
 */

const ClassificationEngine = require('../../src/engines/ClassificationEngine');

describe('ClassificationEngine', () => {
  let classificationEngine;

  beforeEach(() => {
    classificationEngine = new ClassificationEngine();
  });

  describe('기본 기능 테스트', () => {
    test('엔진이 정상적으로 초기화되어야 함', () => {
      expect(classificationEngine).toBeDefined();
      expect(classificationEngine.classificationRules).toBeDefined();
      expect(classificationEngine.confidenceThreshold).toBe(0.8);
    });

    test('분류 규칙이 올바르게 설정되어야 함', () => {
      const rules = classificationEngine.classificationRules;
      
      // 수익 규칙 확인
      expect(rules.revenue).toBeDefined();
      expect(rules.revenue.patientType).toBeDefined();
      expect(rules.revenue.patientType['건강보험']).toBeDefined();
      
      // 비용 규칙 확인
      expect(rules.expense).toBeDefined();
      expect(rules.expense.expenseType).toBeDefined();
      expect(rules.expense.expenseType['의약품']).toBeDefined();
    });
  });

  describe('거래 유형 판단 테스트', () => {
    test('양수 금액은 수익으로 분류되어야 함', () => {
      const row = { 금액: 100000 };
      const type = classificationEngine.determineTransactionType(row);
      expect(type).toBe('revenue');
    });

    test('음수 금액은 비용으로 분류되어야 함', () => {
      const row = { 금액: -50000 };
      const type = classificationEngine.determineTransactionType(row);
      expect(type).toBe('expense');
    });

    test('0 금액은 오류를 발생시켜야 함', () => {
      const row = { 금액: 0 };
      expect(() => {
        classificationEngine.determineTransactionType(row);
      }).toThrow('거래 금액이 0입니다');
    });
  });

  describe('수익 분류 테스트', () => {
    test('건강보험 환자는 건보수익으로 분류되어야 함', () => {
      const row = {
        보험유형: '건강보험',
        금액: 50000,
        항목: '외래진료비'
      };

      const result = classificationEngine.classifyRevenue(row);
      
      expect(result.account).toBe('건보수익');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.rules).toContain('건보수익분류');
    });

    test('의료보험 환자는 의보수익으로 분류되어야 함', () => {
      const row = {
        보험유형: '의료보험',
        금액: 30000,
        항목: '입원진료비'
      };

      const result = classificationEngine.classifyRevenue(row);
      
      expect(result.account).toBe('의보수익');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('일반환자는 일반수익으로 분류되어야 함', () => {
      const row = {
        보험유형: null,
        금액: 80000,
        항목: '성형수술비'
      };

      const result = classificationEngine.classifyRevenue(row);
      
      expect(result.account).toBe('일반수익');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('진료과 정보가 추가 신뢰도를 제공해야 함', () => {
      const rowWithDept = {
        보험유형: '건강보험',
        금액: 40000,
        항목: '외래진료비',
        진료과: '내과'
      };

      const rowWithoutDept = {
        보험유형: '건강보험',
        금액: 40000,
        항목: '외래진료비'
      };

      const resultWith = classificationEngine.classifyRevenue(rowWithDept);
      const resultWithout = classificationEngine.classifyRevenue(rowWithoutDept);
      
      expect(resultWith.confidence).toBeGreaterThan(resultWithout.confidence);
    });
  });

  describe('비용 분류 테스트', () => {
    test('의약품 구입은 의약품비로 분류되어야 함', () => {
      const row = {
        항목: '의약품 구입',
        금액: -200000,
        거래처: '한국제약'
      };

      const result = classificationEngine.classifyExpense(row);
      
      expect(result.account).toBe('의약품비');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('의료재료 구입은 의료재료비로 분류되어야 함', () => {
      const row = {
        항목: '의료재료 구매',
        금액: -150000,
        거래처: '메디컬코리아'
      };

      const result = classificationEngine.classifyExpense(row);
      
      expect(result.account).toBe('의료재료비');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('급여 지급은 급여로 분류되어야 함', () => {
      const row = {
        항목: '직원 급여',
        금액: -3000000,
        거래처: '내부'
      };

      const result = classificationEngine.classifyExpense(row);
      
      expect(result.account).toBe('급여');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    test('임대료는 임차료로 분류되어야 함', () => {
      const row = {
        항목: '사무실 임대료',
        금액: -2000000,
        거래처: '부동산업체'
      };

      const result = classificationEngine.classifyExpense(row);
      
      expect(result.account).toBe('임차료');
      expect(result.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('데이터 추출 헬퍼 함수 테스트', () => {
    test('환자 유형 추출이 정상 작동해야 함', () => {
      const row1 = { 보험유형: '건강보험' };
      const row2 = { 환자유형: '의보' };
      const row3 = { patient_type: '일반' };

      expect(classificationEngine.extractPatientType(row1)).toBe('건강보험');
      expect(classificationEngine.extractPatientType(row2)).toBe('의보');
      expect(classificationEngine.extractPatientType(row3)).toBe('일반');
    });

    test('금액 추출이 정상 작동해야 함', () => {
      const row1 = { 금액: 100000 };
      const row2 = { amount: -50000 };

      expect(classificationEngine.extractAmount(row1)).toBe(100000);
      expect(classificationEngine.extractAmount(row2)).toBe(-50000);
    });

    test('키워드 추출이 정상 작동해야 함', () => {
      const row = {
        항목: '외래 진료비',
        거래처: '서울병원',
        비고: '내과 진료'
      };

      const keywords = classificationEngine.extractKeywords(row);
      
      expect(keywords).toContain('외래');
      expect(keywords).toContain('진료비');
      expect(keywords).toContain('서울병원');
    });
  });

  describe('전체 분류 프로세스 테스트', () => {
    test('정상적인 거래내역 배열을 처리할 수 있어야 함', async () => {
      const rawData = [
        {
          날짜: '2023-01-15',
          항목: '외래진료비',
          금액: 50000,
          보험유형: '건강보험',
          거래처: '환자A',
          진료과: '내과'
        },
        {
          날짜: '2023-01-16',
          항목: '의약품 구입',
          금액: -200000,
          거래처: '제약회사B'
        },
        {
          날짜: '2023-01-17',
          항목: '직원 급여',
          금액: -3000000,
          거래처: '내부'
        }
      ];

      const result = await classificationEngine.classifyTransactions(rawData);
      
      expect(result.totalRows).toBe(3);
      expect(result.classified.length).toBeGreaterThan(0);
      expect(result.statistics).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);
    });

    test('분류 통계가 정확하게 계산되어야 함', async () => {
      const rawData = [
        { 날짜: '2023-01-01', 항목: '진료비', 금액: 100000, 보험유형: '건강보험' },
        { 날짜: '2023-01-02', 항목: '진료비', 금액: 80000, 보험유형: '의료보험' },
        { 날짜: '2023-01-03', 항목: '약품비', 금액: -50000, 거래처: '제약회사' }
      ];

      const result = await classificationEngine.classifyTransactions(rawData);
      
      expect(result.statistics.successRate).toBeDefined();
      expect(result.statistics.avgConfidence).toBeDefined();
      expect(result.statistics.accountDistribution).toBeDefined();
      
      // 성공률이 합리적인 범위 내에 있는지 확인
      const successRate = parseFloat(result.statistics.successRate);
      expect(successRate).toBeGreaterThan(0);
      expect(successRate).toBeLessThanOrEqual(100);
    });
  });

  describe('데이터 검증 테스트', () => {
    test('필수 필드가 누락된 경우 적절한 오류를 반환해야 함', () => {
      const invalidRow = { 항목: '진료비' }; // 금액, 날짜 누락

      const validation = classificationEngine.validateTransactionData(invalidRow);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('금액 정보 없음');
      expect(validation.errors).toContain('날짜 정보 없음');
    });

    test('유효한 데이터는 검증을 통과해야 함', () => {
      const validRow = {
        날짜: '2023-01-01',
        항목: '진료비',
        금액: 50000
      };

      const validation = classificationEngine.validateTransactionData(validRow);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('신뢰도 조정 테스트', () => {
    test('정확도 피드백에 따라 임계값이 조정되어야 함', () => {
      const initialThreshold = classificationEngine.confidenceThreshold;
      
      // 높은 정확도 피드백
      classificationEngine.adjustConfidenceThreshold({ accuracy: 0.97 });
      expect(classificationEngine.confidenceThreshold).toBeLessThan(initialThreshold);
      
      // 낮은 정확도 피드백
      classificationEngine.adjustConfidenceThreshold({ accuracy: 0.80 });
      expect(classificationEngine.confidenceThreshold).toBeGreaterThan(initialThreshold);
    });

    test('임계값이 허용 범위 내에 유지되어야 함', () => {
      // 극한값으로 여러 번 조정
      for (let i = 0; i < 10; i++) {
        classificationEngine.adjustConfidenceThreshold({ accuracy: 1.0 });
      }
      expect(classificationEngine.confidenceThreshold).toBeGreaterThanOrEqual(0.6);
      
      for (let i = 0; i < 10; i++) {
        classificationEngine.adjustConfidenceThreshold({ accuracy: 0.5 });
      }
      expect(classificationEngine.confidenceThreshold).toBeLessThanOrEqual(0.9);
    });
  });

  describe('성능 테스트', () => {
    test('대량 데이터 처리가 적절한 시간 내에 완료되어야 함', async () => {
      // 1000개의 테스트 데이터 생성
      const largeDataSet = [];
      for (let i = 0; i < 1000; i++) {
        largeDataSet.push({
          날짜: `2023-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
          항목: i % 2 === 0 ? '진료비' : '약품비',
          금액: i % 2 === 0 ? Math.random() * 100000 : -Math.random() * 50000,
          보험유형: ['건강보험', '의료보험', '일반'][i % 3],
          거래처: `거래처${i}`,
          진료과: ['내과', '외과', '소아과'][i % 3]
        });
      }

      const startTime = Date.now();
      const result = await classificationEngine.classifyTransactions(largeDataSet);
      const endTime = Date.now();
      
      const processingTime = endTime - startTime;
      
      expect(result.totalRows).toBe(1000);
      expect(processingTime).toBeLessThan(30000); // 30초 이내
      expect(result.classified.length + result.uncertain.length + result.failed.length).toBe(1000);
    }, 35000); // 35초 타임아웃
  });

  describe('분류 개선 테스트', () => {
    test('분류 결과 개선 기능이 작동해야 함', () => {
      const row = {
        날짜: '2023-01-01',
        항목: '검사비 처치료',
        금액: 150000,
        보험유형: null
      };

      const initialClassification = '일반수익';
      const initialConfidence = 0.65;

      const refined = classificationEngine.refineClassification(row, initialClassification, initialConfidence);
      
      // 의료 행위 키워드가 있어서 신뢰도가 상승해야 함
      expect(refined.confidence).toBeGreaterThan(initialConfidence);
      expect(refined.account).toBe('일반수익');
    });

    test('고액 거래는 신뢰도가 상승해야 함', () => {
      const highAmountRow = {
        날짜: '2023-01-01',
        항목: '수술비',
        금액: 2000000,
        보험유형: '건강보험'
      };

      const lowAmountRow = {
        날짜: '2023-01-01',
        항목: '진료비',
        금액: 50000,
        보험유형: '건강보험'
      };

      const highResult = classificationEngine.refineClassification(highAmountRow, '건보수익', 0.8);
      const lowResult = classificationEngine.refineClassification(lowAmountRow, '건보수익', 0.8);
      
      expect(highResult.confidence).toBeGreaterThan(lowResult.confidence);
    });
  });

  describe('에러 처리 테스트', () => {
    test('빈 배열을 처리할 수 있어야 함', async () => {
      const result = await classificationEngine.classifyTransactions([]);
      
      expect(result.totalRows).toBe(0);
      expect(result.classified).toHaveLength(0);
      expect(result.uncertain).toHaveLength(0);
      expect(result.failed).toHaveLength(0);
    });

    test('잘못된 형식의 데이터를 적절히 처리해야 함', async () => {
      const invalidData = [
        null,
        undefined,
        {},
        { 잘못된필드: '값' },
        { 날짜: 'invalid-date', 금액: 'not-a-number', 항목: null }
      ];

      const result = await classificationEngine.classifyTransactions(invalidData);
      
      expect(result.totalRows).toBe(5);
      expect(result.failed.length).toBeGreaterThan(0);
    });
  });

  describe('통합 테스트', () => {
    test('실제 병원 데이터 형식을 처리할 수 있어야 함', async () => {
      const hospitalData = [
        {
          날짜: '2023-12-01',
          환자번호: 'P202312001',
          항목: '외래진료비',
          금액: 45000,
          보험유형: '건강보험',
          진료과: '내과',
          의사: '김의사',
          비고: '감기 치료'
        },
        {
          날짜: '2023-12-01',
          공급업체: '한국제약',
          항목: '항생제 구입',
          금액: -180000,
          수량: 100,
          단가: 1800,
          비고: '아목시실린'
        },
        {
          날짜: '2023-12-01',
          직원번호: 'E001',
          항목: '간호사 급여',
          금액: -2500000,
          부서: '병동',
          비고: '12월 급여'
        }
      ];

      const result = await classificationEngine.classifyTransactions(hospitalData);
      
      expect(result.totalRows).toBe(3);
      expect(result.classified.length).toBeGreaterThan(0);
      
      // 첫 번째는 건보수익으로 분류되어야 함
      const revenueClassification = result.classified.find(c => c.originalData.항목 === '외래진료비');
      expect(revenueClassification).toBeDefined();
      expect(revenueClassification.account).toBe('건보수익');
      
      // 두 번째는 의약품비로 분류되어야 함
      const drugExpense = result.classified.find(c => c.originalData.항목 === '항생제 구입');
      expect(drugExpense).toBeDefined();
      expect(drugExpense.account).toBe('의약품비');
      
      // 세 번째는 급여로 분류되어야 함
      const salaryExpense = result.classified.find(c => c.originalData.항목 === '간호사 급여');
      expect(salaryExpense).toBeDefined();
      expect(salaryExpense.account).toBe('급여');
    });
  });
});