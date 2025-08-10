/**
 * AccountSubject 모델
 * 계정과목 정의 및 관리
 */

class AccountSubject {
  constructor(data) {
    this.code = data.code;
    this.name = data.name;
    this.category = data.category; // 'revenue' | 'expense' | 'asset' | 'liability' | 'equity'
    this.subcategory = data.subcategory;
    this.description = data.description;
    this.keywords = data.keywords || [];
    this.rules = data.rules || [];
    this.isActive = data.isActive !== false; // 기본값 true
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * 표준 계정과목 목록 생성
   * @returns {Array} 계정과목 배열
   */
  static getStandardAccountSubjects() {
    return [
      // 수익 계정
      new AccountSubject({
        code: 'REV001',
        name: '건보수익',
        category: 'revenue',
        subcategory: '환자유형별수익',
        description: '건강보험 환자 수익',
        keywords: ['건강보험', '건보', 'NHI'],
        rules: [
          { type: 'patient_type', value: '건강보험' },
          { type: 'insurance_type', value: '건보' }
        ]
      }),
      new AccountSubject({
        code: 'REV002',
        name: '의보수익',
        category: 'revenue',
        subcategory: '환자유형별수익',
        description: '의료보험 환자 수익',
        keywords: ['의료보험', '의보'],
        rules: [
          { type: 'patient_type', value: '의료보험' },
          { type: 'insurance_type', value: '의보' }
        ]
      }),
      new AccountSubject({
        code: 'REV003',
        name: '일반수익',
        category: 'revenue',
        subcategory: '환자유형별수익',
        description: '일반환자(자비) 수익',
        keywords: ['일반', '자비', '무보험'],
        rules: [
          { type: 'patient_type', value: '일반' },
          { type: 'no_insurance', value: true }
        ]
      }),
      new AccountSubject({
        code: 'REV004',
        name: '산재수익',
        category: 'revenue',
        subcategory: '환자유형별수익',
        description: '산재보험 환자 수익',
        keywords: ['산재보험', '산재', '근로복지공단'],
        rules: [
          { type: 'patient_type', value: '산재보험' },
          { type: 'insurance_type', value: '산재' }
        ]
      }),
      new AccountSubject({
        code: 'REV005',
        name: '자보수익',
        category: 'revenue',
        subcategory: '환자유형별수익',
        description: '자동차보험 환자 수익',
        keywords: ['자동차보험', '자보', '교통사고'],
        rules: [
          { type: 'patient_type', value: '자동차보험' },
          { type: 'insurance_type', value: '자보' }
        ]
      }),
      new AccountSubject({
        code: 'REV006',
        name: '내과수익',
        category: 'revenue',
        subcategory: '진료과별수익',
        description: '내과 진료 수익',
        keywords: ['내과', 'internal medicine'],
        rules: [
          { type: 'department', value: '내과' }
        ]
      }),
      new AccountSubject({
        code: 'REV007',
        name: '외과수익',
        category: 'revenue',
        subcategory: '진료과별수익',
        description: '외과 진료 수익',
        keywords: ['외과', 'surgery'],
        rules: [
          { type: 'department', value: '외과' }
        ]
      }),
      new AccountSubject({
        code: 'REV008',
        name: '소아과수익',
        category: 'revenue',
        subcategory: '진료과별수익',
        description: '소아과 진료 수익',
        keywords: ['소아과', 'pediatrics'],
        rules: [
          { type: 'department', value: '소아과' }
        ]
      }),
      new AccountSubject({
        code: 'REV009',
        name: '외래수익',
        category: 'revenue',
        subcategory: '진료형태별수익',
        description: '외래 진료 수익',
        keywords: ['외래', 'outpatient'],
        rules: [
          { type: 'service_type', value: '외래' }
        ]
      }),
      new AccountSubject({
        code: 'REV010',
        name: '입원수익',
        category: 'revenue',
        subcategory: '진료형태별수익',
        description: '입원 진료 수익',
        keywords: ['입원', 'inpatient'],
        rules: [
          { type: 'service_type', value: '입원' }
        ]
      }),
      new AccountSubject({
        code: 'REV011',
        name: '응급수익',
        category: 'revenue',
        subcategory: '진료형태별수익',
        description: '응급실 진료 수익',
        keywords: ['응급', '응급실', 'emergency'],
        rules: [
          { type: 'service_type', value: '응급' }
        ]
      }),
      new AccountSubject({
        code: 'REV012',
        name: '기타수익',
        category: 'revenue',
        subcategory: '기타수익',
        description: '기타 병원 수익',
        keywords: ['기타', '부대수익', '잡수익'],
        rules: [
          { type: 'default', value: true }
        ]
      }),

      // 비용 계정
      new AccountSubject({
        code: 'EXP001',
        name: '의약품비',
        category: 'expense',
        subcategory: '재료비',
        description: '의약품 구입비',
        keywords: ['의약품', '약품', '약물', '제약'],
        rules: [
          { type: 'item_category', value: '의약품' },
          { type: 'vendor_type', value: '제약회사' }
        ]
      }),
      new AccountSubject({
        code: 'EXP002',
        name: '의료재료비',
        category: 'expense',
        subcategory: '재료비',
        description: '의료재료 구입비',
        keywords: ['의료재료', '재료', '소모품', '일회용'],
        rules: [
          { type: 'item_category', value: '의료재료' },
          { type: 'vendor_type', value: '의료기기' }
        ]
      }),
      new AccountSubject({
        code: 'EXP003',
        name: '급여',
        category: 'expense',
        subcategory: '인건비',
        description: '직원 급여',
        keywords: ['급여', '임금', '인건비', '보수'],
        rules: [
          { type: 'item_category', value: '인건비' },
          { type: 'expense_type', value: '급여' }
        ]
      }),
      new AccountSubject({
        code: 'EXP004',
        name: '임차료',
        category: 'expense',
        subcategory: '관리비',
        description: '건물 임차료',
        keywords: ['임차료', '임대료', '렌트', '월세'],
        rules: [
          { type: 'item_category', value: '임대료' }
        ]
      }),
      new AccountSubject({
        code: 'EXP005',
        name: '전기료',
        category: 'expense',
        subcategory: '관리비',
        description: '전기 사용료',
        keywords: ['전기료', '전력', '전기'],
        rules: [
          { type: 'item_category', value: '전기료' },
          { type: 'vendor', value: '전력공사' }
        ]
      }),
      new AccountSubject({
        code: 'EXP006',
        name: '통신료',
        category: 'expense',
        subcategory: '관리비',
        description: '통신 사용료',
        keywords: ['통신료', '전화료', '인터넷'],
        rules: [
          { type: 'item_category', value: '통신료' },
          { type: 'vendor_type', value: '통신사' }
        ]
      }),
      new AccountSubject({
        code: 'EXP007',
        name: '수도료',
        category: 'expense',
        subcategory: '관리비',
        description: '상하수도 사용료',
        keywords: ['수도료', '상하수도', '물'],
        rules: [
          { type: 'item_category', value: '수도료' }
        ]
      }),
      new AccountSubject({
        code: 'EXP008',
        name: '유지보수비',
        category: 'expense',
        subcategory: '관리비',
        description: '장비 유지보수비',
        keywords: ['유지보수', '수리비', '정비'],
        rules: [
          { type: 'item_category', value: '유지보수' }
        ]
      }),
      new AccountSubject({
        code: 'EXP009',
        name: '소모품비',
        category: 'expense',
        subcategory: '관리비',
        description: '일반 소모품비',
        keywords: ['소모품', '사무용품', '잡품'],
        rules: [
          { type: 'item_category', value: '소모품' }
        ]
      }),
      new AccountSubject({
        code: 'EXP010',
        name: '교육훈련비',
        category: 'expense',
        subcategory: '관리비',
        description: '직원 교육훈련비',
        keywords: ['교육', '훈련', '연수', '세미나'],
        rules: [
          { type: 'item_category', value: '교육' }
        ]
      }),
      new AccountSubject({
        code: 'EXP011',
        name: '접대비',
        category: 'expense',
        subcategory: '관리비',
        description: '접대 및 회의비',
        keywords: ['접대비', '회의비', '식사'],
        rules: [
          { type: 'item_category', value: '접대' }
        ]
      }),
      new AccountSubject({
        code: 'EXP012',
        name: '기타비용',
        category: 'expense',
        subcategory: '기타비용',
        description: '기타 병원 비용',
        keywords: ['기타', '잡비용'],
        rules: [
          { type: 'default', value: true }
        ]
      })
    ];
  }

  /**
   * 계정과목 검색
   * @param {string} query - 검색어
   * @param {Array} accountSubjects - 계정과목 목록
   * @returns {Array} 검색 결과
   */
  static search(query, accountSubjects) {
    const searchTerm = query.toLowerCase();
    
    return accountSubjects.filter(account => {
      return account.name.toLowerCase().includes(searchTerm) ||
             account.description.toLowerCase().includes(searchTerm) ||
             account.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm));
    });
  }

  /**
   * 카테고리별 계정과목 조회
   * @param {string} category - 카테고리
   * @param {Array} accountSubjects - 계정과목 목록
   * @returns {Array} 카테고리별 계정과목
   */
  static getByCategory(category, accountSubjects) {
    return accountSubjects.filter(account => account.category === category);
  }

  /**
   * 하위카테고리별 계정과목 조회
   * @param {string} subcategory - 하위카테고리
   * @param {Array} accountSubjects - 계정과목 목록
   * @returns {Array} 하위카테고리별 계정과목
   */
  static getBySubcategory(subcategory, accountSubjects) {
    return accountSubjects.filter(account => account.subcategory === subcategory);
  }

  /**
   * 규칙 기반 계정과목 매칭
   * @param {Object} transactionData - 거래 데이터
   * @param {Array} accountSubjects - 계정과목 목록
   * @returns {Array} 매칭 결과 (신뢰도 순)
   */
  static matchByRules(transactionData, accountSubjects) {
    const matches = [];
    
    accountSubjects.forEach(account => {
      const confidence = this.calculateMatchConfidence(transactionData, account);
      if (confidence > 0) {
        matches.push({
          account: account,
          confidence: confidence,
          matchedRules: this.getMatchedRules(transactionData, account)
        });
      }
    });
    
    // 신뢰도 순으로 정렬
    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 매칭 신뢰도 계산
   * @param {Object} transactionData - 거래 데이터
   * @param {AccountSubject} account - 계정과목
   * @returns {number} 신뢰도 (0-1)
   */
  static calculateMatchConfidence(transactionData, account) {
    let confidence = 0;
    const maxConfidence = 1.0;
    
    // 규칙 기반 매칭
    account.rules.forEach(rule => {
      if (this.matchRule(transactionData, rule)) {
        confidence += 0.3; // 규칙 매칭 시 30% 신뢰도
      }
    });
    
    // 키워드 기반 매칭
    const keywords = this.extractKeywordsFromTransaction(transactionData);
    const matchedKeywords = keywords.filter(keyword => 
      account.keywords.some(accountKeyword => 
        accountKeyword.toLowerCase().includes(keyword.toLowerCase()) ||
        keyword.toLowerCase().includes(accountKeyword.toLowerCase())
      )
    );
    
    if (matchedKeywords.length > 0) {
      confidence += (matchedKeywords.length / Math.max(keywords.length, 1)) * 0.4; // 키워드 매칭 시 최대 40% 신뢰도
    }
    
    // 카테고리 기반 매칭 (수익/비용)
    const transactionType = this.getTransactionType(transactionData);
    if (transactionType === 'revenue' && account.category === 'revenue') {
      confidence += 0.2;
    } else if (transactionType === 'expense' && account.category === 'expense') {
      confidence += 0.2;
    }
    
    return Math.min(confidence, maxConfidence);
  }

  /**
   * 개별 규칙 매칭
   * @param {Object} transactionData - 거래 데이터
   * @param {Object} rule - 규칙
   * @returns {boolean} 매칭 여부
   */
  static matchRule(transactionData, rule) {
    switch (rule.type) {
      case 'patient_type':
        return transactionData.보험유형 === rule.value || 
               transactionData.환자유형 === rule.value;
      
      case 'insurance_type':
        return transactionData.보험유형?.includes(rule.value) ||
               transactionData.환자유형?.includes(rule.value);
      
      case 'department':
        return transactionData.부서 === rule.value || 
               transactionData.진료과 === rule.value;
      
      case 'service_type':
        return transactionData.항목?.includes(rule.value);
      
      case 'item_category':
        return transactionData.항목?.includes(rule.value);
      
      case 'vendor_type':
        return transactionData.거래처?.includes(rule.value);
      
      case 'vendor':
        return transactionData.거래처?.includes(rule.value);
      
      case 'expense_type':
        return transactionData.항목?.includes(rule.value);
      
      case 'no_insurance':
        return rule.value && (!transactionData.보험유형 || transactionData.보험유형 === '');
      
      case 'default':
        return rule.value; // 기본값
      
      default:
        return false;
    }
  }

  /**
   * 매칭된 규칙 목록 조회
   * @param {Object} transactionData - 거래 데이터
   * @param {AccountSubject} account - 계정과목
   * @returns {Array} 매칭된 규칙 목록
   */
  static getMatchedRules(transactionData, account) {
    return account.rules.filter(rule => this.matchRule(transactionData, rule));
  }

  /**
   * 거래 데이터에서 키워드 추출
   * @param {Object} transactionData - 거래 데이터
   * @returns {Array} 키워드 목록
   */
  static extractKeywordsFromTransaction(transactionData) {
    const text = [
      transactionData.항목,
      transactionData.거래처,
      transactionData.비고,
      transactionData.부서,
      transactionData.진료과
    ].filter(Boolean).join(' ');
    
    return text.split(/\s+/).filter(word => word.length > 1);
  }

  /**
   * 거래 유형 판단
   * @param {Object} transactionData - 거래 데이터
   * @returns {string} 'revenue' | 'expense' | 'unknown'
   */
  static getTransactionType(transactionData) {
    const amount = parseFloat(transactionData.금액 || transactionData.amount || 0);
    
    if (amount > 0) {
      return 'revenue';
    } else if (amount < 0) {
      return 'expense';
    }
    
    return 'unknown';
  }

  /**
   * 계정과목 통계 생성
   * @param {Array} transactions - 거래내역 목록
   * @param {Array} accountSubjects - 계정과목 목록
   * @returns {Object} 통계 정보
   */
  static generateStatistics(transactions, accountSubjects) {
    const stats = {
      totalTransactions: transactions.length,
      byCategory: {},
      bySubcategory: {},
      byAccount: {},
      unclassified: 0
    };

    transactions.forEach(transaction => {
      if (transaction.classification && transaction.classification.account) {
        const accountName = transaction.classification.account;
        const account = accountSubjects.find(acc => acc.name === accountName);
        
        if (account) {
          // 카테고리별 통계
          if (!stats.byCategory[account.category]) {
            stats.byCategory[account.category] = { count: 0, amount: 0 };
          }
          stats.byCategory[account.category].count++;
          stats.byCategory[account.category].amount += transaction.getAmount() || 0;

          // 하위카테고리별 통계
          if (!stats.bySubcategory[account.subcategory]) {
            stats.bySubcategory[account.subcategory] = { count: 0, amount: 0 };
          }
          stats.bySubcategory[account.subcategory].count++;
          stats.bySubcategory[account.subcategory].amount += transaction.getAmount() || 0;

          // 계정별 통계
          if (!stats.byAccount[accountName]) {
            stats.byAccount[accountName] = { count: 0, amount: 0 };
          }
          stats.byAccount[accountName].count++;
          stats.byAccount[accountName].amount += transaction.getAmount() || 0;
        }
      } else {
        stats.unclassified++;
      }
    });

    return stats;
  }

  /**
   * JSON 직렬화
   * @returns {Object} JSON 객체
   */
  toJSON() {
    return {
      code: this.code,
      name: this.name,
      category: this.category,
      subcategory: this.subcategory,
      description: this.description,
      keywords: this.keywords,
      rules: this.rules,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * JSON에서 복원
   * @param {Object} json - JSON 객체
   * @returns {AccountSubject} 계정과목 객체
   */
  static fromJSON(json) {
    return new AccountSubject({
      code: json.code,
      name: json.name,
      category: json.category,
      subcategory: json.subcategory,
      description: json.description,
      keywords: json.keywords || [],
      rules: json.rules || [],
      isActive: json.isActive,
      createdAt: new Date(json.createdAt),
      updatedAt: new Date(json.updatedAt)
    });
  }
}

module.exports = AccountSubject;