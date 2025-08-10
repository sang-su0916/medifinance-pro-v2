/**
 * Excel 서비스
 * Excel 파일 분석, 수식 추출, 시트 관리
 */

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

class ExcelService {
  constructor() {
    this.formulaPatterns = this.initializeFormulaPatterns();
    this.sheetDependencies = new Map();
    this.extractedFormulas = [];
  }

  /**
   * Excel 파일 전체 분석
   * @param {string} filePath - Excel 파일 경로
   * @returns {Object} 분석 결과
   */
  async analyzeExcelFile(filePath) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const analysisResult = {
      filename: path.basename(filePath),
      sheets: [],
      totalFormulas: 0,
      formulasByType: {},
      sheetDependencies: {},
      complexFormulas: [],
      inputSheets: [],
      outputSheets: [],
      calculationSheets: []
    };

    // 각 시트 분석
    workbook.eachSheet((worksheet, sheetId) => {
      const sheetAnalysis = this.analyzeWorksheet(worksheet);
      analysisResult.sheets.push(sheetAnalysis);
      analysisResult.totalFormulas += sheetAnalysis.formulaCount;

      // 수식 타입별 집계
      Object.keys(sheetAnalysis.formulasByType).forEach(type => {
        analysisResult.formulasByType[type] = 
          (analysisResult.formulasByType[type] || 0) + sheetAnalysis.formulasByType[type];
      });

      // 시트 유형 분류
      this.classifySheetType(sheetAnalysis, analysisResult);
    });

    // 시트간 의존성 분석
    analysisResult.sheetDependencies = this.analyzeSheetDependencies();

    // 복잡한 수식 상위 10개 추출
    analysisResult.complexFormulas = this.extractedFormulas
      .sort((a, b) => b.complexity - a.complexity)
      .slice(0, 10);

    return analysisResult;
  }

  /**
   * 워크시트 분석
   * @param {Object} worksheet - Excel 워크시트
   * @returns {Object} 시트 분석 결과
   */
  analyzeWorksheet(worksheet) {
    const sheetAnalysis = {
      name: worksheet.name,
      formulaCount: 0,
      formulasByType: {},
      formulas: [],
      inputCells: [],
      outputCells: [],
      dataCells: [],
      sheetReferences: new Set()
    };

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        const cellAddress = this.getCellAddress(rowNumber, colNumber);
        
        if (cell.formula) {
          // 수식 셀 분석
          const formulaAnalysis = this.analyzeFormula(cell.formula, worksheet.name, cellAddress);
          sheetAnalysis.formulas.push(formulaAnalysis);
          sheetAnalysis.formulaCount++;

          // 수식 타입별 카운트
          sheetAnalysis.formulasByType[formulaAnalysis.type] = 
            (sheetAnalysis.formulasByType[formulaAnalysis.type] || 0) + 1;

          // 시트 참조 추출
          formulaAnalysis.references.forEach(ref => {
            if (ref.includes('!')) {
              const sheetName = ref.split('!')[0];
              sheetAnalysis.sheetReferences.add(sheetName);
            }
          });

          // 전역 수식 목록에 추가
          this.extractedFormulas.push(formulaAnalysis);

        } else if (cell.value !== null && cell.value !== undefined) {
          // 데이터 셀
          sheetAnalysis.dataCells.push({
            address: cellAddress,
            value: cell.value,
            type: typeof cell.value
          });
        }
      });
    });

    sheetAnalysis.sheetReferences = Array.from(sheetAnalysis.sheetReferences);
    return sheetAnalysis;
  }

  /**
   * 수식 분석
   * @param {string} formula - Excel 수식
   * @param {string} sheetName - 시트명
   * @param {string} cellAddress - 셀 주소
   * @returns {Object} 수식 분석 결과
   */
  analyzeFormula(formula, sheetName, cellAddress) {
    const formulaAnalysis = {
      id: `${sheetName}_${cellAddress}`,
      sheet: sheetName,
      cell: cellAddress,
      formula: formula,
      type: this.classifyFormula(formula),
      complexity: this.calculateFormulaComplexity(formula),
      references: this.extractCellReferences(formula),
      functions: this.extractFunctions(formula),
      parameters: this.extractParameters(formula)
    };

    return formulaAnalysis;
  }

  /**
   * 수식 분류
   * @param {string} formula - Excel 수식
   * @returns {string} 수식 타입
   */
  classifyFormula(formula) {
    const upperFormula = formula.toUpperCase();

    // 조건부 집계 함수
    if (upperFormula.includes('SUMIFS')) return 'SUMIFS';
    if (upperFormula.includes('SUMIF')) return 'SUMIF';
    if (upperFormula.includes('COUNTIFS')) return 'COUNTIFS';
    if (upperFormula.includes('COUNTIF')) return 'COUNTIF';
    if (upperFormula.includes('AVERAGEIFS')) return 'AVERAGEIFS';
    if (upperFormula.includes('AVERAGEIF')) return 'AVERAGEIF';

    // 조회 함수
    if (upperFormula.includes('VLOOKUP')) return 'VLOOKUP';
    if (upperFormula.includes('HLOOKUP')) return 'HLOOKUP';
    if (upperFormula.includes('INDEX') && upperFormula.includes('MATCH')) return 'INDEX_MATCH';
    if (upperFormula.includes('LOOKUP')) return 'LOOKUP';

    // 조건문
    if (upperFormula.includes('IF')) return 'IF';
    if (upperFormula.includes('IFS')) return 'IFS';
    if (upperFormula.includes('SWITCH')) return 'SWITCH';

    // 집계 함수
    if (upperFormula.includes('SUM(')) return 'SUM';
    if (upperFormula.includes('AVERAGE')) return 'AVERAGE';
    if (upperFormula.includes('COUNT')) return 'COUNT';
    if (upperFormula.includes('MAX') || upperFormula.includes('MIN')) return 'MIN_MAX';

    // 날짜/시간 함수
    if (upperFormula.match(/(YEAR|MONTH|DAY|DATE|TODAY|NOW)/)) return 'DATE_TIME';

    // 텍스트 함수
    if (upperFormula.match(/(CONCATENATE|LEFT|RIGHT|MID|LEN|FIND|SUBSTITUTE)/)) return 'TEXT';

    // 수학 함수
    if (upperFormula.match(/(ROUND|CEILING|FLOOR|ABS|SQRT|POWER)/)) return 'MATH';

    return 'OTHER';
  }

  /**
   * 수식 복잡도 계산
   * @param {string} formula - Excel 수식
   * @returns {number} 복잡도 점수
   */
  calculateFormulaComplexity(formula) {
    let complexity = 0;

    // 기본 복잡도 (수식 길이 기반)
    complexity += Math.floor(formula.length / 10);

    // 중첩 함수 개수
    const functions = this.extractFunctions(formula);
    complexity += functions.length * 2;

    // 셀 참조 개수
    const references = this.extractCellReferences(formula);
    complexity += references.length;

    // 시트 참조 개수
    const sheetReferences = references.filter(ref => ref.includes('!'));
    complexity += sheetReferences.length * 3;

    // 특별한 함수들에 대한 가중치
    const specialFunctions = ['SUMIFS', 'VLOOKUP', 'INDEX', 'MATCH'];
    specialFunctions.forEach(func => {
      if (formula.toUpperCase().includes(func)) {
        complexity += 5;
      }
    });

    // 중첩 괄호 개수
    const nestedParentheses = this.countNestedParentheses(formula);
    complexity += nestedParentheses * 2;

    return complexity;
  }

  /**
   * 셀 참조 추출
   * @param {string} formula - Excel 수식
   * @returns {Array} 셀 참조 목록
   */
  extractCellReferences(formula) {
    // Excel 셀 참조 패턴 (A1, $A$1, Sheet1!A1, Sheet1!$A$1 등)
    const cellRefPattern = /(?:[A-Za-z_\[\]]+!)?[$]?[A-Z]+[$]?\d+(?::[$]?[A-Z]+[$]?\d+)?/g;
    const matches = formula.match(cellRefPattern) || [];
    
    // 전체 열/행 참조 패턴 (A:A, 1:1 등)
    const rangeRefPattern = /(?:[A-Za-z_\[\]]+!)?[$]?[A-Z]+:[$]?[A-Z]+/g;
    const rangeMatches = formula.match(rangeRefPattern) || [];
    
    return [...matches, ...rangeMatches];
  }

  /**
   * 함수 추출
   * @param {string} formula - Excel 수식
   * @returns {Array} 함수 목록
   */
  extractFunctions(formula) {
    const functionPattern = /[A-Z]+(?=\()/g;
    return formula.match(functionPattern) || [];
  }

  /**
   * 수식 매개변수 추출
   * @param {string} formula - Excel 수식
   * @returns {Array} 매개변수 목록
   */
  extractParameters(formula) {
    // 함수의 최상위 매개변수만 추출 (중첩 함수 내부 제외)
    const params = [];
    let depth = 0;
    let current = '';
    let inQuotes = false;
    let functionStarted = false;

    for (let i = 0; i < formula.length; i++) {
      const char = formula[i];
      
      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        inQuotes = false;
      }
      
      if (!inQuotes) {
        if (char === '(' && !functionStarted) {
          functionStarted = true;
          continue;
        } else if (char === '(') {
          depth++;
        } else if (char === ')') {
          if (depth === 0 && functionStarted) {
            if (current.trim()) {
              params.push(current.trim());
            }
            break;
          } else {
            depth--;
          }
        } else if (char === ',' && depth === 0 && functionStarted) {
          if (current.trim()) {
            params.push(current.trim());
          }
          current = '';
          continue;
        }
      }
      
      if (functionStarted) {
        current += char;
      }
    }

    return params;
  }

  /**
   * 중첩 괄호 개수 계산
   * @param {string} formula - Excel 수식
   * @returns {number} 중첩 깊이
   */
  countNestedParentheses(formula) {
    let maxDepth = 0;
    let currentDepth = 0;
    let inQuotes = false;

    for (let char of formula) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (!inQuotes) {
        if (char === '(') {
          currentDepth++;
          maxDepth = Math.max(maxDepth, currentDepth);
        } else if (char === ')') {
          currentDepth--;
        }
      }
    }

    return maxDepth;
  }

  /**
   * 시트간 의존성 분석
   * @returns {Object} 의존성 그래프
   */
  analyzeSheetDependencies() {
    const dependencies = {};
    
    this.extractedFormulas.forEach(formula => {
      if (!dependencies[formula.sheet]) {
        dependencies[formula.sheet] = new Set();
      }
      
      formula.references.forEach(ref => {
        if (ref.includes('!')) {
          const referencedSheet = ref.split('!')[0].replace(/'/g, '');
          if (referencedSheet !== formula.sheet) {
            dependencies[formula.sheet].add(referencedSheet);
          }
        }
      });
    });
    
    // Set을 Array로 변환
    Object.keys(dependencies).forEach(sheet => {
      dependencies[sheet] = Array.from(dependencies[sheet]);
    });
    
    return dependencies;
  }

  /**
   * 시트 유형 분류
   * @param {Object} sheetAnalysis - 시트 분석 결과
   * @param {Object} analysisResult - 전체 분석 결과
   */
  classifySheetType(sheetAnalysis, analysisResult) {
    const { name, formulaCount, dataCells, sheetReferences } = sheetAnalysis;

    // 입력 시트: 수식이 거의 없고 데이터가 많음
    if (formulaCount < 10 && dataCells.length > 50) {
      analysisResult.inputSheets.push(name);
    }
    // 계산 시트: 수식이 많고 다른 시트 참조가 많음
    else if (formulaCount > 50 && sheetReferences.length > 0) {
      analysisResult.calculationSheets.push(name);
    }
    // 출력 시트: 중간 정도의 수식과 다른 시트 참조
    else if (formulaCount > 0 && sheetReferences.length > 0) {
      analysisResult.outputSheets.push(name);
    }
    // 기타는 계산 시트로 분류
    else if (formulaCount > 0) {
      analysisResult.calculationSheets.push(name);
    }
  }

  /**
   * 셀 주소 생성
   * @param {number} row - 행 번호
   * @param {number} col - 열 번호
   * @returns {string} 셀 주소 (예: A1)
   */
  getCellAddress(row, col) {
    let columnName = '';
    let temp = col;
    
    while (temp > 0) {
      temp--;
      columnName = String.fromCharCode('A'.charCodeAt(0) + (temp % 26)) + columnName;
      temp = Math.floor(temp / 26);
    }
    
    return columnName + row;
  }

  /**
   * 수식 패턴 초기화
   * @returns {Object} 수식 패턴 정의
   */
  initializeFormulaPatterns() {
    return {
      SUMIFS: {
        description: '조건부 합계',
        syntax: 'SUMIFS(sum_range, criteria_range1, criteria1, [criteria_range2, criteria2]...)',
        example: 'SUMIFS(C:C,A:A,"=Revenue",B:B,">1000")'
      },
      VLOOKUP: {
        description: '수직 조회',
        syntax: 'VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])',
        example: 'VLOOKUP(A2,Sheet2!A:C,3,FALSE)'
      },
      INDEX_MATCH: {
        description: '인덱스-매치 조합',
        syntax: 'INDEX(return_array,MATCH(lookup_value,lookup_array,match_type))',
        example: 'INDEX(C:C,MATCH(A2,B:B,0))'
      }
    };
  }

  /**
   * Excel 파일 생성 (결과 내보내기용)
   * @param {Object} data - 내보낼 데이터
   * @param {string} outputPath - 출력 파일 경로
   * @returns {string} 생성된 파일 경로
   */
  async createExcelFile(data, outputPath) {
    const workbook = new ExcelJS.Workbook();
    
    // 메타데이터 설정
    workbook.creator = 'MediFinance Pro v2';
    workbook.lastModifiedBy = 'System';
    workbook.created = new Date();
    workbook.modified = new Date();

    // 손익계산서 시트
    if (data.incomeStatement) {
      const wsIncomeStatement = workbook.addWorksheet('손익계산서');
      this.createIncomeStatementSheet(wsIncomeStatement, data.incomeStatement);
    }

    // 재무상태표 시트
    if (data.balanceSheet) {
      const wsBalanceSheet = workbook.addWorksheet('재무상태표');
      this.createBalanceSheetSheet(wsBalanceSheet, data.balanceSheet);
    }

    // 월별 집계 시트
    if (data.monthlyData) {
      const wsMonthly = workbook.addWorksheet('월별집계');
      this.createMonthlyDataSheet(wsMonthly, data.monthlyData);
    }

    // 계정별 상세 시트
    if (data.accountDetails) {
      const wsAccountDetails = workbook.addWorksheet('계정별상세');
      this.createAccountDetailsSheet(wsAccountDetails, data.accountDetails);
    }

    // 파일 저장
    await workbook.xlsx.writeFile(outputPath);
    return outputPath;
  }

  /**
   * 손익계산서 시트 생성
   * @param {Object} worksheet - 워크시트 객체
   * @param {Object} incomeStatement - 손익계산서 데이터
   */
  createIncomeStatementSheet(worksheet, incomeStatement) {
    // 헤더 설정
    worksheet.columns = [
      { header: '계정과목', key: 'account', width: 20 },
      { header: '금액', key: 'amount', width: 15 }
    ];

    // 제목 행
    worksheet.addRow(['손익계산서', '']);
    worksheet.addRow(['', '']);

    // 수익 섹션
    worksheet.addRow(['수익', '']);
    if (incomeStatement.revenue) {
      Object.entries(incomeStatement.revenue).forEach(([account, amount]) => {
        worksheet.addRow([account, amount]);
      });
    }

    worksheet.addRow(['', '']);

    // 비용 섹션
    worksheet.addRow(['비용', '']);
    if (incomeStatement.expenses) {
      Object.entries(incomeStatement.expenses).forEach(([account, amount]) => {
        worksheet.addRow([account, amount]);
      });
    }

    worksheet.addRow(['', '']);

    // 순손익
    worksheet.addRow(['순손익', incomeStatement.netIncome || 0]);

    // 스타일 적용
    this.applyBasicStyles(worksheet);
  }

  /**
   * 기본 스타일 적용
   * @param {Object} worksheet - 워크시트 객체
   */
  applyBasicStyles(worksheet) {
    // 헤더 행 스타일
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // 숫자 형식
    worksheet.getColumn('amount').numFmt = '#,##0';
  }

  /**
   * 로우 데이터 파싱
   * @param {string} filePath - 로우 데이터 Excel 파일 경로
   * @returns {Array} 파싱된 거래 데이터
   */
  async parseRawDataFile(filePath) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    const transactions = [];
    
    workbook.eachSheet((worksheet, sheetId) => {
      const sheetTransactions = this.parseWorksheetData(worksheet);
      transactions.push(...sheetTransactions);
    });

    return transactions;
  }

  /**
   * 워크시트 데이터 파싱
   * @param {Object} worksheet - 워크시트 객체
   * @returns {Array} 거래 데이터 배열
   */
  parseWorksheetData(worksheet) {
    const transactions = [];
    let headers = [];
    let headerRowIndex = 0;

    // 헤더 행 찾기
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1 || this.isHeaderRow(row)) {
        headers = [];
        row.eachCell((cell, colNumber) => {
          headers[colNumber] = cell.value ? String(cell.value).trim() : '';
        });
        headerRowIndex = rowNumber;
        return;
      }

      // 데이터 행 처리
      if (rowNumber > headerRowIndex && headers.length > 0) {
        const transaction = {};
        let hasData = false;

        row.eachCell((cell, colNumber) => {
          if (headers[colNumber]) {
            transaction[headers[colNumber]] = cell.value;
            if (cell.value !== null && cell.value !== undefined && cell.value !== '') {
              hasData = true;
            }
          }
        });

        if (hasData) {
          transactions.push(transaction);
        }
      }
    });

    return transactions;
  }

  /**
   * 헤더 행 판단
   * @param {Object} row - Excel 행 객체
   * @returns {boolean} 헤더 행 여부
   */
  isHeaderRow(row) {
    let textCellCount = 0;
    let totalCellCount = 0;

    row.eachCell((cell, colNumber) => {
      if (cell.value !== null && cell.value !== undefined) {
        totalCellCount++;
        if (typeof cell.value === 'string' && cell.value.length > 0) {
          textCellCount++;
        }
      }
    });

    // 텍스트 셀이 80% 이상이면 헤더로 판단
    return totalCellCount > 0 && (textCellCount / totalCellCount) >= 0.8;
  }

  /**
   * 표준 수식 목록 생성 (Excel 분석 결과 기반)
   * @returns {Array} 표준 수식 목록
   */
  generateStandardFormulas() {
    return [
      // 월별 수익 집계 수식들
      {
        id: 'monthly_revenue_1',
        type: 'SUMIFS',
        sheet: '월별요약손익계산서(추정)',
        cell: 'C3',
        formula: 'SUMIFS(매출내역total!$G:$G,매출내역total!$A:$A,C$2,매출내역total!$J:$J,$B3)',
        description: '월별 계정과목별 수익 집계'
      },
      {
        id: 'monthly_revenue_2',
        type: 'SUMIFS',
        sheet: '월별요약손익계산서(추정)',
        cell: 'D3',
        formula: 'SUMIFS(매출내역total!$G:$G,매출내역total!$A:$A,D$2,매출내역total!$J:$J,$B3)',
        description: '월별 계정과목별 수익 집계'
      },
      // ... 추가 수식들
    ];
  }
}

module.exports = ExcelService;