/**
 * 데이터 처리 유틸리티
 * 데이터 정규화, 변환, 집계 등의 기능 제공
 */

class DataProcessor {
  constructor() {
    this.dateFormats = [
      'YYYY-MM-DD',
      'YYYY/MM/DD',
      'MM/DD/YYYY',
      'DD/MM/YYYY',
      'YYYY-MM-DD HH:mm:ss',
      'MM/DD/YYYY HH:mm:ss'
    ];
    this.numberPatterns = {
      korean: /[\d,]+원?/,
      currency: /[$¥€£]\s?[\d,]+\.?\d*/,
      percentage: /[\d,]+\.?\d*%/,
      decimal: /^-?[\d,]+\.?\d*$/
    };
  }

  /**
   * 데이터 정규화
   * @param {Array} rawData - 원시 데이터 배열
   * @param {Object} options - 정규화 옵션
   * @returns {Array} 정규화된 데이터 배열
   */
  normalizeData(rawData, options = {}) {
    const normalized = [];
    const errors = [];

    for (let i = 0; i < rawData.length; i++) {
      try {
        const normalizedRow = this.normalizeRow(rawData[i], options, i);
        normalized.push(normalizedRow);
      } catch (error) {
        errors.push({
          rowIndex: i,
          originalData: rawData[i],
          error: error.message
        });
      }
    }

    return {
      data: normalized,
      errors: errors,
      stats: {
        originalCount: rawData.length,
        normalizedCount: normalized.length,
        errorCount: errors.length,
        successRate: (normalized.length / rawData.length * 100).toFixed(2) + '%'
      }
    };
  }

  /**
   * 개별 행 정규화
   * @param {Object} row - 원시 행 데이터
   * @param {Object} options - 옵션
   * @param {number} rowIndex - 행 인덱스
   * @returns {Object} 정규화된 행 데이터
   */
  normalizeRow(row, options, rowIndex) {
    const normalized = { ...row };
    const metadata = {
      originalRowIndex: rowIndex,
      normalizations: []
    };

    // 날짜 필드 정규화
    const dateFields = options.dateFields || ['날짜', 'date', '거래일', '발생일'];
    dateFields.forEach(field => {
      if (normalized[field]) {
        const originalValue = normalized[field];
        normalized[field] = this.normalizeDate(originalValue);
        if (normalized[field] !== originalValue) {
          metadata.normalizations.push({
            field: field,
            original: originalValue,
            normalized: normalized[field],
            type: 'date'
          });
        }
      }
    });

    // 금액 필드 정규화
    const amountFields = options.amountFields || ['금액', 'amount', '거래금액', '수량', '단가'];
    amountFields.forEach(field => {
      if (normalized[field]) {
        const originalValue = normalized[field];
        normalized[field] = this.normalizeAmount(originalValue);
        if (normalized[field] !== originalValue) {
          metadata.normalizations.push({
            field: field,
            original: originalValue,
            normalized: normalized[field],
            type: 'amount'
          });
        }
      }
    });

    // 텍스트 필드 정규화
    const textFields = options.textFields || ['항목', 'item', '거래처', 'vendor', '비고', 'note', '부서', 'department'];
    textFields.forEach(field => {
      if (normalized[field]) {
        const originalValue = normalized[field];
        normalized[field] = this.normalizeText(originalValue);
        if (normalized[field] !== originalValue) {
          metadata.normalizations.push({
            field: field,
            original: originalValue,
            normalized: normalized[field],
            type: 'text'
          });
        }
      }
    });

    // 메타데이터 추가
    normalized._metadata = metadata;

    return normalized;
  }

  /**
   * 날짜 정규화
   * @param {any} dateValue - 원본 날짜 값
   * @returns {string} 정규화된 날짜 (YYYY-MM-DD 형식)
   */
  normalizeDate(dateValue) {
    if (!dateValue) return null;

    // 이미 정규화된 형식인 경우
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }

    // Excel 날짜 시리얼 번호 처리
    if (typeof dateValue === 'number' && dateValue > 25000 && dateValue < 100000) {
      const excelEpoch = new Date(1900, 0, 1);
      const date = new Date(excelEpoch.getTime() + (dateValue - 2) * 24 * 60 * 60 * 1000);
      return date.toISOString().split('T')[0];
    }

    // JavaScript Date 객체 처리
    if (dateValue instanceof Date) {
      return dateValue.toISOString().split('T')[0];
    }

    // 문자열 날짜 파싱
    if (typeof dateValue === 'string') {
      // 한국어 날짜 표기 처리
      let processedDate = dateValue
        .replace(/년/g, '-')
        .replace(/월/g, '-')
        .replace(/일/g, '')
        .replace(/\s+/g, '')
        .trim();

      // 일반적인 날짜 형식들 시도
      const formats = [
        /^(\d{4})-(\d{1,2})-(\d{1,2})/, // 2023-1-15 -> 2023-01-15
        /^(\d{4})\/(\d{1,2})\/(\d{1,2})/, // 2023/1/15
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})/, // 1/15/2023
        /^(\d{1,2})-(\d{1,2})-(\d{4})/, // 1-15-2023
        /^(\d{2})(\d{2})(\d{2})$/, // 230115 (YYMMDD)
        /^(\d{4})(\d{2})(\d{2})$/ // 20230115 (YYYYMMDD)
      ];

      for (const format of formats) {
        const match = processedDate.match(format);
        if (match) {
          let year, month, day;

          if (format.source.includes('(\d{4}).*(\d{1,2}).*(\d{1,2})')) {
            // YYYY-MM-DD 또는 YYYY/MM/DD 형식
            [, year, month, day] = match;
          } else if (format.source.includes('(\d{1,2}).*(\d{1,2}).*(\d{4})')) {
            // MM/DD/YYYY 또는 DD/MM/YYYY 형식 (미국/유럽 형식 추정)
            [, month, day, year] = match;
            // 한국 데이터의 경우 DD/MM 형식으로 가정
            if (parseInt(month) > 12) {
              [day, month] = [month, day]; // swap
            }
          } else if (format.source.includes('(\d{2})(\d{2})(\d{2})')) {
            // YYMMDD 형식
            [, year, month, day] = match;
            year = '20' + year; // 2000년대로 가정
          } else if (format.source.includes('(\d{4})(\d{2})(\d{2})')) {
            // YYYYMMDD 형식
            [, year, month, day] = match;
          }

          // 유효성 검사
          const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          if (parsedDate.getFullYear() == year && 
              parsedDate.getMonth() == month - 1 && 
              parsedDate.getDate() == day) {
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
        }
      }

      // 마지막 시도: 자동 파싱
      try {
        const parsedDate = new Date(dateValue);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toISOString().split('T')[0];
        }
      } catch (e) {
        // 파싱 실패
      }
    }

    // 정규화 실패
    throw new Error(`날짜 정규화 실패: ${dateValue}`);
  }

  /**
   * 금액 정규화
   * @param {any} amountValue - 원본 금액 값
   * @returns {number} 정규화된 금액 (숫자)
   */
  normalizeAmount(amountValue) {
    if (amountValue === null || amountValue === undefined || amountValue === '') {
      return 0;
    }

    // 이미 숫자인 경우
    if (typeof amountValue === 'number') {
      return amountValue;
    }

    // 문자열 처리
    if (typeof amountValue === 'string') {
      let processed = amountValue.trim();

      // 한국어 단위 처리
      const koreanUnits = {
        '원': 1,
        '천원': 1000,
        '만원': 10000,
        '십만원': 100000,
        '백만원': 1000000,
        '천만원': 10000000,
        '억원': 100000000
      };

      for (const [unit, multiplier] of Object.entries(koreanUnits)) {
        if (processed.includes(unit)) {
          const number = processed.replace(unit, '').replace(/[,\s]/g, '');
          const parsed = parseFloat(number);
          if (!isNaN(parsed)) {
            return parsed * multiplier;
          }
        }
      }

      // 통화 기호 제거 및 숫자 추출
      processed = processed
        .replace(/[$¥€£₩]/g, '') // 통화 기호 제거
        .replace(/[,\s]/g, '') // 쉼표 및 공백 제거
        .replace(/%$/, ''); // 퍼센트 기호 제거

      // 괄호로 묶인 음수 처리 (123) -> -123
      if (processed.startsWith('(') && processed.endsWith(')')) {
        processed = '-' + processed.slice(1, -1);
      }

      // 숫자 파싱 시도
      const parsed = parseFloat(processed);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }

    // 정규화 실패
    throw new Error(`금액 정규화 실패: ${amountValue}`);
  }

  /**
   * 텍스트 정규화
   * @param {any} textValue - 원본 텍스트 값
   * @returns {string} 정규화된 텍스트
   */
  normalizeText(textValue) {
    if (textValue === null || textValue === undefined) {
      return '';
    }

    let processed = String(textValue);

    // 앞뒤 공백 제거
    processed = processed.trim();

    // 연속된 공백을 하나로 통일
    processed = processed.replace(/\s+/g, ' ');

    // 특수문자 정리 (선택적)
    // processed = processed.replace(/[^\w\s가-힣]/g, '');

    // 한글 자음/모음 단독 문자 제거
    processed = processed.replace(/[ㄱ-ㅎㅏ-ㅣ]/g, '');

    return processed;
  }

  /**
   * 데이터 집계
   * @param {Array} data - 데이터 배열
   * @param {Object} groupBy - 그룹화 기준
   * @param {Object} aggregations - 집계 함수들
   * @returns {Array} 집계 결과
   */
  aggregateData(data, groupBy, aggregations) {
    const groups = {};

    // 데이터 그룹화
    data.forEach(row => {
      const groupKey = this.generateGroupKey(row, groupBy);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(row);
    });

    // 그룹별 집계 실행
    const results = [];
    Object.entries(groups).forEach(([groupKey, groupData]) => {
      const result = this.parseGroupKey(groupKey, groupBy);
      
      Object.entries(aggregations).forEach(([field, aggFunc]) => {
        if (typeof aggFunc === 'string') {
          result[field] = this.executeAggregation(groupData, field, aggFunc);
        } else if (typeof aggFunc === 'function') {
          result[field] = aggFunc(groupData);
        }
      });

      result._count = groupData.length;
      results.push(result);
    });

    return results;
  }

  /**
   * 그룹 키 생성
   * @param {Object} row - 데이터 행
   * @param {Object} groupBy - 그룹화 기준
   * @returns {string} 그룹 키
   */
  generateGroupKey(row, groupBy) {
    const keyParts = [];
    
    if (Array.isArray(groupBy)) {
      groupBy.forEach(field => {
        keyParts.push(row[field] || 'null');
      });
    } else if (typeof groupBy === 'object') {
      Object.entries(groupBy).forEach(([alias, field]) => {
        keyParts.push(row[field] || 'null');
      });
    } else if (typeof groupBy === 'string') {
      keyParts.push(row[groupBy] || 'null');
    }

    return keyParts.join('|');
  }

  /**
   * 그룹 키 파싱
   * @param {string} groupKey - 그룹 키
   * @param {Object} groupBy - 그룹화 기준
   * @returns {Object} 파싱된 그룹 정보
   */
  parseGroupKey(groupKey, groupBy) {
    const keyParts = groupKey.split('|');
    const result = {};

    if (Array.isArray(groupBy)) {
      groupBy.forEach((field, index) => {
        result[field] = keyParts[index] === 'null' ? null : keyParts[index];
      });
    } else if (typeof groupBy === 'object') {
      Object.entries(groupBy).forEach(([alias, field], index) => {
        result[alias] = keyParts[index] === 'null' ? null : keyParts[index];
      });
    } else if (typeof groupBy === 'string') {
      result[groupBy] = keyParts[0] === 'null' ? null : keyParts[0];
    }

    return result;
  }

  /**
   * 집계 함수 실행
   * @param {Array} data - 그룹 데이터
   * @param {string} field - 집계 대상 필드
   * @param {string} aggType - 집계 타입
   * @returns {any} 집계 결과
   */
  executeAggregation(data, field, aggType) {
    const values = data.map(row => row[field]).filter(val => val !== null && val !== undefined);
    const numericValues = values.map(val => parseFloat(val)).filter(val => !isNaN(val));

    switch (aggType.toLowerCase()) {
      case 'sum':
        return numericValues.reduce((sum, val) => sum + val, 0);
      
      case 'avg':
      case 'average':
        return numericValues.length > 0 ? 
          numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length : 0;
      
      case 'count':
        return values.length;
      
      case 'count_distinct':
        return new Set(values).size;
      
      case 'min':
        return numericValues.length > 0 ? Math.min(...numericValues) : null;
      
      case 'max':
        return numericValues.length > 0 ? Math.max(...numericValues) : null;
      
      case 'first':
        return values.length > 0 ? values[0] : null;
      
      case 'last':
        return values.length > 0 ? values[values.length - 1] : null;
      
      case 'concat':
        return values.join(', ');
      
      default:
        throw new Error(`알 수 없는 집계 타입: ${aggType}`);
    }
  }

  /**
   * 데이터 필터링
   * @param {Array} data - 데이터 배열
   * @param {Object} filters - 필터 조건들
   * @returns {Array} 필터링된 데이터
   */
  filterData(data, filters) {
    return data.filter(row => {
      return Object.entries(filters).every(([field, condition]) => {
        return this.evaluateFilterCondition(row[field], condition);
      });
    });
  }

  /**
   * 필터 조건 평가
   * @param {any} value - 대상 값
   * @param {any} condition - 필터 조건
   * @returns {boolean} 조건 만족 여부
   */
  evaluateFilterCondition(value, condition) {
    if (typeof condition === 'function') {
      return condition(value);
    }

    if (typeof condition === 'object' && condition !== null) {
      const { operator, value: conditionValue } = condition;
      
      switch (operator) {
        case '=':
        case 'eq':
          return value == conditionValue;
        case '!=':
        case 'ne':
          return value != conditionValue;
        case '>':
        case 'gt':
          return parseFloat(value) > parseFloat(conditionValue);
        case '>=':
        case 'gte':
          return parseFloat(value) >= parseFloat(conditionValue);
        case '<':
        case 'lt':
          return parseFloat(value) < parseFloat(conditionValue);
        case '<=':
        case 'lte':
          return parseFloat(value) <= parseFloat(conditionValue);
        case 'in':
          return Array.isArray(conditionValue) && conditionValue.includes(value);
        case 'contains':
          return String(value).toLowerCase().includes(String(conditionValue).toLowerCase());
        case 'starts_with':
          return String(value).toLowerCase().startsWith(String(conditionValue).toLowerCase());
        case 'ends_with':
          return String(value).toLowerCase().endsWith(String(conditionValue).toLowerCase());
        case 'regex':
          return new RegExp(conditionValue).test(String(value));
        default:
          return false;
      }
    }

    // 간단한 동등 비교
    return value == condition;
  }

  /**
   * 데이터 변환
   * @param {Array} data - 원본 데이터
   * @param {Object} transformations - 변환 규칙들
   * @returns {Array} 변환된 데이터
   */
  transformData(data, transformations) {
    return data.map(row => {
      const transformed = { ...row };
      
      Object.entries(transformations).forEach(([targetField, transformation]) => {
        if (typeof transformation === 'function') {
          transformed[targetField] = transformation(row);
        } else if (typeof transformation === 'object') {
          transformed[targetField] = this.executeTransformation(row, transformation);
        } else if (typeof transformation === 'string') {
          // 필드명 복사
          transformed[targetField] = row[transformation];
        }
      });

      return transformed;
    });
  }

  /**
   * 변환 규칙 실행
   * @param {Object} row - 데이터 행
   * @param {Object} transformation - 변환 규칙
   * @returns {any} 변환된 값
   */
  executeTransformation(row, transformation) {
    const { type, source, options = {} } = transformation;

    switch (type) {
      case 'copy':
        return row[source];
      
      case 'format_date':
        return this.formatDate(row[source], options.format);
      
      case 'format_number':
        return this.formatNumber(row[source], options);
      
      case 'concatenate':
        return options.fields.map(field => row[field] || '').join(options.separator || '');
      
      case 'extract':
        return this.extractValue(row[source], options.pattern, options.group || 0);
      
      case 'lookup':
        return this.lookupValue(row[source], options.table, options.keyField, options.valueField);
      
      case 'calculate':
        return this.calculateExpression(row, options.expression);
      
      default:
        return null;
    }
  }

  /**
   * 날짜 형식화
   * @param {any} dateValue - 날짜 값
   * @param {string} format - 형식 문자열
   * @returns {string} 형식화된 날짜
   */
  formatDate(dateValue, format = 'YYYY-MM-DD') {
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '';

      return format
        .replace('YYYY', date.getFullYear())
        .replace('MM', String(date.getMonth() + 1).padStart(2, '0'))
        .replace('DD', String(date.getDate()).padStart(2, '0'))
        .replace('HH', String(date.getHours()).padStart(2, '0'))
        .replace('mm', String(date.getMinutes()).padStart(2, '0'))
        .replace('ss', String(date.getSeconds()).padStart(2, '0'));
    } catch {
      return '';
    }
  }

  /**
   * 숫자 형식화
   * @param {any} numberValue - 숫자 값
   * @param {Object} options - 형식화 옵션
   * @returns {string} 형식화된 숫자
   */
  formatNumber(numberValue, options = {}) {
    const {
      decimals = 0,
      thousandsSeparator = ',',
      decimalSeparator = '.',
      prefix = '',
      suffix = ''
    } = options;

    try {
      const number = parseFloat(numberValue);
      if (isNaN(number)) return '';

      let formatted = number.toFixed(decimals);
      
      if (thousandsSeparator) {
        const parts = formatted.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
        formatted = parts.join(decimalSeparator);
      }

      return prefix + formatted + suffix;
    } catch {
      return '';
    }
  }

  /**
   * 정규식으로 값 추출
   * @param {string} text - 원본 텍스트
   * @param {string} pattern - 정규식 패턴
   * @param {number} group - 캡처 그룹 번호
   * @returns {string} 추출된 값
   */
  extractValue(text, pattern, group = 0) {
    try {
      const match = String(text).match(new RegExp(pattern));
      return match ? (match[group] || '') : '';
    } catch {
      return '';
    }
  }

  /**
   * 조회 테이블에서 값 찾기
   * @param {any} key - 조회 키
   * @param {Array} table - 조회 테이블
   * @param {string} keyField - 키 필드명
   * @param {string} valueField - 값 필드명
   * @returns {any} 조회된 값
   */
  lookupValue(key, table, keyField, valueField) {
    if (!Array.isArray(table)) return null;
    
    const found = table.find(row => row[keyField] == key);
    return found ? found[valueField] : null;
  }

  /**
   * 수식 계산
   * @param {Object} row - 데이터 행
   * @param {string} expression - 계산 수식
   * @returns {number} 계산 결과
   */
  calculateExpression(row, expression) {
    try {
      // 안전한 수식 계산을 위해 제한된 컨텍스트 사용
      const context = { ...row };
      const allowedPattern = /^[\d\s+\-*/().]+$/;
      
      // 필드명을 값으로 치환
      let processedExpression = expression;
      Object.entries(row).forEach(([field, value]) => {
        const fieldPattern = new RegExp(`\\b${field}\\b`, 'g');
        processedExpression = processedExpression.replace(fieldPattern, parseFloat(value) || 0);
      });
      
      if (!allowedPattern.test(processedExpression)) {
        throw new Error('허용되지 않은 연산자 포함');
      }
      
      return new Function('return ' + processedExpression)();
    } catch {
      return 0;
    }
  }

  /**
   * 데이터 품질 검사
   * @param {Array} data - 데이터 배열
   * @param {Object} rules - 품질 검사 규칙
   * @returns {Object} 품질 검사 결과
   */
  validateDataQuality(data, rules = {}) {
    const result = {
      totalRecords: data.length,
      validRecords: 0,
      invalidRecords: 0,
      issues: [],
      fieldIssues: {},
      qualityScore: 0
    };

    data.forEach((row, index) => {
      let isValid = true;
      const rowIssues = [];

      // 필수 필드 검사
      if (rules.requiredFields) {
        rules.requiredFields.forEach(field => {
          if (!row[field] || row[field] === '') {
            rowIssues.push({
              type: 'MISSING_REQUIRED_FIELD',
              field: field,
              message: `필수 필드 '${field}'가 누락되었습니다`
            });
            isValid = false;
          }
        });
      }

      // 데이터 타입 검사
      if (rules.fieldTypes) {
        Object.entries(rules.fieldTypes).forEach(([field, expectedType]) => {
          if (row[field] && !this.validateFieldType(row[field], expectedType)) {
            rowIssues.push({
              type: 'INVALID_DATA_TYPE',
              field: field,
              expected: expectedType,
              actual: typeof row[field],
              value: row[field],
              message: `필드 '${field}'의 데이터 타입이 올바르지 않습니다`
            });
            isValid = false;
          }
        });
      }

      // 값 범위 검사
      if (rules.valueRanges) {
        Object.entries(rules.valueRanges).forEach(([field, range]) => {
          if (row[field] && !this.validateValueRange(row[field], range)) {
            rowIssues.push({
              type: 'VALUE_OUT_OF_RANGE',
              field: field,
              value: row[field],
              range: range,
              message: `필드 '${field}'의 값이 허용 범위를 벗어났습니다`
            });
            isValid = false;
          }
        });
      }

      if (isValid) {
        result.validRecords++;
      } else {
        result.invalidRecords++;
        result.issues.push({
          rowIndex: index,
          issues: rowIssues
        });

        // 필드별 이슈 집계
        rowIssues.forEach(issue => {
          if (!result.fieldIssues[issue.field]) {
            result.fieldIssues[issue.field] = [];
          }
          result.fieldIssues[issue.field].push(issue);
        });
      }
    });

    result.qualityScore = (result.validRecords / result.totalRecords * 100).toFixed(2);

    return result;
  }

  /**
   * 필드 타입 검증
   * @param {any} value - 값
   * @param {string} expectedType - 기대되는 타입
   * @returns {boolean} 유효성
   */
  validateFieldType(value, expectedType) {
    switch (expectedType.toLowerCase()) {
      case 'number':
        return !isNaN(parseFloat(value));
      case 'date':
        return !isNaN(Date.parse(value));
      case 'string':
        return typeof value === 'string' || (value !== null && value !== undefined);
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'phone':
        return /^[\d-+\s()]+$/.test(value);
      default:
        return true;
    }
  }

  /**
   * 값 범위 검증
   * @param {any} value - 값
   * @param {Object} range - 범위 조건
   * @returns {boolean} 유효성
   */
  validateValueRange(value, range) {
    const numValue = parseFloat(value);
    
    if (!isNaN(numValue)) {
      if (range.min !== undefined && numValue < range.min) return false;
      if (range.max !== undefined && numValue > range.max) return false;
    }
    
    if (range.allowedValues && !range.allowedValues.includes(value)) {
      return false;
    }
    
    return true;
  }
}

module.exports = DataProcessor;