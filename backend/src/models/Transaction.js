/**
 * Transaction 모델
 * 병원 거래내역 데이터 구조 정의
 */

class Transaction {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.originalData = data.originalData || {};
    this.processedData = data.processedData || {};
    this.classification = data.classification || null;
    this.metadata = data.metadata || {};
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * 거래내역 ID 생성
   * @returns {string} 고유 ID
   */
  generateId() {
    return 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 거래 데이터 검증
   * @returns {Object} 검증 결과
   */
  validate() {
    const errors = [];
    const warnings = [];

    // 필수 필드 검증
    const requiredFields = ['날짜', '항목', '금액'];
    requiredFields.forEach(field => {
      if (!this.hasField(field)) {
        errors.push(`필수 필드 누락: ${field}`);
      }
    });

    // 금액 검증
    const amount = this.getAmount();
    if (amount === null || isNaN(amount)) {
      errors.push('유효하지 않은 금액');
    }

    // 날짜 검증
    const date = this.getDate();
    if (!date || !this.isValidDate(date)) {
      errors.push('유효하지 않은 날짜');
    }

    // 경고 사항
    if (!this.getVendor()) {
      warnings.push('거래처 정보 없음');
    }

    if (!this.getDepartment()) {
      warnings.push('부서 정보 없음');
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
      warnings: warnings
    };
  }

  /**
   * 필드 존재 확인
   * @param {string} fieldName - 필드명
   * @returns {boolean} 존재 여부
   */
  hasField(fieldName) {
    return this.originalData[fieldName] !== undefined && 
           this.originalData[fieldName] !== null && 
           this.originalData[fieldName] !== '';
  }

  /**
   * 날짜 정보 추출
   * @returns {string|null} 날짜
   */
  getDate() {
    return this.originalData.날짜 || 
           this.originalData.date || 
           this.originalData.거래일 || 
           null;
  }

  /**
   * 금액 정보 추출
   * @returns {number|null} 금액
   */
  getAmount() {
    const amount = this.originalData.금액 || 
                   this.originalData.amount || 
                   this.originalData.거래금액;
    
    if (typeof amount === 'number') {
      return amount;
    }
    
    if (typeof amount === 'string') {
      const parsed = parseFloat(amount.replace(/[,\s]/g, ''));
      return isNaN(parsed) ? null : parsed;
    }
    
    return null;
  }

  /**
   * 항목 정보 추출
   * @returns {string|null} 항목
   */
  getItem() {
    return this.originalData.항목 || 
           this.originalData.item || 
           this.originalData.거래내용 || 
           null;
  }

  /**
   * 거래처 정보 추출
   * @returns {string|null} 거래처
   */
  getVendor() {
    return this.originalData.거래처 || 
           this.originalData.vendor || 
           this.originalData.supplier || 
           null;
  }

  /**
   * 부서 정보 추출
   * @returns {string|null} 부서
   */
  getDepartment() {
    return this.originalData.부서 || 
           this.originalData.department || 
           this.originalData.진료과 || 
           null;
  }

  /**
   * 환자 유형 추출
   * @returns {string|null} 환자 유형
   */
  getPatientType() {
    return this.originalData.보험유형 || 
           this.originalData.환자유형 || 
           this.originalData.patientType || 
           null;
  }

  /**
   * 비고 정보 추출
   * @returns {string|null} 비고
   */
  getNote() {
    return this.originalData.비고 || 
           this.originalData.note || 
           this.originalData.memo || 
           null;
  }

  /**
   * 거래 유형 판단 (수익/비용)
   * @returns {string} 'revenue' | 'expense' | 'unknown'
   */
  getTransactionType() {
    const amount = this.getAmount();
    if (amount > 0) {
      return 'revenue';
    } else if (amount < 0) {
      return 'expense';
    }
    return 'unknown';
  }

  /**
   * 월 정보 추출
   * @returns {number|null} 월 (1-12)
   */
  getMonth() {
    const date = this.getDate();
    if (!date) return null;
    
    try {
      return new Date(date).getMonth() + 1;
    } catch {
      return null;
    }
  }

  /**
   * 연도 정보 추출
   * @returns {number|null} 연도
   */
  getYear() {
    const date = this.getDate();
    if (!date) return null;
    
    try {
      return new Date(date).getFullYear();
    } catch {
      return null;
    }
  }

  /**
   * 분류 정보 설정
   * @param {Object} classification - 분류 결과
   */
  setClassification(classification) {
    this.classification = classification;
    this.updatedAt = new Date();
  }

  /**
   * 메타데이터 설정
   * @param {Object} metadata - 메타데이터
   */
  setMetadata(metadata) {
    this.metadata = { ...this.metadata, ...metadata };
    this.updatedAt = new Date();
  }

  /**
   * 처리된 데이터 설정
   * @param {Object} processedData - 처리된 데이터
   */
  setProcessedData(processedData) {
    this.processedData = { ...this.processedData, ...processedData };
    this.updatedAt = new Date();
  }

  /**
   * 키워드 추출
   * @returns {Array} 키워드 목록
   */
  extractKeywords() {
    const text = [
      this.getItem(),
      this.getVendor(),
      this.getNote(),
      this.getDepartment()
    ].filter(Boolean).join(' ');
    
    return text.split(/\s+/).filter(word => word.length > 1);
  }

  /**
   * 날짜 유효성 검사
   * @param {string} dateStr - 날짜 문자열
   * @returns {boolean} 유효성
   */
  isValidDate(dateStr) {
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date);
  }

  /**
   * JSON 직렬화
   * @returns {Object} JSON 객체
   */
  toJSON() {
    return {
      id: this.id,
      originalData: this.originalData,
      processedData: this.processedData,
      classification: this.classification,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * JSON에서 복원
   * @param {Object} json - JSON 객체
   * @returns {Transaction} 거래내역 객체
   */
  static fromJSON(json) {
    return new Transaction({
      id: json.id,
      originalData: json.originalData,
      processedData: json.processedData,
      classification: json.classification,
      metadata: json.metadata,
      createdAt: new Date(json.createdAt),
      updatedAt: new Date(json.updatedAt)
    });
  }

  /**
   * 거래내역 배열을 JSON으로 변환
   * @param {Array} transactions - 거래내역 배열
   * @returns {Array} JSON 배열
   */
  static toJSONArray(transactions) {
    return transactions.map(tx => tx.toJSON());
  }

  /**
   * JSON 배열에서 거래내역 배열로 복원
   * @param {Array} jsonArray - JSON 배열
   * @returns {Array} 거래내역 배열
   */
  static fromJSONArray(jsonArray) {
    return jsonArray.map(json => Transaction.fromJSON(json));
  }
}

module.exports = Transaction;