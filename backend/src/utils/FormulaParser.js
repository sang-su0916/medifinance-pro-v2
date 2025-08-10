/**
 * Excel 수식 파서
 * Excel 수식을 JavaScript로 변환하고 실행
 */

class FormulaParser {
  constructor() {
    this.functionRegistry = this.initializeFunctionRegistry();
    this.operatorPrecedence = {
      '^': 4,
      '*': 3, '/': 3,
      '+': 2, '-': 2,
      '=': 1, '<>': 1, '<': 1, '>': 1, '<=': 1, '>=': 1,
      '&': 0
    };
  }

  /**
   * Excel 수식을 JavaScript 함수로 파싱
   * @param {string} formula - Excel 수식
   * @param {Object} context - 실행 컨텍스트 (셀 데이터, 함수 등)
   * @returns {Function} JavaScript 함수
   */
  parseFormula(formula, context = {}) {
    try {
      // 수식 전처리
      const cleanFormula = this.preprocessFormula(formula);
      
      // 토큰화
      const tokens = this.tokenize(cleanFormula);
      
      // 구문 분석 및 AST 생성
      const ast = this.parseTokens(tokens);
      
      // JavaScript 코드 생성
      const jsCode = this.generateJavaScript(ast, context);
      
      // 실행 가능한 함수로 변환
      return new Function('context', `
        try {
          return ${jsCode};
        } catch (error) {
          console.error('Formula execution error:', error);
          return '#ERROR!';
        }
      `);
      
    } catch (error) {
      console.error('Formula parsing error:', error);
      return () => '#ERROR!';
    }
  }

  /**
   * 수식 전처리
   * @param {string} formula - 원본 수식
   * @returns {string} 전처리된 수식
   */
  preprocessFormula(formula) {
    let processed = formula;
    
    // = 기호 제거
    if (processed.startsWith('=')) {
      processed = processed.substring(1);
    }
    
    // 한국어 함수명을 영어로 변환
    const koreanFunctions = {
      '합계': 'SUM',
      '평균': 'AVERAGE',
      '개수': 'COUNT',
      '최대값': 'MAX',
      '최소값': 'MIN',
      '찾기': 'FIND',
      '바꾸기': 'SUBSTITUTE',
      '왼쪽': 'LEFT',
      '오른쪽': 'RIGHT',
      '중간': 'MID',
      '길이': 'LEN',
      '상한': 'UPPER',
      '하한': 'LOWER',
      '조건부합계': 'SUMIF',
      '다중조건부합계': 'SUMIFS'
    };
    
    Object.entries(koreanFunctions).forEach(([korean, english]) => {
      const regex = new RegExp(korean, 'gi');
      processed = processed.replace(regex, english);
    });
    
    // 셀 참조 정규화 (절대 참조 표시 제거는 나중에)
    processed = processed.replace(/\$([A-Z]+)\$(\d+)/g, '$1$2');
    processed = processed.replace(/\$([A-Z]+)(\d+)/g, '$1$2');
    processed = processed.replace(/([A-Z]+)\$(\d+)/g, '$1$2');
    
    return processed;
  }

  /**
   * 수식 토큰화
   * @param {string} formula - 전처리된 수식
   * @returns {Array} 토큰 배열
   */
  tokenize(formula) {
    const tokens = [];
    let current = 0;
    
    while (current < formula.length) {
      let char = formula[current];
      
      // 공백 건너뛰기
      if (/\s/.test(char)) {
        current++;
        continue;
      }
      
      // 숫자 (소수점 포함)
      if (/\d/.test(char) || (char === '.' && /\d/.test(formula[current + 1]))) {
        let value = '';
        while (current < formula.length && (/\d/.test(formula[current]) || formula[current] === '.')) {
          value += formula[current];
          current++;
        }
        tokens.push({ type: 'NUMBER', value: parseFloat(value) });
        continue;
      }
      
      // 문자열 리터럴
      if (char === '"') {
        let value = '';
        current++; // 시작 따옴표 건너뛰기
        while (current < formula.length && formula[current] !== '"') {
          value += formula[current];
          current++;
        }
        current++; // 끝 따옴표 건너뛰기
        tokens.push({ type: 'STRING', value: value });
        continue;
      }
      
      // 함수명 또는 셀 참조
      if (/[A-Za-z_]/.test(char)) {
        let value = '';
        while (current < formula.length && /[A-Za-z0-9_]/.test(formula[current])) {
          value += formula[current];
          current++;
        }
        
        // 셀 참조인지 확인 (A1, BC123 형태)
        if (/^[A-Z]+\d+$/.test(value)) {
          tokens.push({ type: 'CELL_REF', value: value });
        } else {
          tokens.push({ type: 'FUNCTION', value: value.toUpperCase() });
        }
        continue;
      }
      
      // 시트 참조 (Sheet1!)
      if (/[A-Za-z0-9_]/.test(char) && formula.substring(current).includes('!')) {
        let value = '';
        while (current < formula.length && formula[current] !== '!') {
          value += formula[current];
          current++;
        }
        current++; // ! 건너뛰기
        tokens.push({ type: 'SHEET_REF', value: value });
        continue;
      }
      
      // 범위 참조 (A1:B10)
      if (char === ':') {
        tokens.push({ type: 'RANGE', value: ':' });
        current++;
        continue;
      }
      
      // 연산자
      if (char === '<' && formula[current + 1] === '>') {
        tokens.push({ type: 'OPERATOR', value: '<>' });
        current += 2;
        continue;
      }
      if (char === '<' && formula[current + 1] === '=') {
        tokens.push({ type: 'OPERATOR', value: '<=' });
        current += 2;
        continue;
      }
      if (char === '>' && formula[current + 1] === '=') {
        tokens.push({ type: 'OPERATOR', value: '>=' });
        current += 2;
        continue;
      }
      if ('+-*/^=<>&'.includes(char)) {
        tokens.push({ type: 'OPERATOR', value: char });
        current++;
        continue;
      }
      
      // 괄호
      if ('()'.includes(char)) {
        tokens.push({ type: 'PAREN', value: char });
        current++;
        continue;
      }
      
      // 쉼표
      if (char === ',') {
        tokens.push({ type: 'COMMA', value: ',' });
        current++;
        continue;
      }
      
      // 인식되지 않는 문자
      current++;
    }
    
    return tokens;
  }

  /**
   * 토큰을 AST로 파싱
   * @param {Array} tokens - 토큰 배열
   * @returns {Object} AST 노드
   */
  parseTokens(tokens) {
    let current = 0;
    
    const parseExpression = () => {
      return parseComparison();
    };
    
    const parseComparison = () => {
      let node = parseArithmetic();
      
      while (current < tokens.length && 
             tokens[current].type === 'OPERATOR' &&
             ['=', '<>', '<', '>', '<=', '>='].includes(tokens[current].value)) {
        const operator = tokens[current].value;
        current++;
        const right = parseArithmetic();
        node = {
          type: 'BinaryOperation',
          operator: operator,
          left: node,
          right: right
        };
      }
      
      return node;
    };
    
    const parseArithmetic = () => {
      let node = parseTerm();
      
      while (current < tokens.length && 
             tokens[current].type === 'OPERATOR' &&
             ['+', '-', '&'].includes(tokens[current].value)) {
        const operator = tokens[current].value;
        current++;
        const right = parseTerm();
        node = {
          type: 'BinaryOperation',
          operator: operator,
          left: node,
          right: right
        };
      }
      
      return node;
    };
    
    const parseTerm = () => {
      let node = parseFactor();
      
      while (current < tokens.length && 
             tokens[current].type === 'OPERATOR' &&
             ['*', '/', '^'].includes(tokens[current].value)) {
        const operator = tokens[current].value;
        current++;
        const right = parseFactor();
        node = {
          type: 'BinaryOperation',
          operator: operator,
          left: node,
          right: right
        };
      }
      
      return node;
    };
    
    const parseFactor = () => {
      const token = tokens[current];
      
      if (!token) {
        throw new Error('Unexpected end of input');
      }
      
      // 숫자
      if (token.type === 'NUMBER') {
        current++;
        return {
          type: 'Number',
          value: token.value
        };
      }
      
      // 문자열
      if (token.type === 'STRING') {
        current++;
        return {
          type: 'String',
          value: token.value
        };
      }
      
      // 셀 참조
      if (token.type === 'CELL_REF') {
        current++;
        
        // 범위 참조 확인 (A1:B10)
        if (current < tokens.length && tokens[current].type === 'RANGE') {
          current++; // : 건너뛰기
          if (current < tokens.length && tokens[current].type === 'CELL_REF') {
            const endCell = tokens[current].value;
            current++;
            return {
              type: 'CellRange',
              start: token.value,
              end: endCell
            };
          }
        }
        
        return {
          type: 'CellReference',
          value: token.value
        };
      }
      
      // 함수 호출
      if (token.type === 'FUNCTION') {
        const functionName = token.value;
        current++;
        
        // 괄호 확인
        if (current < tokens.length && tokens[current].type === 'PAREN' && tokens[current].value === '(') {
          current++; // ( 건너뛰기
          
          const args = [];
          
          // 인수 파싱
          if (current < tokens.length && !(tokens[current].type === 'PAREN' && tokens[current].value === ')')) {
            args.push(parseExpression());
            
            while (current < tokens.length && tokens[current].type === 'COMMA') {
              current++; // , 건너뛰기
              args.push(parseExpression());
            }
          }
          
          // 닫는 괄호 확인
          if (current < tokens.length && tokens[current].type === 'PAREN' && tokens[current].value === ')') {
            current++; // ) 건너뛰기
          } else {
            throw new Error('Expected closing parenthesis');
          }
          
          return {
            type: 'FunctionCall',
            name: functionName,
            arguments: args
          };
        } else {
          // 괄호 없는 함수 (상수 등)
          return {
            type: 'FunctionCall',
            name: functionName,
            arguments: []
          };
        }
      }
      
      // 괄호로 묶인 표현식
      if (token.type === 'PAREN' && token.value === '(') {
        current++; // ( 건너뛰기
        const node = parseExpression();
        
        if (current < tokens.length && tokens[current].type === 'PAREN' && tokens[current].value === ')') {
          current++; // ) 건너뛰기
          return node;
        } else {
          throw new Error('Expected closing parenthesis');
        }
      }
      
      throw new Error(`Unexpected token: ${token.type} ${token.value}`);
    };
    
    return parseExpression();
  }

  /**
   * AST를 JavaScript 코드로 변환
   * @param {Object} ast - AST 노드
   * @param {Object} context - 실행 컨텍스트
   * @returns {string} JavaScript 코드
   */
  generateJavaScript(ast, context) {
    switch (ast.type) {
      case 'Number':
        return ast.value.toString();
      
      case 'String':
        return JSON.stringify(ast.value);
      
      case 'CellReference':
        return `context.getCellValue('${ast.value}')`;
      
      case 'CellRange':
        return `context.getRangeValues('${ast.start}', '${ast.end}')`;
      
      case 'BinaryOperation':
        const left = this.generateJavaScript(ast.left, context);
        const right = this.generateJavaScript(ast.right, context);
        
        switch (ast.operator) {
          case '+': return `(${left} + ${right})`;
          case '-': return `(${left} - ${right})`;
          case '*': return `(${left} * ${right})`;
          case '/': return `(${left} / ${right})`;
          case '^': return `Math.pow(${left}, ${right})`;
          case '&': return `String(${left}) + String(${right})`;
          case '=': return `(${left} == ${right})`;
          case '<>': return `(${left} != ${right})`;
          case '<': return `(${left} < ${right})`;
          case '>': return `(${left} > ${right})`;
          case '<=': return `(${left} <= ${right})`;
          case '>=': return `(${left} >= ${right})`;
          default: 
            throw new Error(`Unknown operator: ${ast.operator}`);
        }
      
      case 'FunctionCall':
        const args = ast.arguments.map(arg => this.generateJavaScript(arg, context));
        return `context.callFunction('${ast.name}', [${args.join(', ')}])`;
      
      default:
        throw new Error(`Unknown AST node type: ${ast.type}`);
    }
  }

  /**
   * 함수 레지스트리 초기화
   * @returns {Object} 함수 레지스트리
   */
  initializeFunctionRegistry() {
    return {
      // 수학 함수
      SUM: (values) => {
        const nums = this.flattenAndFilter(values, (v) => typeof v === 'number');
        return nums.reduce((sum, num) => sum + num, 0);
      },
      
      AVERAGE: (values) => {
        const nums = this.flattenAndFilter(values, (v) => typeof v === 'number');
        return nums.length > 0 ? nums.reduce((sum, num) => sum + num, 0) / nums.length : 0;
      },
      
      COUNT: (values) => {
        const nums = this.flattenAndFilter(values, (v) => typeof v === 'number');
        return nums.length;
      },
      
      MAX: (values) => {
        const nums = this.flattenAndFilter(values, (v) => typeof v === 'number');
        return nums.length > 0 ? Math.max(...nums) : 0;
      },
      
      MIN: (values) => {
        const nums = this.flattenAndFilter(values, (v) => typeof v === 'number');
        return nums.length > 0 ? Math.min(...nums) : 0;
      },
      
      // 조건부 함수
      IF: (condition, trueValue, falseValue) => {
        return condition ? trueValue : falseValue;
      },
      
      SUMIF: (range, criteria, sumRange = null) => {
        const rangeValues = Array.isArray(range) ? range : [range];
        const sumValues = sumRange ? (Array.isArray(sumRange) ? sumRange : [sumRange]) : rangeValues;
        
        let total = 0;
        for (let i = 0; i < rangeValues.length; i++) {
          if (this.matchesCriteria(rangeValues[i], criteria)) {
            total += parseFloat(sumValues[i] || 0) || 0;
          }
        }
        return total;
      },
      
      SUMIFS: (...args) => {
        if (args.length < 3 || args.length % 2 === 0) {
          throw new Error('SUMIFS requires odd number of arguments');
        }
        
        const sumRange = Array.isArray(args[0]) ? args[0] : [args[0]];
        const criteriaRanges = [];
        const criterias = [];
        
        for (let i = 1; i < args.length; i += 2) {
          criteriaRanges.push(Array.isArray(args[i]) ? args[i] : [args[i]]);
          criterias.push(args[i + 1]);
        }
        
        let total = 0;
        for (let i = 0; i < sumRange.length; i++) {
          let matchesAll = true;
          
          for (let j = 0; j < criteriaRanges.length; j++) {
            if (!this.matchesCriteria(criteriaRanges[j][i], criterias[j])) {
              matchesAll = false;
              break;
            }
          }
          
          if (matchesAll) {
            total += parseFloat(sumRange[i] || 0) || 0;
          }
        }
        
        return total;
      },
      
      COUNTIF: (range, criteria) => {
        const rangeValues = Array.isArray(range) ? range : [range];
        return rangeValues.filter(value => this.matchesCriteria(value, criteria)).length;
      },
      
      // 텍스트 함수
      LEFT: (text, numChars) => {
        return String(text).substring(0, numChars);
      },
      
      RIGHT: (text, numChars) => {
        const str = String(text);
        return str.substring(str.length - numChars);
      },
      
      MID: (text, startNum, numChars) => {
        return String(text).substring(startNum - 1, startNum - 1 + numChars);
      },
      
      LEN: (text) => {
        return String(text).length;
      },
      
      CONCATENATE: (...args) => {
        return args.map(arg => String(arg)).join('');
      },
      
      // 조회 함수 (간단한 구현)
      VLOOKUP: (lookupValue, tableArray, colIndexNum, rangeLookup = false) => {
        if (!Array.isArray(tableArray) || tableArray.length === 0) {
          return '#N/A';
        }
        
        for (let i = 0; i < tableArray.length; i++) {
          const row = Array.isArray(tableArray[i]) ? tableArray[i] : [tableArray[i]];
          if (row.length > colIndexNum - 1) {
            if (rangeLookup) {
              if (row[0] <= lookupValue) {
                if (i === tableArray.length - 1 || tableArray[i + 1][0] > lookupValue) {
                  return row[colIndexNum - 1];
                }
              }
            } else {
              if (String(row[0]) === String(lookupValue)) {
                return row[colIndexNum - 1];
              }
            }
          }
        }
        
        return '#N/A';
      },
      
      // 날짜 함수
      TODAY: () => {
        return new Date();
      },
      
      YEAR: (date) => {
        return new Date(date).getFullYear();
      },
      
      MONTH: (date) => {
        return new Date(date).getMonth() + 1;
      },
      
      DAY: (date) => {
        return new Date(date).getDate();
      }
    };
  }

  /**
   * 조건 매칭
   * @param {any} value - 값
   * @param {any} criteria - 조건
   * @returns {boolean} 매칭 여부
   */
  matchesCriteria(value, criteria) {
    const criteriaStr = String(criteria);
    const valueStr = String(value);
    const valueNum = parseFloat(value);
    
    // 비교 연산자 처리
    if (criteriaStr.startsWith('>=')) {
      return valueNum >= parseFloat(criteriaStr.substring(2));
    }
    if (criteriaStr.startsWith('<=')) {
      return valueNum <= parseFloat(criteriaStr.substring(2));
    }
    if (criteriaStr.startsWith('<>')) {
      return valueStr !== criteriaStr.substring(2);
    }
    if (criteriaStr.startsWith('>')) {
      return valueNum > parseFloat(criteriaStr.substring(1));
    }
    if (criteriaStr.startsWith('<')) {
      return valueNum < parseFloat(criteriaStr.substring(1));
    }
    if (criteriaStr.startsWith('=')) {
      return valueStr === criteriaStr.substring(1);
    }
    
    // 와일드카드 패턴 매칭
    if (criteriaStr.includes('*') || criteriaStr.includes('?')) {
      const regexPattern = criteriaStr
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');
      return new RegExp('^' + regexPattern + '$', 'i').test(valueStr);
    }
    
    // 정확한 매칭
    return valueStr === criteriaStr;
  }

  /**
   * 배열 평탄화 및 필터링
   * @param {any} values - 값들
   * @param {Function} filter - 필터 함수
   * @returns {Array} 평탄화되고 필터링된 배열
   */
  flattenAndFilter(values, filter) {
    const flatten = (arr) => {
      const result = [];
      for (const item of arr) {
        if (Array.isArray(item)) {
          result.push(...flatten(item));
        } else {
          result.push(item);
        }
      }
      return result;
    };
    
    const flattened = Array.isArray(values) ? flatten(values) : [values];
    return flattened.filter(filter);
  }

  /**
   * 실행 컨텍스트 생성
   * @param {Object} sheetData - 시트 데이터
   * @param {Object} options - 옵션
   * @returns {Object} 실행 컨텍스트
   */
  createExecutionContext(sheetData, options = {}) {
    return {
      getCellValue: (cellRef) => {
        // 셀 참조를 실제 값으로 변환
        const { row, col } = this.parseCellReference(cellRef);
        return sheetData[row]?.[col] || null;
      },
      
      getRangeValues: (startCell, endCell) => {
        // 범위의 모든 값을 배열로 반환
        const start = this.parseCellReference(startCell);
        const end = this.parseCellReference(endCell);
        
        const values = [];
        for (let row = start.row; row <= end.row; row++) {
          for (let col = start.col; col <= end.col; col++) {
            values.push(sheetData[row]?.[col] || null);
          }
        }
        return values;
      },
      
      callFunction: (functionName, args) => {
        const func = this.functionRegistry[functionName.toUpperCase()];
        if (!func) {
          throw new Error(`Unknown function: ${functionName}`);
        }
        return func(...args);
      }
    };
  }

  /**
   * 셀 참조 파싱
   * @param {string} cellRef - 셀 참조 (예: A1, BC123)
   * @returns {Object} 행/열 좌표
   */
  parseCellReference(cellRef) {
    const match = cellRef.match(/^([A-Z]+)(\d+)$/);
    if (!match) {
      throw new Error(`Invalid cell reference: ${cellRef}`);
    }
    
    const colStr = match[1];
    const rowStr = match[2];
    
    // 열 문자를 숫자로 변환 (A=0, B=1, ..., AA=26, ...)
    let col = 0;
    for (let i = 0; i < colStr.length; i++) {
      col = col * 26 + (colStr.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
    }
    col -= 1; // 0-based 인덱스로 변환
    
    const row = parseInt(rowStr) - 1; // 0-based 인덱스로 변환
    
    return { row, col };
  }
}

module.exports = FormulaParser;